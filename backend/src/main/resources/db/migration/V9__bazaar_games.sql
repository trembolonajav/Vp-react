-- IDs canônicos usados pelo novo fluxo do VP Bazaar.
INSERT INTO games (id, nome, item, unidade, botao, img_url, icone_url,
                   preco_compra, preco_venda, min_qtd, max_qtd, ativo, ordering)
VALUES
    ('pokeidle', 'Poke Idle World', 'Diamonds', 'diamante', '[PokeIdle] Diamonds',
     'assets/card-pokeidle-world.webp', 'assets/diamante-pokeidle.webp',
     0.30, 0.20, 1, 1000, TRUE, 0),
    ('pokewebgames', 'Poke Web Games', 'Diamonds', 'diamante', '[PokeWebGames] Diamonds',
     'assets/bazaar/logo-pokewebgames.png', 'assets/diamante-pokeidle.webp',
     0, 0, 1, 1000, TRUE, 1)
ON CONFLICT (id) DO NOTHING;
