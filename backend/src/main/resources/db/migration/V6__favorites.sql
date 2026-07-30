CREATE TABLE favorites (
    id                BIGSERIAL   PRIMARY KEY,
    user_id           VARCHAR(64) NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    listing_public_id VARCHAR(40) NOT NULL REFERENCES listings (public_id) ON DELETE CASCADE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_favorites_user_listing UNIQUE (user_id, listing_public_id)
);

CREATE INDEX idx_favorites_user ON favorites (user_id, created_at DESC);
