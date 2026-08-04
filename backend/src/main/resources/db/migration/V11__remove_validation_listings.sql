-- Limpeza de anúncios técnicos criados durante a validação local da API.
DELETE FROM listings
WHERE public_id = 'validacao-bazaar'
   OR titulo = 'Com imagem enviada';
