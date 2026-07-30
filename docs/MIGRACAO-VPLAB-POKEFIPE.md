# Migração do VPLab — PokeFipe

## Escopo

- `/vplab/pokefipe` é a rota React oficial.
- O motor TypeScript preserva a PokeFipe 2.0 vigente em 28/07/2026.
- A calculadora usa as 251 espécies do catálogo React, bases de mercado,
  pontuação `IV × multiplicador`, progressão de nível e três referências:
  venda rápida, valor justo e preço de anúncio.
- O Avaliar IV abre a PokeFipe com espécie, IV, qualidade e nível preenchidos.
- Rota de caça, Breeding, Clãs e Profissões permanecem no legado.

## Arquitetura

O cálculo é determinístico e executado no frontend React. O catálogo estático
versionado é carregado de `/vplab-data/vplab-dex.json`; não há dependência da
API Node legada.

## Estado geral

MIGRAÇÃO GERAL: EM ANDAMENTO

LEGADO: AINDA ATIVO
