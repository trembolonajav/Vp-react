-- V5 — Chat, denúncias e perfil público. Migra o que vivia no
-- bazaar-accounts.json (efêmero na Vercel) para o Postgres.

-- Campos de perfil público do usuário.
ALTER TABLE users ADD COLUMN bio               VARCHAR(240);
ALTER TABLE users ADD COLUMN contact           VARCHAR(80);
ALTER TABLE users ADD COLUMN preferred_contact VARCHAR(40) NOT NULL DEFAULT 'Chat do Bazaar';

-- Conversas de negociação (sempre entre comprador e vendedor).
CREATE TABLE conversations (
    id          VARCHAR(64)  PRIMARY KEY,
    ad_id       VARCHAR(80),
    title       VARCHAR(120),
    buyer_id    VARCHAR(64)  REFERENCES users (id) ON DELETE SET NULL,
    seller_id   VARCHAR(64)  REFERENCES users (id) ON DELETE SET NULL,
    image_url   VARCHAR(500),
    price       NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency    VARCHAR(16)  NOT NULL DEFAULT 'diamante',
    details     VARCHAR(200),
    status      VARCHAR(32)  NOT NULL DEFAULT 'aberta',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_conversations_buyer  ON conversations (buyer_id);
CREATE INDEX idx_conversations_seller ON conversations (seller_id);

CREATE TABLE messages (
    id               VARCHAR(64)   PRIMARY KEY,
    conversation_id  VARCHAR(64)   NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    author_id        VARCHAR(64)   REFERENCES users (id) ON DELETE SET NULL,
    text             VARCHAR(1000) NOT NULL,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at);

-- Quem já leu cada mensagem (para o contador de não lidas).
CREATE TABLE message_reads (
    message_id  VARCHAR(64) NOT NULL REFERENCES messages (id) ON DELETE CASCADE,
    user_id     VARCHAR(64) NOT NULL,
    PRIMARY KEY (message_id, user_id)
);

CREATE TABLE reports (
    id           VARCHAR(64)  PRIMARY KEY,
    ad_id        VARCHAR(80)  NOT NULL,
    title        VARCHAR(120),
    seller       VARCHAR(40),
    reason       VARCHAR(100) NOT NULL,
    details      VARCHAR(600),
    reporter_id  VARCHAR(64)  REFERENCES users (id) ON DELETE SET NULL,
    status       VARCHAR(16)  NOT NULL DEFAULT 'aberta',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_reports_ad ON reports (ad_id);
