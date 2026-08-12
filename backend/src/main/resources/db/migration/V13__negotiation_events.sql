ALTER TABLE conversations ADD COLUMN negotiation_mode VARCHAR(16) NOT NULL DEFAULT 'UNDEFINED';
ALTER TABLE conversations ADD COLUMN vp_item_received BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE conversations ADD COLUMN vp_payment_received BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE conversations ADD COLUMN vp_item_delivered BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE conversations ADD COLUMN vp_payment_delivered BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE negotiation_events (
    id VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(64) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    type VARCHAR(64) NOT NULL,
    actor_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    actor_name VARCHAR(80) NOT NULL DEFAULT 'Sistema',
    details VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_negotiation_events_conversation ON negotiation_events(conversation_id, created_at);

INSERT INTO negotiation_events (id, conversation_id, type, actor_name, details, created_at)
SELECT gen_random_uuid()::text, id, 'NEGOTIATION_STARTED', 'Sistema', 'Negociação iniciada', created_at
FROM conversations;

