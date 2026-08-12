INSERT INTO negotiation_events (id, conversation_id, type, actor_id, actor_name, details, created_at)
SELECT gen_random_uuid()::text, c.id, 'AWAITING_PARTY_CONFIRMATIONS', NULL, 'Sistema',
       'Aguardando confirmações finais do comprador e do vendedor', now()
FROM conversations c
WHERE c.negotiation_mode = 'INTERMEDIATED'
  AND c.vp_item_delivered = TRUE AND c.vp_payment_delivered = TRUE
  AND c.status NOT IN ('concluida', 'encerrada')
  AND NOT EXISTS (SELECT 1 FROM negotiation_events e WHERE e.conversation_id = c.id AND e.type = 'AWAITING_PARTY_CONFIRMATIONS');

INSERT INTO messages (id, conversation_id, author_id, text, created_at)
SELECT gen_random_uuid()::text, c.id,
       COALESCE((SELECT u.id FROM users u WHERE u.role = 'ADMIN' ORDER BY u.created_at LIMIT 1), c.seller_id),
       '✅ As entregas do intermédio foram realizadas. Comprador: confirme o produto. Vendedor: confirme o pagamento.', now()
FROM conversations c
WHERE c.negotiation_mode = 'INTERMEDIATED'
  AND c.vp_item_delivered = TRUE AND c.vp_payment_delivered = TRUE
  AND c.status NOT IN ('concluida', 'encerrada')
  AND NOT EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id = c.id AND m.text LIKE '✅ As entregas do intermédio foram realizadas.%');

