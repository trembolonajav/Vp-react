# Auditoria e Consolidação do Worktree

> Etapa: **Consolidação do Git — baseline reproduzível** (opção A).
> NÃO migra páginas, NÃO remove legado, NÃO altera OCR.
> Objetivo: transformar 70 entradas sujas em commits coerentes + baseline reproduzível,
> preservando todas as alterações válidas.

- **Branch:** `feat/migracao-backend-fundacao`
- **HEAD inicial:** `3a2508fbab036b1f7fac4550fd9906599e3682e9`
- **Backup criado:** branch `backup/pre-consolidacao` → `3a2508f`
- **Patches de segurança:** `../vpertz-worktree-backup.patch` (168 KB, alterações rastreadas), `../vpertz-staged-backup.patch` (0 B, nada estava staged)
- **Inventário de não rastreados:** `../vpertz-untracked-inventory.txt` (280 arquivos brutos; 210 são a cópia aninhada acidental)

## Legenda de ações

- **COMMIT** — alteração válida, entra num grupo de commit coerente.
- **QUARENTENA** — movido para `../vpertz-consolidacao-quarantine/` (fora do repo, reversível). Não é build input; não commitado; não apagado.
- **MANTER (documentado)** — permanece não rastreado, conscientemente, sem afetar o build.

---

## 1. Arquivos RASTREADOS modificados (45)

| Arquivo | Área | Origem provável | Já em commit? | Usado pelo build? | Classificação | Ação | Grupo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| README.md | docs | atualização de doc | sim (M) | não | HISTORICAL_REFERENCE | COMMIT | docs |
| apps/vpertz-bazaar/public/anunciar.html | legacy-bazaar | injeção `<script /family-nav.js>` | sim (M) | sim (static-build) | VALID_LEGACY_BRIDGE | COMMIT | family-nav |
| apps/vpertz-bazaar/public/anuncio.html | legacy-bazaar | family-nav | sim (M) | sim | VALID_LEGACY_BRIDGE | COMMIT | family-nav |
| apps/vpertz-bazaar/public/index.html | legacy-bazaar | family-nav | sim (M) | sim | VALID_LEGACY_BRIDGE | COMMIT | family-nav |
| apps/vpertz-bazaar/public/como-funciona.html | legacy-bazaar | family-nav | sim (M) | sim | VALID_LEGACY_BRIDGE | COMMIT | family-nav |
| apps/vpertz-bazaar/public/meus-anuncios.html | legacy-bazaar | family-nav | sim (M) | sim | VALID_LEGACY_BRIDGE | COMMIT | family-nav |
| apps/vpertz-bazaar/public/perfil.html | legacy-bazaar | family-nav + JS | sim (M) | sim | VALID_LEGACY_BRIDGE | COMMIT | family-nav |
| apps/vpertz-bazaar/public/chat.html | legacy-bazaar | family-nav | sim (M) | sim | VALID_LEGACY_BRIDGE | COMMIT | family-nav |
| apps/vpertz-bazaar/public/conta.html | legacy-bazaar | family-nav + conta.js | sim (M) | sim | VALID_LEGACY_BRIDGE | COMMIT | family-nav |
| apps/vpertz-bazaar/public/chat.js | legacy-bazaar | ajuste de chat | sim (M) | sim | VALID_LEGACY_BRIDGE | COMMIT | bazaar-legacy-js |
| apps/vpertz-bazaar/public/conta.js | legacy-bazaar | ajuste de conta | sim (M) | sim | VALID_LEGACY_BRIDGE | COMMIT | bazaar-legacy-js |
| apps/vpertz-bazaar/public/perfil.js | legacy-bazaar | ajuste de perfil | sim (M) | sim | VALID_LEGACY_BRIDGE | COMMIT | bazaar-legacy-js |
| apps/vpertz-hub/public/comunidade.html | legacy-hub | family-nav | sim (M) | sim | VALID_LEGACY_BRIDGE | COMMIT | family-nav |
| apps/vpertz-hub/public/index.html | legacy-hub | family-nav | sim (M) | sim | VALID_LEGACY_BRIDGE | COMMIT | family-nav |
| apps/vpertz-store/public/admin.html | legacy-store | family-nav | sim (M) | sim | VALID_LEGACY_BRIDGE | COMMIT | family-nav |
| apps/vpertz-store/public/index.html | legacy-store | family-nav | sim (M) | sim | VALID_LEGACY_BRIDGE | COMMIT | family-nav |
| apps/vpertz-store/public/intermedio.html | legacy-store | family-nav | sim (M) | sim | VALID_LEGACY_BRIDGE | COMMIT | family-nav |
| apps/vpertz-store/public/jogos.html | legacy-store | family-nav | sim (M) | sim | VALID_LEGACY_BRIDGE | COMMIT | family-nav |
| apps/vpertz-store/public/negociar.html | legacy-store | family-nav | sim (M) | sim | VALID_LEGACY_BRIDGE | COMMIT | family-nav |
| apps/vpertz-store/public/offline.html | legacy-store | family-nav | sim (M) | sim | VALID_LEGACY_BRIDGE | COMMIT | family-nav |
| apps/vpertz-store/public/contato.html | legacy-store | atualização de contato | sim (M) | sim | VALID_LEGACY_BRIDGE | COMMIT | store-contato |
| apps/vpertz-store/public/styles.css | legacy-store | estilo family-nav | sim (M) | sim | VALID_LEGACY_BRIDGE | COMMIT | family-nav |
| apps/vpertz-lab/public/index.html | legacy-lab | links p/ v2/v4 + ajustes | sim (M) | sim | VALID_LEGACY_BRIDGE | COMMIT | lab-legacy |
| apps/vpertz-lab/public/app.js | legacy-lab | atualização do app legado | sim (M) | sim | VALID_LEGACY_BRIDGE | COMMIT | lab-legacy |
| apps/vpertz-lab/public/breeding-ui.js | legacy-lab | ajuste breeding | sim (M) | sim | VALID_LEGACY_BRIDGE | COMMIT | lab-legacy |
| apps/vpertz-lab/public/iv-scan.js | legacy-lab | ajuste iv-scan | sim (M) | sim | VALID_LEGACY_BRIDGE | COMMIT | lab-legacy |
| apps/vpertz-lab/public/pokefipe-core.js | legacy-lab | ajuste pokefipe | sim (M) | sim | VALID_LEGACY_BRIDGE | COMMIT | lab-legacy |
| apps/vpertz-lab/public/styles.css | legacy-lab | estilo | sim (M) | sim | VALID_LEGACY_BRIDGE | COMMIT | lab-legacy |
| dev-server.mjs | tooling | ajuste do dev server | sim (M) | dev-only | VALID_NEW_ARCHITECTURE | COMMIT | tooling |
| frontend/src/App.tsx | react | rota /comunidade | sim (M) | **sim** | VALID_NEW_ARCHITECTURE | COMMIT | react-comunidade |
| frontend/src/features/hub/HubHomePage.tsx | react-hub | link comunidade | sim (M) | sim | VALID_NEW_ARCHITECTURE | COMMIT | react-comunidade |
| frontend/src/features/hub/HubLayout.tsx | react-hub | nav comunidade | sim (M) | sim | VALID_NEW_ARCHITECTURE | COMMIT | react-comunidade |
| frontend/src/styles/hub.css | react-hub | estilo comunidade | sim (M) | sim | VALID_NEW_ARCHITECTURE | COMMIT | react-comunidade |
| frontend/src/features/bazaar/components/Header.tsx | react-bazaar | uso de utils/assets | sim (M) | sim | VALID_NEW_ARCHITECTURE | COMMIT | react-assets |
| frontend/src/features/bazaar/components/ProductCard.tsx | react-bazaar | import utils/assets | sim (M) | **sim** | VALID_NEW_ARCHITECTURE | COMMIT | react-assets |
| frontend/src/features/bazaar/pages/AnuncioPage.tsx | react-bazaar | refatoração + assets | sim (M) | **sim** | VALID_NEW_ARCHITECTURE | COMMIT | react-assets |
| frontend/src/features/shared/Carousel.tsx | react-shared | import utils/assets | sim (M) | **sim** | VALID_NEW_ARCHITECTURE | COMMIT | react-assets |
| frontend/src/features/store/pages/NegociarPage.tsx | react-store | import utils/assets | sim (M) | **sim** | VALID_NEW_ARCHITECTURE | COMMIT | react-assets |
| frontend/src/features/store/pages/StoreHomePage.tsx | react-store | import utils/assets | sim (M) | **sim** | VALID_NEW_ARCHITECTURE | COMMIT | react-assets |
| frontend/src/styles/bazaar.css | react-bazaar | estilo | sim (M) | sim | VALID_NEW_ARCHITECTURE | COMMIT | react-assets |
| tests/bazaar.test.mjs | test | cobertura | sim (M) | test | VALID_TEST | COMMIT | tests |
| tests/pokefipe.test.mjs | test | cobertura pokefipe-v2 | sim (M) | test | VALID_TEST | COMMIT | tests |
| tests/route-hunt.test.mjs | test | cobertura rota | sim (M) | test | VALID_TEST | COMMIT | tests |
| tests/vplab-integration.test.mjs | test | cobertura vplab | sim (M) | test | VALID_TEST | COMMIT | tests |
| vercel.json | deploy | CSP p/ v2/v4 prototipos | sim (M) | deploy | VALID_LEGACY_BRIDGE | COMMIT | vercel-csp |

## 2. Arquivos NÃO RASTREADOS (agrupados)

| Arquivo/grupo | Área | Origem | Usado pelo build/React? | Classificação | Ação | Grupo |
| --- | --- | --- | --- | --- | --- | --- |
| frontend/src/features/hub/ComunidadePage.tsx | react-hub | nova página React | **SIM — importada em App.tsx** | VALID_NEW_ARCHITECTURE | COMMIT | react-comunidade |
| frontend/src/utils/assets.ts | react-util | helper de assets | **SIM — importado por 5 páginas React** | VALID_NEW_ARCHITECTURE | COMMIT | react-assets |
| apps/vpertz-lab/public/vplab-dex.json | dados | catálogo dex | **SIM — usado por ivCalculator.ts (React) + prototipos + teste** | VALID_ASSET | COMMIT | lab-data |
| apps/vpertz-lab/public/avaliar-iv-v4.html | legacy-lab | ferramenta prototipo (link no index legado, CSP no vercel, teste) | sim (static-build + Vercel) | VALID_LEGACY_BRIDGE | COMMIT | lab-prototipos |
| apps/vpertz-lab/public/breeding-v2.html | legacy-lab | idem | sim | VALID_LEGACY_BRIDGE | COMMIT | lab-prototipos |
| apps/vpertz-lab/public/pokedex-v2.html | legacy-lab | idem | sim | VALID_LEGACY_BRIDGE | COMMIT | lab-prototipos |
| apps/vpertz-lab/public/pokefipe-v2.html | legacy-lab | idem | sim | VALID_LEGACY_BRIDGE | COMMIT | lab-prototipos |
| apps/vpertz-lab/public/prototype-embed.js | legacy-lab | requerido pelos 4 prototipos | sim | VALID_LEGACY_BRIDGE | COMMIT | lab-prototipos |
| apps/vpertz-lab/public/support.js | legacy-lab | requerido pelos 4 prototipos | sim | VALID_LEGACY_BRIDGE | COMMIT | lab-prototipos |
| apps/vpertz-lab/public/assets/route/alerts/ (13 png) | asset | novos ícones de alerta da rota | sim (rota) | VALID_ASSET | COMMIT | lab-assets |
| apps/vpertz-lab/public/assets/route/types-v2/ (18 png) | asset | novos ícones de tipo | sim (rota) | VALID_ASSET | COMMIT | lab-assets |
| apps/vpertz-lab/public/assets/route/icon-sheet.png | asset | sheet de ícones | sim | VALID_ASSET | COMMIT | lab-assets |
| apps/vpertz-store/public/family-nav.js | legacy-store | script da feature family-nav (18 refs) | sim | VALID_NEW_ARCHITECTURE | COMMIT | family-nav |
| apps/vpertz-store/public/assets/btn-perfil-bazaar-crop.png | asset | ícone family-nav | sim | VALID_ASSET | COMMIT | family-nav |
| tests/avaliar-iv-v4.test.mjs | test | cobre prototipo | test | VALID_TEST | COMMIT | tests |
| tests/breeding-v2.test.mjs | test | cobre prototipo | test | VALID_TEST | COMMIT | tests |
| tests/docker-static-sync.test.mjs | test | **guardrail**: proíbe Docker usar frontend/public/vplab | test | VALID_TEST | COMMIT | tests |
| **apps/vpertz-lab/public/apps/** (210 arq, 15 MB) | — | **cópia aninhada acidental** (public copiado dentro de si) | NÃO | GENERATED | QUARENTENA | — |
| frontend/public/bazaar/ (17 arq) | — | cópia concorrente divergente (tem compat.js extra) | NÃO (Docker faz `rm -rf dist/bazaar`) | DUPLICATE | QUARENTENA | — |
| frontend/public/store/ (2 arq) | — | cópia concorrente | NÃO | DUPLICATE | QUARENTENA | — |
| frontend/public/config.js | — | cópia concorrente | NÃO | DUPLICATE | QUARENTENA | — |
| frontend/public/dados.js | — | cópia concorrente | NÃO | DUPLICATE | QUARENTENA | — |
| frontend/public/styles.css | — | cópia concorrente | NÃO | DUPLICATE | QUARENTENA | — |
| bazaar-25-check.png (1,1 MB) | — | screenshot de verificação | NÃO | TEMPORARY | QUARENTENA | — |
| scripts/read-cdp-output.mjs | tooling | helper CDP não referenciado | NÃO | TEMPORARY | QUARENTENA | — |

> **Nenhum arquivo classificado como UNKNOWN permanece.** Toda entrada foi investigada
> por referências reais no código, testes, Dockerfile, nginx e vercel.json.

---

## 3. Alterações já contidas em commits

Verificado: nenhuma das 45 modificações rastreadas reintroduz código idêntico já commitado.
As rotas React do VPLab (avaliar-iv, pokedex, pokefipe, rota, breeding, clãs, profissões)
já estão em `3a2508f` e **não** são tocadas por estas alterações. A modificação em
`App.tsx` apenas **adiciona** a rota `/comunidade` (React) — não regride rotas existentes.
Os arquivos `ComunidadePage.tsx` e `utils/assets.ts` são novos e a `App.tsx`/páginas
já commitadas passaram a depender deles: são a causa direta do build depender de
arquivos não rastreados.

## 4. Auditoria dos HTML não rastreados (prototipos v2/v4)

| Pergunta | avaliar-iv-v4 | breeding-v2 | pokedex-v2 | pokefipe-v2 |
| --- | --- | --- | --- | --- |
| Regra ainda ausente em React? | parcial (ferramenta prototipo) | parcial | parcial | parcial |
| Asset/texto ainda utilizado? | sim | sim | sim | sim |
| É protótipo? | sim | sim | sim | sim |
| Versão histórica? | não (ativa) | não (ativa) | não (ativa) | não (ativa) |
| Duplicação? | não | não | não | não |
| Pode ser arquivado agora? | **não** | **não** | **não** | **não** |
| Pode ser removido depois? | sim (após paridade React) | sim | sim | sim |

**Conclusão:** os quatro NÃO são descartáveis nesta etapa. Estão (a) linkados pelo
`apps/vpertz-lab/public/index.html` legado, (b) publicados no Vercel com CSP dedicada
em `vercel.json`, (c) cobertos por testes (`avaliar-iv-v4.test.mjs`, `breeding-v2.test.mjs`,
`pokefipe.test.mjs`). Removê-los quebraria links, CSP e testes. → **VALID_LEGACY_BRIDGE**,
committados, NÃO incorporados ao React.

## 7. Matriz de APIs Node × Spring

Roteamento real por ambiente:
- **Docker:** nginx faz `proxy_pass /api/ → http://backend:8080` (Spring) e `/media/ → backend`. **Node não é usado.**
- **Vercel:** build estático (`scripts/build.mjs`) + funções serverless `api/*.js` (**Node**). Spring ausente.
- **Frontend:** chama sempre same-origin `/api/...` e `/media/...` (agnóstico ao backend).

| Endpoint Node | Equivalente Spring | Frontend usa | Vercel usa | Docker usa | Estado | Ação |
| --- | --- | --- | --- | --- | --- | --- |
| api/login.js | AuthController | /api/login | Node | Spring | SPRING_EXISTS_NODE_STILL_ACTIVE | manter (Vercel) |
| api/logout.js | AuthController | /api/logout | Node | Spring | SPRING_EXISTS_NODE_STILL_ACTIVE | manter |
| api/config.js | ConfigController | /api/config | Node | Spring | SPRING_EXISTS_NODE_STILL_ACTIVE | manter |
| api/admin/config.js | AdminController/ConfigController | /api/admin/config | Node | Spring | SPRING_EXISTS_NODE_STILL_ACTIVE | manter |
| api/admin/upload.js | MediaController (MinIO/S3) | /api/admin/upload | Node | Spring | SPRING_EXISTS_NODE_STILL_ACTIVE | manter |
| api/bazaar/auth.js | AuthController | /api/bazaar/auth | Node | Spring | SPRING_EXISTS_NODE_STILL_ACTIVE | manter |
| api/bazaar/chat.js | ChatController | /api/bazaar/chat | Node | Spring | SPRING_EXISTS_NODE_STILL_ACTIVE | manter |
| api/bazaar/og.js | ShareController (OG) | /api/bazaar/og | Node | Spring | SPRING_EXISTS_NODE_STILL_ACTIVE | manter |
| api/bazaar/profile.js | ProfileController | /api/bazaar/profile | Node | Spring | SPRING_EXISTS_NODE_STILL_ACTIVE | manter |
| api/bazaar/report.js | ReportController | /api/bazaar/report | Node | Spring | SPRING_EXISTS_NODE_STILL_ACTIVE | manter |
| api/bazaar/share.js | ShareController | /api/bazaar/share | Node | Spring | SPRING_EXISTS_NODE_STILL_ACTIVE | manter |
| — | FavoriteController | /api/favorites | (verificar) | Spring | SPRING_ONLY | — |
| — | ListingController | /api/listings | (verificar) | Spring | SPRING_ONLY | — |

**Conclusão da matriz:** todo endpoint Node tem par Spring. Nenhum é `NODE_ONLY` nem
`SPRING_ACTIVE_NODE_DEAD`. A remoção de `api/` só é segura quando o Vercel for
aposentado ou passar a apontar para o Spring — **fora desta etapa** (não remover agora).

---

## 10. OCR (fora desta etapa)

Não alterado. Verificação de disponibilidade das imagens: as 20 imagens fornecidas no
chat **não** estão presentes como arquivos no repositório. Diretório-alvo futuro:
`tests/ocr/fixtures/` (a criar). A homologação PaddleOCR permanece como etapa separada.
