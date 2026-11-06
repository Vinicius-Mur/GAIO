"""Treina o modelo de preco (CatBoost MultiQuantile sobre log do preco) e gera os artefatos do /predict.

Uso: python train.py [caminho_do_csv]
     python train.py --so-estatisticas [caminho_do_csv]   (recalcula so as estatisticas da base, sem retreinar)
"""
import json
import sys
import time

import numpy as np
import pandas as pd
from catboost import CatBoostRegressor, Pool
from sklearn.model_selection import KFold

from common import (
    AMENIDADES, AMOSTRA_MINIMA, ARTIFACTS_DIR, BAIRRO_DESCONHECIDO, CENARIOS, COLUNAS_BASE, DEFAULT_DATASET,
    FEATURES, FEATURES_CATEGORICAS, METADATA_PATH, MODEL_PATH, QUANTIS, ZONA_DESCONHECIDA, normalizar_bairro,
)

PARAMS = {
    "loss_function": "MultiQuantile:alpha=" + ",".join(str(q) for q in QUANTIS),
    "iterations": 1500,
    "learning_rate": 0.05,
    "depth": 6,
    "random_seed": 42,
    "verbose": False,
    "allow_writing_files": False,
}
FRACAO_AUMENTO = {"sem_bairro": 0.15, "sem_localizacao": 0.05}


def carregar(caminho):
    df = pd.read_csv(caminho, sep=";", decimal=",", encoding="utf-8-sig")
    df = df.rename(columns={**COLUNAS_BASE, **AMENIDADES})
    df[list(AMENIDADES.values())] = df[list(AMENIDADES.values())].astype(int)
    df["preco_m2"] = df["price"] / df["areaM2"]
    return df


def prever_quantis(modelo, X):
    # Ordena por linha para garantir P10 <= P50 <= P90 mesmo se os quantis cruzarem.
    return np.sort(np.exp(modelo.predict(Pool(X, cat_features=FEATURES_CATEGORICAS))), axis=1)


def mascarar(X, cenario):
    X = X.copy()
    if cenario in ("sem_bairro", "sem_localizacao"):
        X["bairro"] = BAIRRO_DESCONHECIDO
    if cenario == "sem_localizacao":
        X["zona"] = ZONA_DESCONHECIDA
    return X


def aumentar(X, y, seed=42):
    """Copias sem bairro (e sem zona) para o modelo aprender a incerteza de uma localizacao nao reconhecida."""
    rng = np.random.default_rng(seed)
    partes_X, partes_y = [X], [y]
    for cenario, fracao in FRACAO_AUMENTO.items():
        idx = rng.choice(len(X), int(len(X) * fracao), replace=False)
        partes_X.append(mascarar(X.iloc[idx], cenario))
        partes_y.append(y[idx])
    return pd.concat(partes_X, ignore_index=True), np.concatenate(partes_y)


def treinar(X, y):
    X_aum, y_aum = aumentar(X, y)
    modelo = CatBoostRegressor(**PARAMS)
    modelo.fit(Pool(X_aum, y_aum, cat_features=FEATURES_CATEGORICAS))
    return modelo


def validacao_cruzada(df, folds=5):
    """Predicoes fora da amostra em cada cenario de localizacao; calibra e mede a faixa separadamente em cada um."""
    X, y = df[FEATURES], np.log(df["price"].to_numpy())
    preco = df["price"].to_numpy()
    pred = {c: np.zeros((len(df), len(QUANTIS))) for c in CENARIOS}
    for i, (tr, te) in enumerate(KFold(folds, shuffle=True, random_state=42).split(X), start=1):
        inicio = time.time()
        modelo = treinar(X.iloc[tr], y[tr])
        for cenario in CENARIOS:
            pred[cenario][te] = prever_quantis(modelo, mascarar(X.iloc[te], cenario))
        print(f"  fold {i}/{folds} ({time.time() - inicio:.0f}s)")

    ajustes, metricas = {}, {}
    for cenario, p in pred.items():
        # Calibracao conformal (CQR): quanto alargar a faixa, em log, para cobrir 80% dos precos reais.
        escores = np.maximum(np.log(p[:, 0]) - y, y - np.log(p[:, 2]))
        ajuste = float(np.quantile(escores, QUANTIS[2] - QUANTIS[0]))
        p10, p50, p90 = p[:, 0] * np.exp(-ajuste), p[:, 1], p[:, 2] * np.exp(ajuste)
        erro = np.abs(p50 - preco)
        ajustes[cenario] = ajuste
        metricas[cenario] = {
            "mae": float(erro.mean()),
            "rmse": float(np.sqrt(((p50 - preco) ** 2).mean())),
            "mape": float((erro / preco).mean()),
            "mediana_erro_percentual": float(np.median(erro / preco)),
            "cobertura_faixa_sem_calibracao": float(((preco >= p[:, 0]) & (preco <= p[:, 2])).mean()),
            "cobertura_faixa_calibrada": float(((preco >= p10) & (preco <= p90)).mean()),
            "ajuste_conformal_log": ajuste,
            "meia_largura_relativa_media": float(((p90 - p10) / (2 * p50)).mean()),
        }
    return ajustes, metricas


def _percentis(serie):
    return [float(v) for v in np.percentile(serie, range(0, 101, 5))]


def _por_grupo(df, chave, func):
    resultado = {}
    for valor, grupo in df.groupby(chave):
        if len(grupo) >= AMOSTRA_MINIMA:
            resultado[str(valor)] = func(grupo)
    return resultado


def _quartis(serie):
    return [float(v) for v in serie.quantile([0.25, 0.5, 0.75])]


def _contagem(serie, limite=None):
    valores = serie.clip(upper=limite) if limite is not None else serie
    return {str(k): int(v) for k, v in valores.value_counts().items()}


def _estatisticas_do_recorte(g):
    apartamentos_com_condominio = g[(g["categoria"] == "Apartamentos") & (g["condominio"] > 0)]
    return {
        "n": int(len(g)),
        "preco_m2_mediano": float(g["preco_m2"].median()),
        "preco_m2_quartis": _quartis(g["preco_m2"]),
        "preco_m2_por_categoria": _por_grupo(g, "categoria", lambda c: float(c["preco_m2"].median())),
        "preco_m2_quartis_por_categoria": _por_grupo(g, "categoria", lambda c: _quartis(c["preco_m2"])),
        "n_por_categoria": _por_grupo(g, "categoria", lambda c: int(len(c))),
        "quartos": {str(k): int(v) for k, v in g["quartos"].value_counts().items()},
        "tipos": {str(k): int(v) for k, v in g["tipo"].value_counts().items()},
        # Sem amostra minima: sao contagens, servem para as distribuicoes do dashboard.
        "quartos_por_categoria": {str(c): _contagem(gc["quartos"], 5) for c, gc in g.groupby("categoria")},
        "tipos_por_categoria": {str(c): _contagem(gc["tipo"]) for c, gc in g.groupby("categoria")},
        "condominio_mediano_apto": (
            float(apartamentos_com_condominio["condominio"].median())
            if len(apartamentos_com_condominio) >= AMOSTRA_MINIMA else None
        ),
        "area_percentis_por_categoria": _por_grupo(g, "categoria", lambda c: _percentis(c["areaM2"])),
    }


def _premio_amenidades(g):
    premios = {}
    for campo in AMENIDADES.values():
        com, sem = g[g[campo] == 1], g[g[campo] == 0]
        if len(com) >= AMOSTRA_MINIMA and len(sem) >= AMOSTRA_MINIMA:
            premios[campo] = float(com["preco_m2"].median() / sem["preco_m2"].median() - 1)
    return premios


def estatisticas(df):
    zona_por_bairro = df.groupby("bairro")["zona"].agg(lambda z: z.value_counts().idxmax())
    chaves = {}
    for bairro in zona_por_bairro.index:
        chave = normalizar_bairro(bairro)
        if chave in chaves and chaves[chave] != bairro:
            print(f"  aviso: '{bairro}' e '{chaves[chave]}' viram a mesma chave '{chave}'")
        chaves.setdefault(chave, bairro)

    return {
        "bairros": {b: {"zona": z, "chave": normalizar_bairro(b)} for b, z in zona_por_bairro.items()},
        "cidade": {"preco_m2_mediano": float(df["preco_m2"].median())},
        "por_zona": _por_grupo(df, "zona", _estatisticas_do_recorte),
        "por_bairro": _por_grupo(df, "bairro", _estatisticas_do_recorte),
        # Por zona e categoria, para nao confundir o efeito da amenidade com o de ser casa ou apartamento.
        "premio_amenidade_por_zona_categoria": {
            f"{zona}|{categoria}": _premio_amenidades(g)
            for (zona, categoria), g in df.groupby(["zona", "categoria"])
        },
        "premio_amenidade_por_categoria": {str(c): _premio_amenidades(g) for c, g in df.groupby("categoria")},
    }


def atualizar_estatisticas(caminho):
    """Recalcula as estatisticas da base no metadata.json existente, sem mexer no modelo."""
    df = carregar(caminho)
    metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
    metadata["estatisticas"] = estatisticas(df)
    METADATA_PATH.write_text(json.dumps(metadata, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Estatisticas de {len(df)} imoveis atualizadas em {METADATA_PATH}")


def main():
    argumentos = [a for a in sys.argv[1:] if a != "--so-estatisticas"]
    caminho = argumentos[0] if argumentos else DEFAULT_DATASET
    if "--so-estatisticas" in sys.argv:
        atualizar_estatisticas(caminho)
        return
    df = carregar(caminho)
    print(f"Base: {len(df)} imoveis, {df['bairro'].nunique()} bairros")

    print("Validacao cruzada (5 folds)...")
    ajustes, metricas = validacao_cruzada(df)
    print(json.dumps(metricas, indent=2))

    print("Treinando modelo final com a base inteira...")
    modelo = treinar(df[FEATURES], np.log(df["price"].to_numpy()))

    importancias = dict(zip(FEATURES, modelo.get_feature_importance()))
    principais = sorted(importancias.items(), key=lambda kv: -kv[1])[:8]
    print("Features mais importantes:", ", ".join(f"{k} ({v:.1f})" for k, v in principais))

    ARTIFACTS_DIR.mkdir(exist_ok=True)
    modelo.save_model(str(MODEL_PATH))
    metadata = {
        "features": FEATURES,
        "features_categoricas": FEATURES_CATEGORICAS,
        "quantis": list(QUANTIS),
        "ajuste_conformal_log": ajustes,
        "amostra_minima": AMOSTRA_MINIMA,
        "metricas_validacao_cruzada": metricas,
        "importancia_features": {k: round(float(v), 3) for k, v in importancias.items()},
        "estatisticas": estatisticas(df),
    }
    METADATA_PATH.write_text(json.dumps(metadata, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Artefatos salvos em {ARTIFACTS_DIR}")


if __name__ == "__main__":
    main()
