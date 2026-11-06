-- Baseline schema for GAIÒ - Calculadora Imobiliária
-- Reflects the domain as implemented (Usuario, Estimativa, Anuncio) with
-- explicit constraints/indexes that Hibernate's ddl-auto does not create by
-- itself. Column names match Spring Boot's default physical naming
-- strategy (camelCase -> snake_case) so this migration is a drop-in
-- replacement for the auto-generated schema, not a divergent one.
--
-- NOT YET ACTIVE: Flyway is not wired into the application (see
-- backend/README.md). This file only becomes effective once the
-- flyway-core dependency is added and spring.jpa.hibernate.ddl-auto is
-- turned off. Kept here so the migration path is ready when needed.

CREATE TABLE usuarios (
    id          BIGSERIAL PRIMARY KEY,
    nome        VARCHAR(255)  NOT NULL,
    email       VARCHAR(255)  NOT NULL UNIQUE,
    senha_hash  VARCHAR(255)  NOT NULL,
    criado_em   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE estimativas (
    id              BIGSERIAL PRIMARY KEY,
    usuario_id      BIGINT REFERENCES usuarios (id) ON DELETE SET NULL,
    bairro_ou_cep   VARCHAR(255)     NOT NULL,
    area_m2         DOUBLE PRECISION NOT NULL CHECK (area_m2 > 0),
    quartos         INTEGER          NOT NULL CHECK (quartos >= 0),
    banheiros       INTEGER          NOT NULL CHECK (banheiros >= 0),
    vagas_garagem   INTEGER          NOT NULL CHECK (vagas_garagem >= 0),
    valor_estimado  NUMERIC(14, 2)   NOT NULL,
    faixa_minima    NUMERIC(14, 2),
    faixa_maxima    NUMERIC(14, 2),
    confianca       DOUBLE PRECISION CHECK (confianca BETWEEN 0 AND 1),
    criado_em       TIMESTAMPTZ      NOT NULL DEFAULT now()
);

CREATE INDEX idx_estimativas_usuario_id ON estimativas (usuario_id);

CREATE TABLE anuncios (
    id                  BIGSERIAL PRIMARY KEY,
    usuario_id          BIGINT NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    estimativa_id       BIGINT NOT NULL UNIQUE REFERENCES estimativas (id) ON DELETE CASCADE,
    bairro              VARCHAR(255) NOT NULL,
    endereco_completo   VARCHAR(500) NOT NULL,
    titulo              VARCHAR(255) NOT NULL,
    descricao           TEXT         NOT NULL,
    status              VARCHAR(20)  NOT NULL CHECK (status IN ('RASCUNHO', 'COMPLETO')),
    publicado           BOOLEAN      NOT NULL DEFAULT false,
    criado_em           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    atualizado_em       TIMESTAMPTZ  NOT NULL DEFAULT now(),

    -- Mirrors the AnuncioService business rule at the database level:
    -- an anuncio can only be marked publicado once it is COMPLETO.
    CONSTRAINT chk_anuncios_publicado_requer_completo
        CHECK (NOT publicado OR status = 'COMPLETO')
);

CREATE INDEX idx_anuncios_usuario_id ON anuncios (usuario_id);
CREATE INDEX idx_anuncios_bairro ON anuncios (bairro);
CREATE INDEX idx_anuncios_status ON anuncios (status);
