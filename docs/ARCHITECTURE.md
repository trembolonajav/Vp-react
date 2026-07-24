# Arquitetura

## Decisão

A plataforma usa um monorepositório e um único deployment. As aplicações ficam
separadas no código, mas são reunidas em `dist/` durante o build:

```text
apps/vpertz-store/public/ ───┐
apps/vpertz-lab/public/ ─────┼── scripts/build.mjs ──> dist/
apps/vpertz-bazaar/public/ ──┘                         ├── vplab/
                                                       └── bazaar/

api/ ───────────────────────────────────────────────> Vercel Functions
```

## Responsabilidades

- **Store:** páginas comerciais, contato, negociação e painel.
- **VPLab:** ferramentas de perfil, IV, PokeFipe, rotas de caça e clãs.
- **Bazaar:** marketplace entre jogadores. Não tem código de dados próprio:
  lê `cfg.bazaar` de `/api/config` e reaproveita `/styles.css` e `/config.js`
  da Store, de modo que a identidade visual é sempre a mesma.
- **API:** autenticação, configuração pública, administração e uploads.
- **Blob:** persistência de configurações e imagens do painel.
- **Build:** apenas copia fontes públicas para a saída; não transforma dados.

## Regras

1. Nunca editar `dist/`; ela é recriada em todo build.
2. Código da Store fica somente em `apps/vpertz-store/public/`.
3. Código do VPLab fica somente em `apps/vpertz-lab/public/`, e o do Bazaar
   somente em `apps/vpertz-bazaar/public/`.
4. Funções HTTP ficam somente em `api/`, pois a Vercel as descobre na raiz.
5. Dados de geração do VPLab não devem ser colocados na pasta `public/`.
6. Segredos nunca entram no Git; usar variáveis da Vercel.

## Rotas

- `/` e páginas `.html`: Store.
- `/api/*`: funções serverless.
- `/vplab/*`: arquivos isolados do VPLab.
- `/bazaar/*`: arquivos isolados do VP Bazaar.
- `/uploads/*`: arquivos locais em desenvolvimento; Blob em produção.
