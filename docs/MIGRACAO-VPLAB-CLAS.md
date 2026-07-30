# Migração do VPLab — Clãs

Etapa concluída em 30/07/2026.

## Entrega

- `/vplab/clas` passou a ser uma rota React oficial.
- Os dez clãs, o Top 6, os substitutos e as exclusões usam um snapshot da base canônica `clan-ranking.json`.
- A ordem e os scores não são recalculados no navegador.
- Busca e filtro atuam somente sobre substitutos, sem alterar o ranking base.
- A página expõe metodologia, premissas e números da auditoria: 251 espécies auditadas, 240 utilizáveis, 11 excluídas e 349 participações.
- Os emblemas continuam servidos pela ponte explícita `/vplab/legacy/assets/clans/`.
- Profissões permanece temporariamente no legado e é a próxima migração recomendada.

## Paridade e validação

- A equipe recomendada de cada clã corresponde exatamente às seis primeiras posições canônicas.
- O snapshot publicado no frontend é comparado integralmente à fonte em teste automatizado.
- Navegação, fallback do Nginx, layout responsivo, tipos e detalhes por Pokémon estão cobertos pela implementação e pelos testes da etapa.
