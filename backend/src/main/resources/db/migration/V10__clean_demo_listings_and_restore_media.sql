-- Os registros an-1..an-14 eram conteúdo demonstrativo do protótipo e não
-- podem inflar a contagem do marketplace real.
DELETE FROM listings
WHERE public_id IN ('an-1','an-2','an-3','an-4','an-5','an-6','an-7',
                    'an-8','an-9','an-10','an-11','an-12','an-13','an-14');

-- Repara anúncios criados pelo wizard antigo, que não persistia a mídia.
UPDATE listings
SET img_url = 'https://poke.idleworld.online/assets/cards/' || (16254 + dex) || '.png'
WHERE tipo = 'shinycard' AND dex > 0 AND (img_url IS NULL OR img_url = '');

UPDATE listings SET img_url = 'https://poke.idleworld.online/assets/items/strange_pheromone.png'
WHERE tipo = 'item' AND lower(titulo) = 'strange pheromone' AND (img_url IS NULL OR img_url = '');
UPDATE listings SET img_url = 'assets/vplab/professions/official/rare_pokemon_picture.png'
WHERE tipo = 'item' AND lower(titulo) = 'rare pokémon picture' AND (img_url IS NULL OR img_url = '');
UPDATE listings SET img_url = 'assets/bazaar/sprite-rare-candy.png'
WHERE tipo = 'item' AND lower(titulo) = 'rare candy' AND (img_url IS NULL OR img_url = '');
UPDATE listings SET img_url = 'https://poke.idleworld.online/assets/items/bronze_boss_token.png'
WHERE tipo = 'item' AND lower(titulo) = 'bronze boss token' AND (img_url IS NULL OR img_url = '');
