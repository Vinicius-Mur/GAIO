import pytest
from fastapi.testclient import TestClient

from common import normalizar_bairro
from service import app, resolver_bairro

client = TestClient(app)

APARTAMENTO = {
    "bairroOuCep": "Vila Mariana",
    "areaM2": 105,
    "quartos": 3,
    "banheiros": 2,
    "vagasGaragem": 2,
    "categoria": "Apartamentos",
    "tipo": "Padrão",
    "zona": None,
    "condominio": 850,
}


def prever(**alteracoes):
    resposta = client.post("/predict", json={**APARTAMENTO, **alteracoes})
    assert resposta.status_code == 200, resposta.text
    return resposta.json()


@pytest.mark.parametrize("texto, esperado", [
    ("Vila Mariana, São Paulo", "vila mariana"),
    ("V. Mariana", "vila mariana"),
    ("Jd Paulista - SP", "jardim paulista"),
    ("", ""),
])
def test_normalizar_bairro(texto, esperado):
    assert normalizar_bairro(texto) == esperado


@pytest.mark.parametrize("texto, bairro", [
    ("Vila Mariana, São Paulo", "Vila Mariana"),
    ("V. Mariana", "Vila Mariana"),
    ("Jd Paulistaa", "Jardim Paulista"),
])
def test_resolver_bairro_aceita_variacoes(texto, bairro):
    assert resolver_bairro(texto) == bairro


@pytest.mark.parametrize("texto", ["Bairro Que Nao Existe", "04101-000", ""])
def test_resolver_bairro_nao_inventa_correspondencia(texto):
    assert resolver_bairro(texto) is None


def test_resposta_tem_o_formato_esperado_pelo_backend():
    r = prever()
    assert set(r) == {"valorEstimado", "faixaMinima", "faixaMaxima", "confianca", "insightsMercado", "referenciaMercado"}
    assert r["faixaMinima"] < r["valorEstimado"] < r["faixaMaxima"]
    assert 0 <= r["confianca"] <= 1
    assert 1 <= len(r["insightsMercado"]) <= 3


def test_primeiro_insight_compara_com_a_mesma_categoria_no_bairro():
    insight = prever()["insightsMercado"][0]
    assert insight.startswith("Apartamentos anunciados no bairro Vila Mariana têm m² mediano de R$")
    assert "Neste imóvel o m² estimado é de R$" in insight


def test_casa_e_comparada_com_casas():
    casa = prever(bairroOuCep="Vila Romana", categoria="Casas", areaM2=390, quartos=4, banheiros=4,
                  vagasGaragem=4, condominio=0)
    assert casa["insightsMercado"][0].startswith("Casas anunciadas no bairro Vila Romana")


def test_diferenca_para_a_referencia_vem_explicada_sem_citar_local_nem_area():
    # 1 banheiro e sem vaga puxam o preco para baixo em relacao aos apartamentos do bairro.
    insight = prever(banheiros=1, vagasGaragem=0, condominio=300)["insightsMercado"][0]
    assert "abaixo dessa referência, principalmente por" in insight
    explicacao = insight.split("principalmente por", 1)[1]
    assert "bairro" not in explicacao and "zona" not in explicacao and "m²" not in explicacao


def test_mercado_do_bairro_reconhecido():
    r = client.get("/mercado/bairro", params={"nome": "V. Mariana"})
    assert r.status_code == 200
    dados = r.json()
    assert dados["bairro"] == "Vila Mariana" and dados["fonte"] == "bairro" and dados["anuncios"] > 0
    assert dados["precoM2PorCategoria"]["Apartamentos"] > 0
    assert sum(dados["quartos"].values()) <= dados["anuncios"]


def test_referencia_de_mercado_e_da_mesma_categoria_no_bairro():
    ref = prever()["referenciaMercado"]
    assert ref["local"] == "Vila Mariana" and ref["fonte"] == "bairro" and ref["categoria"] == "Apartamentos"
    assert ref["precoM2P25"] <= ref["precoM2Mediano"] <= ref["precoM2P75"]
    mercado = client.get("/mercado/bairro", params={"nome": "Vila Mariana"}).json()
    assert ref["precoM2Mediano"] == mercado["precoM2PorCategoria"]["Apartamentos"]
    assert ref["anuncios"] == mercado["anunciosPorCategoria"]["Apartamentos"]


def test_sem_localizacao_nao_tem_referencia():
    assert prever(bairroOuCep="Lugar Inexistente", zona=None)["referenciaMercado"] is None


def test_mercado_conta_anuncios_por_categoria():
    dados = client.get("/mercado/bairro", params={"nome": "Pinheiros"}).json()
    assert sum(dados["anunciosPorCategoria"].values()) <= dados["anuncios"]
    assert dados["anunciosPorCategoria"]["Casas"] < dados["anuncios"]


def test_mercado_de_bairro_desconhecido_responde_404():
    assert client.get("/mercado/bairro", params={"nome": "Bairro Que Nao Existe"}).status_code == 404


def test_bairro_reconhecido_da_mais_confianca_que_localizacao_desconhecida():
    # A calibracao alarga a faixa em media por cenario; entre "so zona" e "nada" a ordem nao vale imovel a imovel.
    com_bairro = prever()["confianca"]
    so_zona = prever(bairroOuCep="Bairro Que Nao Existe", zona="SUL")["confianca"]
    sem_localizacao = prever(bairroOuCep="04101-000")["confianca"]
    assert com_bairro > max(so_zona, sem_localizacao)


def test_bairro_desconhecido_e_avisado_no_primeiro_insight():
    insights = prever(bairroOuCep="Bairro Que Nao Existe", zona="LESTE")["insightsMercado"]
    assert insights[0].startswith("Bairro não encontrado")
    assert "na zona Leste" in insights[0]


def test_imovel_maior_vale_mais():
    assert prever(areaM2=200)["valorEstimado"] > prever(areaM2=60)["valorEstimado"]


def test_textos_concordam_com_o_genero_da_categoria():
    casa = prever(bairroOuCep="Vila Romana", categoria="Casas", areaM2=390, quartos=4, banheiros=4,
                  vagasGaragem=4, condominio=0, churrasqueira=True)
    texto = " ".join(casa["insightsMercado"])
    assert "dos casas" not in texto and "que os sem" not in texto


def test_resumo_do_mercado():
    r = client.get("/mercado/resumo")
    assert r.status_code == 200
    d = r.json()
    assert d["totalAnuncios"] == sum(z["anuncios"] for z in d["zonas"]) > 20000
    assert {z["zona"] for z in d["zonas"]} == {"NORTE", "SUL", "LESTE", "OESTE", "CENTRO"}
    bairros = d["bairros"]
    assert {b["categoria"] for b in bairros} == {"Apartamentos", "Casas"}
    assert all(b["anuncios"] >= d["minimoAnunciosRanking"] for b in bairros)
    assert all(b["precoM2P25"] <= b["precoM2"] <= b["precoM2P75"] for b in bairros)
    assert [b["precoM2"] for b in bairros] == sorted((b["precoM2"] for b in bairros), reverse=True)
    assert sum(x["anuncios"] for x in d["distribuicoes"]) == d["totalAnuncios"]
    assert all(sum(x["quartos"].values()) == sum(x["tipos"].values()) == x["anuncios"] for x in d["distribuicoes"])
    assert any(p["zona"] is None for p in d["premiosAmenidades"])
    assert {c["cenario"] for c in d["modelo"]["cenarios"]} == {"completo", "sem_bairro", "sem_localizacao"}
    assert d["modelo"]["importancias"][0]["variavel"] == "areaM2"

