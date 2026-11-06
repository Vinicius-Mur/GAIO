-- Reference table holding the treated real-estate dataset (São Paulo
-- capital, ~20.5k rows) produced by the data-treatment notebook. Not
-- consumed by the application yet — this only creates the structure so
-- comparables/analytics features (or the ML training pipeline itself) can
-- query it straight from Postgres instead of the loose CSV file.
--
-- To load the data after this migration runs, use
-- backend/scripts/importar_imoveis_referencia.py (kept out of Flyway
-- because it's a one-off bulk load, not a schema change).

CREATE TABLE imoveis_referencia (
    id                  BIGSERIAL PRIMARY KEY,
    price               NUMERIC(14, 2)   NOT NULL,
    categoria           VARCHAR(50)      NOT NULL,
    tipo                VARCHAR(50)      NOT NULL,
    condominio          NUMERIC(10, 2)   NOT NULL,
    area_util           NUMERIC(8, 2)    NOT NULL,
    quartos             SMALLINT         NOT NULL,
    banheiros           SMALLINT         NOT NULL,
    vagas_garagem       SMALLINT         NOT NULL,
    zona                VARCHAR(10)      NOT NULL,
    academia            BOOLEAN          NOT NULL,
    elevador            BOOLEAN          NOT NULL,
    permitido_animais   BOOLEAN          NOT NULL,
    piscina             BOOLEAN          NOT NULL,
    portaria            BOOLEAN          NOT NULL,
    salao_festas        BOOLEAN          NOT NULL,
    condominio_fechado  BOOLEAN          NOT NULL,
    seguranca_24h       BOOLEAN          NOT NULL,
    portao_eletronico   BOOLEAN          NOT NULL,
    area_murada         BOOLEAN          NOT NULL,
    area_servico        BOOLEAN          NOT NULL,
    armarios_cozinha    BOOLEAN          NOT NULL,
    armarios_quarto     BOOLEAN          NOT NULL,
    churrasqueira       BOOLEAN          NOT NULL,
    mobiliado           BOOLEAN          NOT NULL,
    quarto_servico      BOOLEAN          NOT NULL,
    ar_condicionado     BOOLEAN          NOT NULL,
    porteiro_24h        BOOLEAN          NOT NULL,
    varanda             BOOLEAN          NOT NULL,
    bairro              VARCHAR(255)     NOT NULL
);

CREATE INDEX idx_imoveis_referencia_bairro ON imoveis_referencia (bairro);
CREATE INDEX idx_imoveis_referencia_zona ON imoveis_referencia (zona);
