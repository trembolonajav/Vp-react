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

---

## 11. Relatório final

```
ETAPA: Consolidação do worktree
STATUS: CONCLUÍDA (exceto validação Docker — daemon indisponível)
HEAD INICIAL: 3a2508fbab036b1f7fac4550fd9906599e3682e9
HEAD FINAL:   bd015f9450995b4ca7945026471876704f326c2c
BACKUP CRIADO: branch backup/pre-consolidacao -> 3a2508f
               patch  ../vpertz-worktree-backup.patch (168 KB)
               patch  ../vpertz-staged-backup.patch (0 B)
               inventário ../vpertz-untracked-inventory.txt (280 arquivos)
ENTRADAS SUJAS INICIAIS: 70 (45 modificadas + 25 grupos não rastreados / 280 arquivos brutos)
ENTRADAS SUJAS FINAIS:   0
COMMITS CRIADOS: 12
  706744e docs: registra auditoria e consolidacao do worktree
  931d9ad feat(hub): adiciona pagina Comunidade em React e rota /comunidade
  bdc9e09 refactor(frontend): extrai helper utils/assets e adota nas paginas React
  39bc84e feat(nav): navegacao family-nav entre os apps estaticos
  beca278 fix(bazaar-legacy): ajustes em chat, conta e perfil
  72d5e4b feat(store-legacy): atualiza pagina de contato
  d292a8e feat(vplab-legacy): ferramentas prototipo v2/v4 e ajustes da ponte legada
  3405bea chore(vplab): adiciona icones de alerta e tipos-v2 da rota
  179e1a1 test: cobertura de prototipos, rota e sincronia estatica do Docker
  c478c72 chore(deploy): CSP dedicada para prototipos vplab v2/v4 no Vercel
  a9de068 chore(tooling): atualiza dev-server
  bd015f9 docs: atualiza README
ARQUIVOS PRESERVADOS: todas as 45 modificações + novos arquivos válidos (React, prototipos, assets, testes)
ARQUIVOS ARQUIVADOS (QUARENTENA, ../vpertz-consolidacao-quarantine/, 17 MB, reversível):
  - apps/vpertz-lab/public/apps/ (cópia aninhada acidental, 210 arq)
  - frontend/public/{bazaar,store,config.js,dados.js,styles.css} (cópias concorrentes divergentes)
  - bazaar-25-check.png (screenshot temporário)
  - scripts/read-cdp-output.mjs (helper CDP não referenciado)
ARQUIVOS REMOVIDOS: nenhum (não-destrutivo; tudo em quarentena, restaurável)
ARQUIVOS AINDA UNKNOWN: nenhum
TESTES EXECUTADOS:
  - Root JS (node --test): 174 pass / 0 fail
  - Frontend React (tsc --noEmit && vite build): OK
  - Root estático (scripts/build.mjs): OK
  - Backend Java (mvn test): 52 pass / 0 fail / 0 erro
RESULTADOS: todos verdes na árvore limpa e 100% committada
BUILD SEM CACHE (Docker): PENDENTE — daemon do Docker Desktop indisponível
BASELINE REPRODUZÍVEL: PARCIAL
  - Cadeia npm + Vite + Maven: SIM (build não consome nenhum arquivo não rastreado;
    provado com git status limpo + builds verdes após a quarentena)
  - Contêiner Docker: a confirmar quando o daemon subir
APIS NODE MAPEADAS: 11 endpoints, todos com par Spring (SPRING_EXISTS_NODE_STILL_ACTIVE);
  Docker usa Spring, Vercel usa Node. Nenhum removido.
PRÓXIMA ETAPA: (1) rodar `docker compose build --no-cache && up -d` para fechar a
  reprodutibilidade do contêiner; (2) só então migrar /bazaar/como-funciona,
  /bazaar/conta e páginas restantes da Store; (3) desativar APIs Node substituídas;
  (4) remover a ponte legada do Docker.
```

---

## 12. Validação Docker do baseline (2026-07-31)

```
ETAPA: Validação Docker do baseline
STATUS: CONCLUÍDA
HEAD: b3512b9 (auditoria) → e depois o commit desta validação de doc
GIT STATUS: limpo (0) antes, durante e depois do ciclo de build
BUILD SEM CACHE: `docker compose build --no-cache` -> SUCESSO (backend + frontend
  reconstruídos do zero). Contexto de build só contém o estado committado; os 17 MB
  de quarentena estão FORA do repositório, logo não entram na imagem.
CONTAINERS (docker compose up -d): 4/4 no ar
  - vpertz-postgres  healthy
  - vpertz-minio     healthy
  - vpertz-backend   healthy
  - vpertz-frontend  up (nginx; sem healthcheck definido)
FLYWAY: 8 migrations validadas; schema "public" na versão 8; "up to date".
POSTGRESQL: PostgreSQL 16.14; Hikari conectou (HikariPool-1 Start completed); sem erros.
MINIO: healthy; bucket `vpertz-media`; STORAGE_TYPE=s3 (endpoint http://minio:9000).
ROTAS REACT (via nginx :8090) — todas 200:
  / , /bazaar/ , /bazaar/anuncio/an-3 , /vplab/ , /vplab/pokedex , /vplab/pokefipe ,
  /vplab/rota , /vplab/breeding , /vplab/clas , /vplab/profissoes
ROTAS API (via proxy nginx → Spring) — 200:
  /api/v1/config (retorna whatsapp,banners,games,bazaar,contatos)
  /api/v1/listings (12 anúncios)
PERSISTÊNCIA APÓS REINÍCIO:
  - Postgres: após `restart backend`, /api/v1/listings continua com 12 (dados no volume pgdata).
  - MinIO: upload e2e novo (login vpadmin → POST /api/v1/media → 200 url /media/img-...png →
    GET 200); após `restart minio`, o mesmo objeto continua servindo 200 (volume miniodata).
  - Uploads: pipeline ponta-a-ponta OK. (Obs: 1 anúncio legado referencia
    /media/img-1785247696079-...png que dá 404 — dado antigo do storage em disco anterior,
    NÃO relacionado a esta consolidação.)
LOGS: sem exceptions no boot do Spring; nginx subiu workers normalmente.
BASELINE INTEGRALMENTE REPRODUZÍVEL: SIM
  (build sem cache + 4 containers + rotas + persistência todos aprovados, a partir
   exclusivamente do estado committado; nenhum arquivo necessário fora do Git.)
PROBLEMAS ENCONTRADOS (pré-existentes, NÃO causados pela consolidação):
  1. nginx `proxy_pass http://backend:8080` SEM diretiva `resolver` → resolve o IP do
     backend só no boot. Um `restart` isolado do backend troca o IP e o proxy passa a
     dar 502 até o nginx reiniciar/recarregar. O `up` do stack inteiro funciona 100%.
     Correção sugerida (etapa futura, não agora): adicionar `resolver 127.0.0.11 valid=10s;`
     + variável no `proxy_pass`, ou reiniciar o frontend junto do backend.
  2. Anúncio legado aponta para objeto de mídia inexistente no bucket atual (404) —
     resíduo do storage em disco anterior; limpar na migração de dados futura.
  3. Docker Desktop/WSL2 apresentou instabilidade intermitente sob reinícios sucessivos
     e rápidos de serviços isolados (daemon/port-proxy travando por alguns minutos).
     Ambiente, não código; recuperou sozinho.
PRÓXIMA ETAPA: migrar as 5 páginas restantes começando por /bazaar/como-funciona e
  /bazaar/conta; depois desativar APIs Node substituídas e remover a ponte legada do Docker.
```

> **Recomendação do usuário registrada:** compactar `../vpertz-consolidacao-quarantine/`
> (17 MB) e preservá-la até o fim da migração geral, sem devolver ao Git.

---

## 13. Estabilização pós-baseline (2026-08-01)

Duas correções técnicas encontradas na validação Docker, feitas ANTES de migrar páginas.
Sem remover legado, sem alterar OCR, sem migrar páginas.

### 13.1 `fix(infra)` — resolução dinâmica do backend no Nginx

**Problema comprovado:** `frontend/nginx.conf` usava `proxy_pass http://backend:8080;` com
hostname literal → o Nginx resolvia o IP do `backend` só no boot. Um `restart` isolado do
backend troca o IP do container e o proxy passava a responder **502** até o Nginx reiniciar.

**Correção:** adicionado `resolver 127.0.0.11 valid=10s ipv6=off;` (DNS interno do Docker) e
`proxy_pass` via variável (`set $backend_api http://backend:8080; proxy_pass $backend_api$request_uri;`
em `/api/` e o equivalente em `/media/`). A variável força a re-resolução por requisição;
`$request_uri` preserva caminho+query (inclui OG/share). Headers, `client_max_body_size 5m`,
uploads e o fallback SPA foram preservados.

**Teste (2 iterações):**
```
baseline via nginx /api/v1/config = 200
restart SOMENTE backend → healthy → /api/v1/config=200  /api/v1/listings=200  (frontend NÃO reiniciado)
restart SOMENTE backend → healthy → /api/v1/config=200  /api/v1/listings=200  (frontend NÃO reiniciado)
```
Aprovado: sem 502 e SEM reiniciar o frontend.

### 13.2 `fix(media)` — referência de mídia legada órfã

**Auditoria DB × MinIO** (todas as colunas de URL do Postgres vs objetos do bucket):
- Colunas varridas: `listings.img_url`, `listings.vendedor_avatar`, `users.avatar`
  (a tabela `messages` NÃO possui coluna de imagem).
- **Única referência `/media/` quebrada:** anúncio `com-imagem-enviada-d8edd`,
  `img_url = /media/img-1785247696079-b4cb7a4babcefac8.png`.
  - Formato `img-{timestamp}-{hex}` = upload legado da API Node (Vercel), não o esquema
    atual `img-{uuid}` do `MediaService` Spring.
  - Sem linha em `media_assets` → o `MediaController` nunca conseguiria servir (404 comprovado).
  - Bytes ausentes no MinIO; não recuperáveis (upload legado perdido); NÃO está no seed
    (`config.json`) → é dado de runtime, não reproduzível.
- `media_assets` tinha só 1 objeto (upload de teste do e2e), não referenciado por anúncios.

**Correção (dupla, opção “remover referência inválida + placeholder oficial”):**
1. **Código (committado, reproduzível):** fallback `onError` → placeholder oficial "VP"
   em `ProductCard` (`Arte`) e no herói do `AnuncioPage`. Qualquer mídia ausente passa a
   degradar para o placeholder em vez de card quebrado — protege inclusive uploads futuros.
2. **Dado (volume atual):** `UPDATE listings SET img_url='' WHERE public_id='com-imagem-enviada-d8edd'`
   (`UPDATE 1`), alinhando o anúncio aos irmãos `com-imagem-enviada`/`-841c8` (img vazia).

**Pós-correção:** 0 anúncios com `/media/` órfão; upload e2e novo OK
(`POST /api/v1/media` 200 → GET 200). Nenhuma outra mídia quebrada.

### 13.3 Testes desta etapa
```
Node (node --test): 174 pass / 0 fail   (inclui asserts de nginx.conf)
Maven (mvn test):   52 pass / 0 fail
Frontend (tsc --noEmit && vite build): OK
Docker (compose build frontend): SUCESSO  (backend inalterado)
Nginx/Spring/Postgres/MinIO: saudáveis; /api/v1/config e /api/v1/listings 200
Git status: limpo após os commits
```
