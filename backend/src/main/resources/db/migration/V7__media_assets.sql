CREATE TABLE media_assets (
    id                UUID         PRIMARY KEY,
    public_id         VARCHAR(80)  NOT NULL UNIQUE,
    object_key        VARCHAR(300) NOT NULL UNIQUE,
    original_filename VARCHAR(255),
    content_type      VARCHAR(80)  NOT NULL,
    extension         VARCHAR(8)   NOT NULL,
    byte_size         BIGINT       NOT NULL CHECK (byte_size > 0),
    sha256            VARCHAR(64)  NOT NULL,
    uploaded_by       VARCHAR(64)  NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_media_assets_uploader ON media_assets (uploaded_by, created_at DESC);
