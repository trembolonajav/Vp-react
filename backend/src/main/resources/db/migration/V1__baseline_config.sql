-- V1 — Baseline da configuração pública do site (loja + taxonomia do bazaar).
-- Espelha o que hoje vive no config.json. Anúncios, contas e chat entram em
-- migrações próprias nas fases seguintes.

-- Configuração global (linha única).
CREATE TABLE site_config (
    id                   SMALLINT     PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    whatsapp             VARCHAR(15)  NOT NULL,
    msg_negociar         VARCHAR(300) NOT NULL,
    bazaar_ativo         BOOLEAN      NOT NULL DEFAULT TRUE,
    bazaar_msg_interesse VARCHAR(300) NOT NULL,
    bazaar_msg_anunciar  VARCHAR(300) NOT NULL,
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Jogos da loja, cada um com seus próprios preços.
CREATE TABLE games (
    id            VARCHAR(40)   PRIMARY KEY,
    nome          VARCHAR(80)   NOT NULL,
    item          VARCHAR(80)   NOT NULL,
    unidade       VARCHAR(40)   NOT NULL,
    botao         VARCHAR(80)   NOT NULL,
    img_url       VARCHAR(800)  NOT NULL,
    icone_url     VARCHAR(800),
    preco_compra  NUMERIC(12,2) NOT NULL DEFAULT 0,
    preco_venda   NUMERIC(12,2) NOT NULL DEFAULT 0,
    min_qtd       INTEGER       NOT NULL DEFAULT 1,
    max_qtd       INTEGER       NOT NULL DEFAULT 1,
    ativo         BOOLEAN       NOT NULL DEFAULT TRUE,
    ordering      INTEGER       NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Banners do carrossel da página inicial.
CREATE TABLE banners (
    id        BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    img_url   VARCHAR(800) NOT NULL,
    alt       VARCHAR(200),
    link      VARCHAR(500),
    ordering  INTEGER      NOT NULL DEFAULT 0
);

-- Contatos / redes sociais.
CREATE TABLE contacts (
    id        BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    icone     VARCHAR(40)  NOT NULL,
    nome      VARCHAR(40),
    info      VARCHAR(120),
    url       VARCHAR(500),
    ordering  INTEGER      NOT NULL DEFAULT 0
);

-- Taxonomia editável do bazaar: categorias e servidores.
CREATE TABLE categories (
    id        BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome      VARCHAR(40) NOT NULL UNIQUE,
    ordering  INTEGER     NOT NULL DEFAULT 0
);

CREATE TABLE servers (
    id        BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome      VARCHAR(40) NOT NULL UNIQUE,
    ordering  INTEGER     NOT NULL DEFAULT 0
);
