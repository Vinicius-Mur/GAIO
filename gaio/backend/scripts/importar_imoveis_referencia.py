"""Carrega o CSV de imoveis tratados (colega de dados) na tabela
imoveis_referencia (ver V2__imoveis_referencia.sql).

Nao faz parte do Flyway de proposito: e uma carga de dados pontual (roda
uma vez, ou toda vez que o colega de dados gerar uma base tratada nova),
nao uma mudanca de schema.

Como rodar:
    pip install pandas sqlalchemy psycopg2-binary
    python importar_imoveis_referencia.py [--csv CAMINHO] [--truncate]

Variaveis de ambiente usadas (mesmos defaults do docker-compose/app):
    DB_HOST (localhost), DB_PORT (5432), DB_NAME (gaio_calculadora),
    DB_USER (gaio), DB_PASSWORD (gaio)
"""

import argparse
import os
import sys
from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine, text

COLUNAS_CSV_PARA_BANCO = {
    "price": "price",
    "Categoria": "categoria",
    "Tipo": "tipo",
    "Condomínio": "condominio",
    "Área útil": "area_util",
    "Quartos": "quartos",
    "Banheiros": "banheiros",
    "Vagas na garagem": "vagas_garagem",
    "ZONA": "zona",
    "Academia": "academia",
    "Elevador": "elevador",
    "Permitido animais": "permitido_animais",
    "Piscina": "piscina",
    "Portaria": "portaria",
    "Salão de festas": "salao_festas",
    "Condomínio fechado": "condominio_fechado",
    "Segurança 24h": "seguranca_24h",
    "Portão eletrônico": "portao_eletronico",
    "Área murada": "area_murada",
    "Área de serviço": "area_servico",
    "Armários na cozinha": "armarios_cozinha",
    "Armários no quarto": "armarios_quarto",
    "Churrasqueira": "churrasqueira",
    "Mobiliado": "mobiliado",
    "Quarto de serviço": "quarto_servico",
    "Ar condicionado": "ar_condicionado",
    "Porteiro 24h": "porteiro_24h",
    "Varanda": "varanda",
    "bairro": "bairro",
}

COLUNAS_BOOLEANAS = [
    "academia", "elevador", "permitido_animais", "piscina", "portaria",
    "salao_festas", "condominio_fechado", "seguranca_24h",
    "portao_eletronico", "area_murada", "area_servico", "armarios_cozinha",
    "armarios_quarto", "churrasqueira", "mobiliado", "quarto_servico",
    "ar_condicionado", "porteiro_24h", "varanda",
]

REPO_ROOT = Path(__file__).resolve().parents[2]


def localizar_csv_padrao() -> Path:
    candidatos = list(REPO_ROOT.glob("*.csv"))
    if len(candidatos) == 1:
        return candidatos[0]
    raise SystemExit(
        "Nao foi possivel adivinhar o CSV automaticamente. "
        "Use --csv caminho/do/arquivo.csv"
    )


def montar_url_conexao() -> str:
    usuario = os.getenv("DB_USER", "gaio")
    senha = os.getenv("DB_PASSWORD", "gaio")
    host = os.getenv("DB_HOST", "localhost")
    porta = os.getenv("DB_PORT", "5432")
    banco = os.getenv("DB_NAME", "gaio_calculadora")
    return f"postgresql+psycopg2://{usuario}:{senha}@{host}:{porta}/{banco}"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", type=Path, default=None,
                         help="Caminho do CSV tratado (default: acha sozinho na raiz do repo)")
    parser.add_argument("--truncate", action="store_true",
                         help="Apaga os dados existentes antes de importar")
    args = parser.parse_args()

    caminho_csv = args.csv or localizar_csv_padrao()
    print(f"Lendo {caminho_csv} ...")

    df = pd.read_csv(caminho_csv, sep=";", decimal=",", encoding="utf-8-sig")

    colunas_faltando = set(COLUNAS_CSV_PARA_BANCO) - set(df.columns)
    if colunas_faltando:
        sys.exit(f"CSV nao tem as colunas esperadas: {sorted(colunas_faltando)}")

    df = df.rename(columns=COLUNAS_CSV_PARA_BANCO)[list(COLUNAS_CSV_PARA_BANCO.values())]
    df[COLUNAS_BOOLEANAS] = df[COLUNAS_BOOLEANAS].astype(bool)

    print(f"{len(df)} linhas lidas. Conectando ao banco...")
    engine = create_engine(montar_url_conexao())

    with engine.begin() as conexao:
        if args.truncate:
            conexao.execute(text("TRUNCATE TABLE imoveis_referencia RESTART IDENTITY"))
            print("Tabela imoveis_referencia truncada.")

    df.to_sql("imoveis_referencia", engine, if_exists="append", index=False, method="multi", chunksize=1000)
    print(f"Importacao concluida: {len(df)} linhas inseridas em imoveis_referencia.")


if __name__ == "__main__":
    main()
