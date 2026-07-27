-- V4 — Dono real do anúncio. Antes o vendedor era só uma string livre; agora
-- os anúncios criados via API referenciam o usuário autenticado.
-- Anúncios legados (migrados do config) ficam com seller_id nulo e só o admin
-- pode editá-los, até que sejam reivindicados.

ALTER TABLE listings
    ADD COLUMN seller_id VARCHAR(64) REFERENCES users (id) ON DELETE SET NULL;

CREATE INDEX idx_listings_seller ON listings (seller_id);
