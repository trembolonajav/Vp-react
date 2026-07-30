# Migração do VPLab — Pokédex

## Escopo

- `/vplab/pokedex` passa a ser a rota React oficial da Pokédex.
- O catálogo versionado de 251 espécies é carregado de
  `/vplab-data/vplab-dex.json`.
- Busca por nome/número, filtros, catálogo, detalhes, stats, efetividade,
  golpes, evolução e drops foram portados.
- O atalho Avaliar IV permanece em React. Rota de caça, PokeFipe, Breeding,
  Clãs e Profissões continuam temporariamente em `/vplab/legacy/`.

## Arquitetura

Pokédex é um catálogo estático versionado, não um domínio transacional. A rota
React lê o JSON gerado no build; nenhuma API Node ou banco legado participa
desse fluxo.

## Estado geral

MIGRAÇÃO GERAL: EM ANDAMENTO

LEGADO: AINDA ATIVO
