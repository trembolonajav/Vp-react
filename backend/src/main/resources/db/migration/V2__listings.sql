-- V2 — Anúncios do bazaar (listings). Substitui o array embutido em
-- config.bazaar.anuncios por uma tabela consultável e indexável.

CREATE TABLE listings (
    id                    BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id             VARCHAR(40)   NOT NULL UNIQUE,
    titulo                VARCHAR(90)   NOT NULL,
    game_id               VARCHAR(40)   REFERENCES games (id) ON DELETE SET NULL,
    servidor              VARCHAR(40),
    categoria             VARCHAR(40),
    -- tipo do anúncio (pokemon/item/shinycard), derivado na migração.
    tipo                  VARCHAR(16),
    intencao              VARCHAR(8)    NOT NULL DEFAULT 'venda',
    moeda                 VARCHAR(10)   NOT NULL DEFAULT 'brl',
    preco                 NUMERIC(12,2) NOT NULL DEFAULT 0,
    negociavel            BOOLEAN       NOT NULL DEFAULT FALSE,
    destaque              BOOLEAN       NOT NULL DEFAULT FALSE,
    status                VARCHAR(10)   NOT NULL DEFAULT 'ativo',
    img_url               VARCHAR(800),
    descricao             VARCHAR(1200),
    vendedor              VARCHAR(60),
    criado_em             DATE,

    -- ficha do card
    dex                   INTEGER       NOT NULL DEFAULT 0,
    nivel                 INTEGER       NOT NULL DEFAULT 0,
    poder                 INTEGER       NOT NULL DEFAULT 0,
    shiny                 BOOLEAN       NOT NULL DEFAULT FALSE,
    quantidade            INTEGER       NOT NULL DEFAULT 0,
    aceita_troca          BOOLEAN       NOT NULL DEFAULT FALSE,

    -- ficha detalhada (opcional)
    natureza              VARCHAR(40),
    habilidade            VARCHAR(40),
    genero                VARCHAR(10),
    forma                 VARCHAR(40),
    qualidade             NUMERIC(6,3)  NOT NULL DEFAULT 0,
    disponibilidade       VARCHAR(20),
    -- soma dos 6 IVs, desnormalizada para permitir filtro por IV total.
    iv_total              INTEGER,
    ivs                   JSONB,
    moves                 JSONB,
    regras                VARCHAR(800),

    -- reputação do anunciante (manual nesta fase, sem contas)
    vendedor_verificado   BOOLEAN       NOT NULL DEFAULT FALSE,
    vendedor_online       BOOLEAN       NOT NULL DEFAULT FALSE,
    vendedor_nota         NUMERIC(3,1)  NOT NULL DEFAULT 0,
    vendedor_vendas       INTEGER       NOT NULL DEFAULT 0,
    vendedor_resposta     VARCHAR(40),
    vendedor_avatar       VARCHAR(800),

    created_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Tipagens elementares do anúncio (0 a 2), consultáveis para o filtro de tipo.
CREATE TABLE listing_types (
    listing_id  BIGINT      NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
    type        VARCHAR(16) NOT NULL,
    PRIMARY KEY (listing_id, type)
);

-- Índices para os filtros e ordenações mais comuns da vitrine.
CREATE INDEX idx_listings_status   ON listings (status);
CREATE INDEX idx_listings_game     ON listings (game_id);
CREATE INDEX idx_listings_moeda    ON listings (moeda);
CREATE INDEX idx_listings_tipo     ON listings (tipo);
CREATE INDEX idx_listings_intencao ON listings (intencao);
CREATE INDEX idx_listings_criado   ON listings (criado_em DESC);
CREATE INDEX idx_listing_types_type ON listing_types (type);
