-- V3 — Usuários unificados: admin do painel (ROLE ADMIN) e contas do bazaar
-- (ROLE USER), antes espalhados entre variável de ambiente e um JSON efêmero.

CREATE TABLE users (
    -- VARCHAR para preservar os ids atuais das contas do bazaar (ex.: "user-moonlight"),
    -- importante para a futura migração de conversas/mensagens que os referenciam.
    id             VARCHAR(64)  PRIMARY KEY,
    username       VARCHAR(24)  NOT NULL,
    email          VARCHAR(120) NOT NULL,
    password_hash  VARCHAR(200) NOT NULL,
    -- salt separado apenas para os hashes scrypt legados; nulo para bcrypt.
    password_salt  VARCHAR(64),
    password_algo  VARCHAR(16)  NOT NULL DEFAULT 'bcrypt',
    role           VARCHAR(16)  NOT NULL DEFAULT 'USER',
    avatar         VARCHAR(800),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Unicidade case-insensitive (o login casa por username/email em minúsculas).
CREATE UNIQUE INDEX ux_users_username_lower ON users (lower(username));
CREATE UNIQUE INDEX ux_users_email_lower    ON users (lower(email));
