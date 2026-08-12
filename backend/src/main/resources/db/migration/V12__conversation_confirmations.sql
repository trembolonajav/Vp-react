ALTER TABLE conversations ADD COLUMN intermediary_used BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE conversations ADD COLUMN buyer_product_confirmed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE conversations ADD COLUMN seller_payment_confirmed BOOLEAN NOT NULL DEFAULT FALSE;

