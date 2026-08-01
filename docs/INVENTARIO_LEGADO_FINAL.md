# Inventário final do legado

Baseline: branch `feat/migracao-backend-fundacao`, HEAD `9591ac5`, worktree
limpo. Branch de recuperação: `backup/pre-remocao-legado` → `9591ac5`.

## Volumes no baseline

| Origem | Arquivos | Bytes | Classificação |
|---|---:|---:|---|
| `apps/` | 284 | 30.099.916 | `REFERENCE_ONLY` fora do Docker após esta etapa |
| `api/` | 17 | 44.633 | `VERCEL_ONLY`, arquitetura Node anterior |
| `scripts/` | 13 | 62.939 | misto: auditoria ativa e geradores/build antigos |
| `frontend/public/` | 211 | 46.636.606 | assets ativos + cópia completa VPLab/Tesseract |
| `dist/` | 285 | 41.934.895 | saída gerada, nunca fonte |

## O que o Docker do baseline copiava

| Origem | Destino na imagem | Tipo | Consumido por rota oficial? | Substituto | Pode remover? |
|---|---|---|---|---|---|
| `apps/*` via `static-build` | `/usr/share/nginx/html/{bazaar,store,vplab/legacy}` | HTML/JS/CSS legado | não, exceto assets VPLab | React + assets promovidos | sim, após promoção |
| `scripts/build.mjs` | executado no estágio Node | build copiador | apenas para montar legado | Vite | sim |
| `api/` | não entra na imagem | Vercel Functions | não | Spring `/api/v1/*` | sim no deploy Docker oficial |
| `frontend/public/assets` | `/usr/share/nginx/html/assets` | imagens oficiais | sim | mesma origem React | não |
| `frontend/public/vplab` | `/usr/share/nginx/html/vplab` e depois sobreposto parcialmente | app e Tesseract duplicados | somente quatro grupos de imagens | `/assets/vplab/*` | remover após promoção |
| `frontend/public/vplab-data` | `/usr/share/nginx/html/vplab-data` | JSON canônico | sim | mesma origem | não |
| `frontend/public/ocr-models` | `/usr/share/nginx/html/ocr-models` | modelos PaddleOCR | sim | mesma origem | não |
| `dist/` raiz | nenhum COPY direto | artefato local | não | `frontend/dist` do Vite | removível/gerado |

## Rotas HTML históricas

| URL | Origem antiga | React equivalente | Referências | Ação |
|---|---|---|---|---|
| `/bazaar/index.html` | Bazaar `index.html` | `/bazaar/` | links/testes históricos | 308 |
| `/bazaar/anunciar.html` | Bazaar | `/bazaar/anunciar` | links históricos | 308 |
| `/bazaar/anuncio.html?id=` | Bazaar | `/bazaar/anuncio/:id` | links históricos | 308 usando `$arg_id` |
| `/bazaar/chat.html` | Bazaar | `/bazaar/chat` | links históricos | 308 |
| `/bazaar/meus-anuncios.html` | Bazaar | `/bazaar/meus-anuncios` | links históricos | 308 |
| `/bazaar/perfil.html` | Bazaar | `/bazaar/perfil` | links históricos | 308 |
| `/bazaar/como-funciona.html` | Bazaar | `/bazaar/como-funciona` | Nginx/testes | manter 308 |
| `/bazaar/conta.html` | Bazaar | `/bazaar/conta` | Nginx/testes | manter 308 |
| `/store/index.html` | Store | `/store/` | links históricos | 308 |
| `/store/intermedio.html` | Store | `/store/intermedio` | Nginx/testes | manter 308 |
| `/store/jogos.html` | Store | `/store/jogos` | Nginx/testes | manter 308 |
| `/store/offline.html` | Store | `/store/offline` | Nginx/testes | manter 308 |
| `/vplab/legacy/*` | VPLab completo | rotas `/vplab/*` | React usava quatro grupos de assets | remover após promoção |
| `/vplab/index.html` | shell antigo | `/vplab/` | Vercel/testes históricos | 308 |
| protótipos `*-v2/v4.html` | páginas de migração | ferramenta React correspondente | Vercel histórico | 308 |

Não há HTML antigo necessário para funcionalidade. Compatibilidade passa a ser
responsabilidade exclusiva do Nginx.

## Diretórios e scripts

| Item | Estado | Motivo |
|---|---|---|
| `apps/vpertz-{hub,bazaar,store,lab}` | `REMOVABLE_NOW` | substituídos e recuperáveis pela branch/Git |
| `scripts/build.mjs` | `REMOVABLE_NOW` | build estático substituído pelo Vite |
| scripts `prepare-*`, `split-*`, `read-game-api`, `search-game-chunks` | `REMOVABLE_NOW` | utilitários pontuais ligados às fontes removidas |
| scripts `audit-*-runtime.mjs` | `KEEP_AS_REFERENCE` | auditorias úteis da API Spring em execução |
| `scripts/generate-clan-ranking.mjs` | `KEEP_AS_DATA` | regenera o JSON canônico; destino será React |
| `api/` | `REMOVABLE_NOW` | somente Vercel antigo; Docker nunca usa |
| `dist/` | `DEAD_CODE` gerado | ignorado pelo Git; não é fonte |

