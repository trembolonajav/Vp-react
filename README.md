# Plataforma Vpertz

Monorepositório oficial da Vpertz. Um único projeto Vercel publica a Store,
o painel administrativo e o VPLab (que inclui a PokeFipe) no mesmo domínio.

## Endereços

| Área | Caminho público | Código-fonte |
|---|---|---|
| Vpertz Store | `/` | `apps/vpertz-store/public/` |
| VP Bazaar | `/bazaar/` | `apps/vpertz-bazaar/public/` |
| Painel | `/admin.html` | `apps/vpertz-store/public/admin.*` + `api/` |
| PokeFipe | `/vplab/?tab=fipe` | `apps/vpertz-lab/public/pokefipe-core.js` + aba no VPLab |
| VPLab | `/vplab/` | `apps/vpertz-lab/public/` |

## Estrutura

```text
Vpertz/
├── apps/
│   ├── vpertz-store/public/   # Site e painel
│   ├── vpertz-bazaar/public/  # Marketplace publicado em /bazaar/
│   └── vpertz-lab/
│       ├── public/            # Aplicação publicada em /vplab/ (inclui PokeFipe)
│       ├── design/            # Mockups e referências (não publicados)
│       └── source-data/       # Fontes usadas para gerar o catálogo
├── api/                       # Functions serverless da Vercel
├── scripts/build.mjs          # Monta dist/
├── tests/                     # Segurança, cálculos e E2E
├── docs/                      # Arquitetura e deploy
├── dist/                      # Gerada; não versionar
├── dev-server.mjs
├── package.json
└── vercel.json
```

## Desenvolvimento

```powershell
npm install
$env:ADMIN_USER="admin"
$env:ADMIN_PASS="uma-senha-forte"
$env:SESSION_SECRET="um-segredo-longo-com-mais-de-32-caracteres"
npm run dev
```

- Store: `http://127.0.0.1:8736/`
- VP Bazaar: `http://127.0.0.1:8736/bazaar/`
- PokeFipe: `http://127.0.0.1:8736/vplab/?tab=fipe`
- VPLab: `http://127.0.0.1:8736/vplab/`
- Admin: `http://127.0.0.1:8736/admin.html`

## Verificação

```powershell
npm run verify
```

Esse comando valida JavaScript, executa testes unitários e de segurança, monta
`dist/` e testa Store, PokeFipe, VPLab, Bazaar, APIs, login, upload e publicação.

## VP Bazaar

O marketplace lê os anúncios da mesma configuração da loja (`cfg.bazaar`),
editada na aba **Bazaar** do painel. Nesta primeira fase não há contas de
usuário: os anúncios são cadastrados pela administração e a negociação sai
pelo WhatsApp, com intermédio opcional da VP.

- Cada anúncio tem página própria em `/bazaar/anuncio.html?id=<id>` (não é
  mais modal). O card e o botão "Ver anúncio" navegam para lá.
- `status` do anúncio: `ativo` (na vitrine), `pausado` (invisível) e
  `vendido` (fora da vitrine, mas ainda acessível pelo link direto da página,
  que já pode ter circulado no WhatsApp).
- A "Ficha detalhada" (natureza, habilidade, gênero, IVs, moves, regras e a
  reputação do vendedor) é opcional, editada no bloco recolhível da aba Bazaar,
  e alimenta a página do anúncio. Anúncio sem esses dados esconde os painéis.
- Servidores e categorias são listas editáveis no painel; valores removidos
  de lá são limpos dos anúncios que os usavam na próxima publicação.
- Reais e diamonds nunca são comparados entre si: a faixa de preço exige
  escolher uma moeda e a ordenação por preço agrupa por moeda.

## Deploy

Importe a raiz deste repositório na Vercel com Framework Preset **Other**.
O `vercel.json` executa `npm run build` e publica `dist/`. Não selecione uma
subpasta como Root Directory.

Variáveis obrigatórias:

- `ADMIN_USER`
- `ADMIN_PASS`
- `SESSION_SECRET`

Conecte também um Vercel Blob ao projeto. A Vercel cria `BLOB_STORE_ID` e as
credenciais de integração automaticamente.

<!-- deploy 1 -->
