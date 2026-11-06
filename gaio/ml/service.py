"""Servico HTTP do modelo de preco. Rodar com: uvicorn service:app --port 8000"""
import json
from bisect import bisect_left
from typing import Optional

import numpy as np
import pandas as pd
from catboost import CatBoostRegressor, Pool
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from rapidfuzz import fuzz, process

from common import (
    AMENIDADES, BAIRRO_DESCONHECIDO, FEATURES, FEATURES_CATEGORICAS, METADATA_PATH, MODEL_PATH, QUANTIS,
    ZONA_DESCONHECIDA, normalizar_bairro,
)

SIMILARIDADE_MINIMA = 90
PREMIO_MINIMO_AMENIDADE = 0.05
PARTICIPACAO_MAXIMA_TIPO_RARO = 0.10
MAX_INSIGHTS = 3

LOCAL_ZONA = {"NORTE": "na zona Norte", "SUL": "na zona Sul", "LESTE": "na zona Leste", "OESTE": "na zona Oeste",
              "CENTRO": "no Centro"}
# Categoria -> (plural, "dos/das", "os/as"), para concordar o genero nos textos.
CATEGORIA_TEXTO = {"Apartamentos": ("apartamentos", "dos", "os"), "Casas": ("casas", "das", "as")}
PLURAL_TIPO = {
    "Cobertura": "Coberturas", "Kitnet": "Kitnets", "Loft": "Lofts", "Casa de condomínio": "Casas de condomínio",
    "Casa de vila": "Casas de vila", "Duplex ou triplex": "Duplex e triplex",
}
# Amenidades com leitura clara para o usuario; as demais aparecem confundidas com o perfil do imovel na base.
AMENIDADES_DESTAQUE = {
    "piscina": "piscina", "academia": "academia", "elevador": "elevador", "arCondicionado": "ar-condicionado",
    "mobiliado": "mobília", "salaoFestas": "salão de festas", "varanda": "varanda", "churrasqueira": "churrasqueira",
    "seguranca24h": "segurança 24h", "portaria": "portaria", "condominioFechado": "condomínio fechado",
}

# Nome de cada amenidade nos textos ("ter piscina", "nao ter elevador").
NOME_AMENIDADE = {
    "academia": "academia", "elevador": "elevador", "permitidoAnimais": "permissão para animais",
    "piscina": "piscina", "portaria": "portaria", "salaoFestas": "salão de festas",
    "condominioFechado": "condomínio fechado", "seguranca24h": "segurança 24h",
    "portaoEletronico": "portão eletrônico", "areaMurada": "área murada", "areaServico": "área de serviço",
    "armariosCozinha": "armários na cozinha", "armariosQuarto": "armários no quarto",
    "churrasqueira": "churrasqueira", "mobiliado": "mobília", "quartoServico": "quarto de serviço",
    "arCondicionado": "ar-condicionado", "porteiro24h": "porteiro 24h", "varanda": "varanda",
}
# A explicacao do m2 ignora localizacao (e a mesma da referencia) e area (o modelo explica o preco
# total; area pequena puxa o total para baixo, mas costuma ter m2 mais caro).
FORA_DA_EXPLICACAO = {"bairro", "zona", "areaM2"}
CONTRIBUICAO_MINIMA = 0.02  # ~2% no preco
FAIXA_EM_LINHA = 0.05

modelo = CatBoostRegressor()
modelo.load_model(str(MODEL_PATH))
metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
stats = metadata["estatisticas"]
ajustes_log = metadata["ajuste_conformal_log"]
bairro_por_chave = {info["chave"]: nome for nome, info in stats["bairros"].items()}

app = FastAPI(title="GAIÒ - modelo de preço")


class ImovelFeatures(BaseModel):
    bairroOuCep: str
    areaM2: float
    quartos: int
    banheiros: int
    vagasGaragem: int
    categoria: str
    tipo: str
    zona: Optional[str] = None
    condominio: float
    academia: bool = False
    elevador: bool = False
    permitidoAnimais: bool = False
    piscina: bool = False
    portaria: bool = False
    salaoFestas: bool = False
    condominioFechado: bool = False
    seguranca24h: bool = False
    portaoEletronico: bool = False
    areaMurada: bool = False
    areaServico: bool = False
    armariosCozinha: bool = False
    armariosQuarto: bool = False
    churrasqueira: bool = False
    mobiliado: bool = False
    quartoServico: bool = False
    arCondicionado: bool = False
    porteiro24h: bool = False
    varanda: bool = False


class ReferenciaMercado(BaseModel):
    """m2 dos anuncios da mesma categoria no local (bairro ou, com pouca amostra, zona)."""
    local: str
    fonte: str
    categoria: Optional[str] = None
    anuncios: int
    precoM2Mediano: float
    precoM2P25: float
    precoM2P75: float


class PredicaoImovel(BaseModel):
    valorEstimado: float
    faixaMinima: float
    faixaMaxima: float
    confianca: float
    insightsMercado: list[str]
    referenciaMercado: Optional[ReferenciaMercado] = None


def resolver_bairro(texto):
    chave = normalizar_bairro(texto)
    if not chave:
        return None
    if chave in bairro_por_chave:
        return bairro_por_chave[chave]
    achado = process.extractOne(chave, bairro_por_chave.keys(), scorer=fuzz.ratio, score_cutoff=SIMILARIDADE_MINIMA)
    return bairro_por_chave[achado[0]] if achado else None


def reais(valor):
    return "R$ " + f"{valor:,.0f}".replace(",", ".")


def pct(valor):
    return f"{abs(valor) * 100:.0f}%"


def _recorte(bairro, zona):
    """Estatisticas do bairro quando ha amostra suficiente; senao, da zona. Devolve o local ja com preposicao."""
    if bairro and bairro in stats["por_bairro"]:
        return stats["por_bairro"][bairro], f"no bairro {bairro}"
    if zona in stats["por_zona"]:
        return stats["por_zona"][zona], LOCAL_ZONA[zona]
    return None, None


def referencia_mercado(categoria, bairro, zona):
    """Mesma referencia usada no primeiro insight, em numeros, para o dashboard posicionar a estimativa."""
    if bairro and bairro in stats["por_bairro"]:
        recorte, local, fonte = stats["por_bairro"][bairro], bairro, "bairro"
    elif zona in stats["por_zona"]:
        recorte, local, fonte = stats["por_zona"][zona], zona, "zona"
    else:
        return None
    quartis = recorte.get("preco_m2_quartis_por_categoria", {}).get(categoria)
    if quartis:
        anuncios = recorte["n_por_categoria"][categoria]
    else:
        quartis, anuncios, categoria = recorte["preco_m2_quartis"], recorte["n"], None
    p25, p50, p75 = quartis
    return ReferenciaMercado(local=local, fonte=fonte, categoria=categoria, anuncios=anuncios,
                             precoM2Mediano=p50, precoM2P25=p25, precoM2P75=p75)


def _plural(n, singular, plural):
    return f"{n} {singular if n == 1 else plural}"


def descrever_fator(campo, f, contribuicao):
    """Texto do fator que puxou o preco, ou None quando a leitura ficaria enganosa."""
    valor = getattr(f, campo)
    if campo == "quartos":
        return "ter " + _plural(valor, "quarto", "quartos")
    if campo == "banheiros":
        return "ter " + _plural(valor, "banheiro", "banheiros")
    if campo == "vagasGaragem":
        return "não ter vaga de garagem" if valor == 0 else "ter " + _plural(valor, "vaga de garagem", "vagas de garagem")
    if campo == "condominio":
        return "não ter condomínio" if valor == 0 else f"o condomínio de {reais(valor)}"
    if campo == "categoria":
        return "ser casa" if valor == "Casas" else "ser apartamento"
    if campo == "tipo":
        return f"ser do tipo {valor.lower()}"
    if campo in NOME_AMENIDADE:
        if valor and contribuicao > 0:
            return f"ter {NOME_AMENIDADE[campo]}"
        if not valor and contribuicao < 0:
            return f"não ter {NOME_AMENIDADE[campo]}"
    return None


def fatores_da_diferenca(f, contribuicoes, sentido, limite=2):
    """Caracteristicas que mais puxaram o preco no mesmo sentido da diferenca para a referencia."""
    candidatos = sorted(
        ((campo, c) for campo, c in contribuicoes.items()
         if campo not in FORA_DA_EXPLICACAO and c * sentido > 0 and abs(c) >= CONTRIBUICAO_MINIMA),
        key=lambda kv: -abs(kv[1]),
    )
    textos = []
    for campo, c in candidatos:
        texto = descrever_fator(campo, f, c)
        if texto:
            textos.append(texto)
        if len(textos) == limite:
            break
    return textos


def insight_referencia(f, recorte, local, valor, contribuicoes):
    """Compara o m2 com imoveis da mesma categoria no local e explica a diferenca, sem julgar o preco."""
    por_categoria = recorte.get("preco_m2_por_categoria", {})
    if f.categoria in por_categoria:
        referencia = por_categoria[f.categoria]
        sujeito = f"{CATEGORIA_TEXTO[f.categoria][0].capitalize()} anunciad{'as' if f.categoria == 'Casas' else 'os'}"
    else:
        referencia = recorte["preco_m2_mediano"]
        sujeito = "Imóveis anunciados"
    preco_m2 = valor / f.areaM2
    diferenca = preco_m2 / referencia - 1
    base = f"{sujeito} {local} têm m² mediano de {reais(referencia)}."

    if abs(diferenca) < FAIXA_EM_LINHA:
        return f"{base} Neste imóvel o m² estimado é de {reais(preco_m2)}, em linha com essa referência."

    comparacao = "acima" if diferenca > 0 else "abaixo"
    fatores = fatores_da_diferenca(f, contribuicoes, 1 if diferenca > 0 else -1)
    texto = f"{base} Neste imóvel o m² estimado é de {reais(preco_m2)}, {pct(diferenca)} {comparacao} dessa referência"
    if fatores:
        segundo = fatores[1][len("ter "):] if len(fatores) == 2 and fatores[0].startswith("ter ") and fatores[1].startswith("ter ") else None
        if len(fatores) == 1:
            motivo = fatores[0]
        else:
            motivo = f"{fatores[0]} e {segundo or fatores[1]}"
        return f"{texto}, principalmente por {motivo}."
    return f"{texto}."


def gerar_insights(f, bairro, zona, valor, contribuicoes):
    insights = []
    recorte, local = _recorte(bairro, zona)

    if bairro is None:
        base = f"{LOCAL_ZONA[zona]} e nas demais características" if zona in LOCAL_ZONA else "nas demais características"
        insights.append(f"Bairro não encontrado na base de anúncios; a estimativa se apoia {base}.")

    if recorte is None:
        return insights[:MAX_INSIGHTS]

    insights.append(insight_referencia(f, recorte, local, valor, contribuicoes))

    plural, de, artigo = CATEGORIA_TEXTO[f.categoria]
    candidatos = []
    quartos = str(min(f.quartos, 5))
    participacao = recorte["quartos"].get(quartos, 0) / recorte["n"]
    rotulo_quartos = "5 ou mais quartos" if quartos == "5" else f"{quartos} quarto{'s' if quartos != '1' else ''}"
    candidatos.append((abs(participacao - 0.25),
                       f"Imóveis com {rotulo_quartos} são {pct(participacao)} da oferta {local}."))

    participacao_tipo = recorte["tipos"].get(f.tipo, 0) / recorte["n"]
    if f.tipo in PLURAL_TIPO and participacao_tipo < PARTICIPACAO_MAXIMA_TIPO_RARO:
        candidatos.append((1 - participacao_tipo,
                           f"{PLURAL_TIPO[f.tipo]} são {pct(participacao_tipo)} da oferta {local}, "
                           "um perfil pouco comum."))

    mediana_condominio = recorte.get("condominio_mediano_apto")
    if f.categoria == "Apartamentos" and f.condominio > 0 and mediana_condominio:
        diferenca_cond = f.condominio / mediana_condominio - 1
        sentido_cond = "acima" if diferenca_cond >= 0 else "abaixo"
        candidatos.append((abs(diferenca_cond),
                           f"O condomínio de {reais(f.condominio)} está {pct(diferenca_cond)} {sentido_cond} "
                           f"da mediana dos apartamentos {local} ({reais(mediana_condominio)})."))

    premios = stats["premio_amenidade_por_zona_categoria"].get(f"{zona}|{f.categoria}", {})
    marcadas = [(premios[c], c) for c in AMENIDADES_DESTAQUE if getattr(f, c) and premios.get(c, 0) >= PREMIO_MINIMO_AMENIDADE]
    if marcadas:
        premio, campo = max(marcadas)
        candidatos.append((premio,
                           f"{LOCAL_ZONA[zona][0].upper()}{LOCAL_ZONA[zona][1:]}, {plural} com {AMENIDADES_DESTAQUE[campo]} "
                           f"têm m² mediano {pct(premio)} maior que {artigo} sem."))

    percentis = recorte["area_percentis_por_categoria"].get(f.categoria)
    if percentis:
        posicao = bisect_left(percentis, f.areaM2) / (len(percentis) - 1)
        posicao = min(max(posicao, 0.0), 1.0)
        if posicao >= 0.5:
            texto_area = f"{f.areaM2:.0f} m² é maior que {pct(posicao)} {de} {plural} {local}."
        else:
            texto_area = f"{f.areaM2:.0f} m² é menor que {pct(1 - posicao)} {de} {plural} {local}."
        candidatos.append((abs(posicao - 0.5), texto_area))

    candidatos.sort(key=lambda c: -c[0])
    insights += [texto for _, texto in candidatos]
    return insights[:MAX_INSIGHTS]


@app.get("/health")
def health():
    return {"status": "ok", "metricas_validacao_cruzada": metadata["metricas_validacao_cruzada"]}


@app.post("/predict", response_model=PredicaoImovel)
def predict(f: ImovelFeatures):
    bairro = resolver_bairro(f.bairroOuCep)
    if bairro:
        zona = stats["bairros"][bairro]["zona"]
    else:
        zona = f.zona if f.zona in LOCAL_ZONA else ZONA_DESCONHECIDA

    linha = f.model_dump()
    linha.update(bairro=bairro or BAIRRO_DESCONHECIDO, zona=zona)
    for campo in AMENIDADES.values():
        linha[campo] = int(linha[campo])
    X = pd.DataFrame([linha])[FEATURES]

    if bairro:
        cenario = "completo"
    else:
        cenario = "sem_bairro" if zona in LOCAL_ZONA else "sem_localizacao"
    ajuste = ajustes_log[cenario]

    pool = Pool(X, cat_features=FEATURES_CATEGORICAS)
    log_p10, log_p50, log_p90 = np.sort(modelo.predict(pool)[0])
    # Contribuicao de cada variavel para o P50 (em log do preco), para explicar o resultado.
    shap_p50 = modelo.get_feature_importance(pool, type="ShapValues")[0][QUANTIS.index(0.5)]
    contribuicoes = dict(zip(FEATURES, shap_p50[:-1]))
    valor = float(np.exp(log_p50))
    minimo = float(np.exp(log_p10 - ajuste))
    maximo = float(np.exp(log_p90 + ajuste))

    # Confianca = 1 - meia largura relativa da faixa calibrada (80%); nao e uma probabilidade.
    confianca = min(max(1 - (maximo - minimo) / (2 * valor), 0.0), 1.0)

    return PredicaoImovel(
        valorEstimado=round(valor, -3),
        faixaMinima=round(minimo, -3),
        faixaMaxima=round(maximo, -3),
        confianca=round(confianca, 2),
        insightsMercado=gerar_insights(f, bairro, zona, valor, contribuicoes),
        referenciaMercado=referencia_mercado(f.categoria, bairro, zona),
    )


class MercadoBairro(BaseModel):
    bairro: str
    zona: str
    fonte: str
    anuncios: int
    precoM2Mediano: float
    precoM2PorCategoria: dict[str, float]
    precoM2QuartisPorCategoria: dict[str, list[float]] = {}
    anunciosPorCategoria: dict[str, int] = {}
    quartos: dict[str, int]
    tipos: dict[str, int]
    condominioMedianoApartamentos: Optional[float] = None


@app.get("/mercado/bairro", response_model=MercadoBairro)
def mercado_bairro(nome: str):
    """Estatisticas dos anuncios do bairro (ou da zona, quando o bairro tem poucos anuncios)."""
    bairro = resolver_bairro(nome)
    if not bairro:
        raise HTTPException(status_code=404, detail="Bairro não encontrado na base de anúncios.")
    zona = stats["bairros"][bairro]["zona"]
    if bairro in stats["por_bairro"]:
        recorte, fonte = stats["por_bairro"][bairro], "bairro"
    elif zona in stats["por_zona"]:
        recorte, fonte = stats["por_zona"][zona], "zona"
    else:
        raise HTTPException(status_code=404, detail="Sem anúncios suficientes para este local.")
    return MercadoBairro(
        bairro=bairro,
        zona=zona,
        fonte=fonte,
        anuncios=recorte["n"],
        precoM2Mediano=recorte["preco_m2_mediano"],
        precoM2PorCategoria=recorte.get("preco_m2_por_categoria", {}),
        precoM2QuartisPorCategoria=recorte.get("preco_m2_quartis_por_categoria", {}),
        anunciosPorCategoria=recorte.get("n_por_categoria", {}),
        quartos=recorte["quartos"],
        tipos=recorte["tipos"],
        condominioMedianoApartamentos=recorte.get("condominio_mediano_apto"),
    )


class ZonaResumo(BaseModel):
    zona: str
    anuncios: int
    precoM2Mediano: float
    precoM2PorCategoria: dict[str, float]


class BairroPreco(BaseModel):
    bairro: str
    zona: str
    categoria: str
    precoM2: float
    precoM2P25: float
    precoM2P75: float
    anuncios: int


class PremioAmenidade(BaseModel):
    zona: Optional[str] = None  # None = cidade toda
    categoria: str
    amenidade: str
    premio: float


class Distribuicao(BaseModel):
    zona: str
    categoria: str
    anuncios: int
    tipos: dict[str, int]
    quartos: dict[str, int]


class Cenario(BaseModel):
    cenario: str
    erroMediano: float
    mape: float
    cobertura: float
    meiaLargura: float


class Importancia(BaseModel):
    variavel: str
    peso: float


class ModeloResumo(BaseModel):
    cenarios: list[Cenario]
    importancias: list[Importancia]


class MercadoResumo(BaseModel):
    totalAnuncios: int
    minimoAnunciosRanking: int
    zonas: list[ZonaResumo]
    bairros: list[BairroPreco]
    premiosAmenidades: list[PremioAmenidade]
    distribuicoes: list[Distribuicao]
    modelo: ModeloResumo


# Ranking so com bairros que tem amostra razoavel na categoria; com menos, a mediana oscila demais.
MINIMO_ANUNCIOS_RANKING = 30


def _montar_resumo():
    por_zona, por_bairro = stats["por_zona"], stats["por_bairro"]
    zonas = [
        ZonaResumo(zona=z, anuncios=r["n"], precoM2Mediano=r["preco_m2_mediano"],
                   precoM2PorCategoria=r.get("preco_m2_por_categoria", {}))
        for z, r in sorted(por_zona.items(), key=lambda kv: -kv[1]["preco_m2_mediano"])
    ]

    bairros = sorted(
        (
            BairroPreco(bairro=b, zona=stats["bairros"][b]["zona"], categoria=categoria, precoM2=p50,
                        precoM2P25=p25, precoM2P75=p75, anuncios=r["n_por_categoria"][categoria])
            for b, r in por_bairro.items()
            for categoria, (p25, p50, p75) in r.get("preco_m2_quartis_por_categoria", {}).items()
            if r["n_por_categoria"][categoria] >= MINIMO_ANUNCIOS_RANKING
        ),
        key=lambda x: -x.precoM2,
    )

    premios = [
        PremioAmenidade(zona=chave.split("|")[0], categoria=chave.split("|")[1], amenidade=amenidade, premio=premio)
        for chave, valores in stats["premio_amenidade_por_zona_categoria"].items()
        for amenidade, premio in valores.items() if amenidade in AMENIDADES_DESTAQUE
    ] + [
        PremioAmenidade(zona=None, categoria=categoria, amenidade=amenidade, premio=premio)
        for categoria, valores in stats["premio_amenidade_por_categoria"].items()
        for amenidade, premio in valores.items() if amenidade in AMENIDADES_DESTAQUE
    ]

    distribuicoes = [
        Distribuicao(zona=z, categoria=c, anuncios=sum(quartos.values()), tipos=r["tipos_por_categoria"][c], quartos=quartos)
        for z, r in por_zona.items()
        for c, quartos in r["quartos_por_categoria"].items()
    ]

    metricas = metadata["metricas_validacao_cruzada"]
    cenarios = [
        Cenario(cenario=nome, erroMediano=m["mediana_erro_percentual"], mape=m["mape"],
                cobertura=m["cobertura_faixa_calibrada"], meiaLargura=m["meia_largura_relativa_media"])
        for nome, m in metricas.items()
    ]
    importancias = [
        Importancia(variavel=v, peso=p)
        for v, p in sorted(metadata["importancia_features"].items(), key=lambda kv: -kv[1])
    ]

    return MercadoResumo(
        totalAnuncios=sum(r["n"] for r in por_zona.values()),
        minimoAnunciosRanking=MINIMO_ANUNCIOS_RANKING,
        zonas=zonas,
        bairros=bairros,
        premiosAmenidades=premios,
        distribuicoes=distribuicoes,
        modelo=ModeloResumo(cenarios=cenarios, importancias=importancias),
    )


# Os metadados nao mudam enquanto o servico roda: o resumo e montado uma vez.
resumo_mercado = _montar_resumo()


@app.get("/mercado/resumo", response_model=MercadoResumo)
def mercado_resumo():
    """Panorama da base de anuncios usada no treino e qualidade do modelo (validacao cruzada)."""
    return resumo_mercado
