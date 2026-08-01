# Auditoria real da migração React + Java + PostgreSQL + Docker

Data: 30/07/2026
Escopo verificado: código-fonte, roteadores, Nginx, imagens Docker em execução,
APIs, migrations, persistência e OCR.

## 1. Resumo executivo

A migração **não está concluída**. A aplicação atualmente publicada pelo Docker
é híbrida:

```text
Nginx
├── SPA React/TypeScript
│   ├── Hub
│   ├── parte da Store
│   ├── login, cadastro e administração
│   └── /vplab/avaliar-iv
└── HTML/CSS/JavaScript copiado de apps/
    ├── páginas restantes do Bazaar
    ├── shell e seis ferramentas do VPLab
    └── páginas restantes da Store

Spring Boot → PostgreSQL
└── autenticação, configuração, anúncios, perfil, chat e denúncias

Spring Boot → MinIO/S3
└── objetos privados com metadados no PostgreSQL
```

O backend moderno existe e está operacional, mas parte relevante do frontend
ativo não o utiliza porque o Nginx entrega arquivos legados antes do fallback do
React Router. `frontend/public/bazaar` e `frontend/public/vplab` também contêm
cópias concorrentes. O Docker atual possui uma etapa `static-build` que copia
`apps/` e substitui partes do `dist` React.

Estados usados neste relatório:

- `NEW_ACTIVE`: implementação nova realmente servida e utilizada.
- `NEW_INACTIVE`: implementação nova existe, mas não está ligada.
- `PARTIAL`: fluxo novo ativo, mas incompleto ou ainda dependente do legado.
- `LEGACY_ACTIVE`: versão antiga continua operacional.
- `LEGACY_REFERENCE`: legado presente apenas para comparação.
- `DUPLICATE`: duas implementações concorrentes.
- `DEAD_CODE`: não há fluxo identificado utilizando o código.
- `UNKNOWN`: não foi possível confirmar com segurança.

## 2. Arquitetura definitiva

```text
frontend/src/ → React + TypeScript + Vite + React Router
backend/      → Java 21 + Spring Boot
PostgreSQL    → dados persistentes e Flyway
StorageService → S3/MinIO
Docker Compose → frontend + backend + postgres + minio
```

`apps/`, `api/`, `dev-server.mjs`, o build Node antigo, `.data/` e as cópias
em `frontend/public` são somente material de migração e deverão sair do runtime
depois da paridade.

## 3. Percentuais auditados

Os percentuais medem critérios observáveis, não volume de linhas.

| Camada | Resultado | Cálculo |
|---|---:|---|
| Frontend ativo | **60%** | 15 de 25 rotas/fluxos de usuário auditados são React ativos |
| Cobertura React existente | **56%** | 14 de 25 já possuem página TSX, ativa ou desligada |
| Backend funcional | **80%** | 12 de 15 domínios necessários possuem API Spring utilizável |
| Persistência moderna | **100%** | os 7 domínios persistentes principais possuem tabelas/repositórios PostgreSQL |
| Docker definitivo | **75%** | backend, Postgres e MinIO definitivos; frontend ainda incorpora legado |
| OCR representativamente validado | **0%** | 2 imagens aprovadas, mas a suíte representativa exigida ainda não existe |

Há **12 rotas/fluxos legados ativos**: dois do Bazaar, três da Store e sete
ferramentas acessíveis pelo shell legado do VPLab. O Avaliar IV entra nessa
contagem porque o shell antigo ainda expõe a versão Tesseract, embora exista uma
rota React separada.

## 4. Matriz de rotas

### Hub, Store e administração

| Área | Rota | Implementação atual | Implementação nova | Backend | Persistência | Docker serve | Estado | Ação |
|---|---|---|---|---|---|---|---|---|
| Hub | `/` | React | `HubHomePage` | config Spring | PostgreSQL | React | NEW_ACTIVE | validar visual/mobile |
| Hub | `/comunidade` | React | `ComunidadePage` | config Spring | PostgreSQL | React | NEW_ACTIVE | validar integrações |
| Store | `/store/` | React forçado no Nginx | `StoreHomePage` | config Spring | PostgreSQL | React | NEW_ACTIVE | manter |
| Store | `/store/negociar` | React | `NegociarPage` | config Spring | PostgreSQL | React | NEW_ACTIVE | manter |
| Store | `/store/contato` | React | `ContatoPage` | config Spring | PostgreSQL | React | NEW_ACTIVE | manter |
| Store | `/store/jogos` | catálogo incorporado à home React | `StoreHomePage` | config Spring | PostgreSQL | React | REACT_ACTIVE | manter alias oficial |
| Store | `/store/intermedio` | React | `IntermedioPage` | config Spring | PostgreSQL | React | REACT_ACTIVE | manter |
| Store | `/store/offline` | React | `OfflinePage` | nenhum | nenhum | React | REACT_ACTIVE | manter fallback visual |
| Store antiga | `/store/jogos.html`, `/store/intermedio.html`, `/store/offline.html` | HTML físico preservado | redirecionamento 308 | nenhum | nenhum | Nginx redireciona | LEGACY_REFERENCE | retirar em etapa própria |
| Admin | `/admin` | React protegido | `AdminPage` + `AdminModerationPanel` | Spring ADMIN | PostgreSQL | React | NEW_ACTIVE | manter |
| Admin compatível | `/store/admin` e `/store/admin.html` | painel antigo não publicado nesta URL | redireciona para `/admin` (`AdminPage`) | Spring ADMIN | PostgreSQL | Nginx redireciona | REACT_ACTIVE | manter compatibilidade |

### Bazaar

| Área | Rota | Implementação atual | Implementação nova | Backend | Persistência | Docker serve | Estado | Ação |
|---|---|---|---|---|---|---|---|---|
| Bazaar | `/bazaar/` | React | `MarketplacePage` | Spring listings/favorites | PostgreSQL | React | NEW_ACTIVE | manter |
| Bazaar | `/bazaar/anuncio/:id` | React | `AnuncioPage` | Spring listings/chat/reports | PostgreSQL | React | NEW_ACTIVE | ampliar teste visual e autenticado |
| Bazaar antigo | `/bazaar/anuncio.html?id=` | HTML/JS | substituído pela rota limpa | Node Bazaar | `.data`/Blob | arquivo ainda presente | LEGACY_REFERENCE | retirar do runtime após paridade |
| Bazaar | `/bazaar/anunciar` e `/bazaar/anunciar/:id` | React | `AnunciarPage` | Spring listings/media | PostgreSQL + volume de mídia | React | NEW_ACTIVE | manter; migrar mídia para S3/MinIO |
| Bazaar | `/bazaar/meus-anuncios` | React | `MeusAnunciosPage` | Spring listings | PostgreSQL | React | NEW_ACTIVE | manter |
| Bazaar antigo | `/bazaar/anunciar.html` e `/bazaar/meus-anuncios.html` | HTML/JS | substituídos pelas rotas limpas | Node/localStorage | localStorage | arquivos ainda presentes | LEGACY_REFERENCE | retirar após atualizar todas as pontes |
| Bazaar | `/bazaar/perfil` e `/bazaar/perfil/:username` | React | `PerfilPage` | Spring profiles | PostgreSQL | React | NEW_ACTIVE | manter |
| Bazaar antigo | `/bazaar/perfil.html?user=` | HTML/JS | substituído pela rota com username | Node profile | JSON efêmero | arquivo ainda presente | LEGACY_REFERENCE | retirar após atualizar todas as pontes |
| Bazaar | `/bazaar/chat` | React | `ChatPage` | Spring conversations/messages | PostgreSQL | React | NEW_ACTIVE | manter |
| Bazaar antigo | `/bazaar/chat.html` | HTML/JS | substituído pela rota limpa | Node chat | JSON efêmero | arquivo ainda presente | LEGACY_REFERENCE | retirar após atualizar todas as pontes |
| Bazaar | `/bazaar/conta.html` | HTML/JS | inexistente como página de conta | Node auth/profile | JSON efêmero | legado | LEGACY_ACTIVE | criar React |
| Bazaar | `/bazaar/login` | React | `LoginPage` | Spring auth | PostgreSQL | React | NEW_ACTIVE | manter |
| Bazaar | `/bazaar/cadastro` | React | `LoginPage` | Spring auth | PostgreSQL | React | NEW_ACTIVE | manter |
| Bazaar | `/login` | redirecionamento React | substituído por `/bazaar/login` | nenhum | nenhum | React | LEGACY_BRIDGE | remover após atualizar links externos |
| Bazaar | `/bazaar/como-funciona.html` | HTML | inexistente | nenhum | estático | legado | LEGACY_ACTIVE | converter para React |

O `App.tsx` mantém `BazaarRedirect` somente para caminhos limpos ainda não
migrados. Marketplace, detalhe, anunciar, meus anúncios, autenticação e perfil
são React. Como funciona ainda usa link `.html` explícito classificado como
`LEGACY_BRIDGE`.

### VPLab

| Área | Rota/aba | Atual | Nova | Backend | Dados | Docker serve | Estado | Ação |
|---|---|---|---|---|---|---|---|---|
| VPLab | `/vplab/avaliar-iv` | React | `IvScannerPage` | client-side | modelos locais | React | NEW_ACTIVE | ampliar suíte OCR |
| VPLab | `/vplab/?tab=avaliar` | HTML + Tesseract | React separado | client-side | assets | legado | DUPLICATE | apontar shell para React e aposentar versão antiga |
| VPLab | `/vplab/?tab=pokedex` | HTML/JS | inexistente | client-side | JSON estático | legado | LEGACY_ACTIVE | migrar |
| VPLab | `/vplab/?tab=fipe` | HTML/JS | inexistente | client-side | JS/JSON estático | legado | LEGACY_ACTIVE | migrar |
| VPLab | `/vplab/?tab=rota` | HTML/JS | inexistente | client-side | JS/JSON estático | legado | LEGACY_ACTIVE | migrar |
| VPLab | `/vplab/?tab=breeding` | HTML/JS | inexistente | client-side | JSON estático | legado | LEGACY_ACTIVE | migrar |
| VPLab | `/vplab/?tab=clas` | HTML/JS | inexistente | client-side | JSON estático | legado | LEGACY_ACTIVE | migrar |
| VPLab | `/vplab/?tab=profissoes` | HTML/JS | inexistente | client-side | JS estático | legado | LEGACY_ACTIVE | migrar |

Dados de referência do VPLab podem permanecer como JSON/TypeScript tipado; eles
não são dados transacionais e não precisam ser enviados ao PostgreSQL sem ganho
concreto.

## 5. Matriz de backend e persistência

| Funcionalidade | API antiga | API Spring | Dados antigos | PostgreSQL | Estado | Ação |
|---|---|---|---|---|---|---|
| Autenticação | `/api/bazaar/auth`, `/api/login` | `/api/v1/auth/*` | `bazaar-accounts.json`, env | `users` | NEW_ACTIVE | rotas React ativadas; avaliar cookie HttpOnly |
| Usuários | JSON local/Blob | auth + `/profiles` | JSON | `users` | NEW_ACTIVE | migração de dados reais pendente |
| Anúncios | `/api/config` + arrays | `/api/v1/listings` | config/localStorage | `listings`, `listing_types` | NEW_ACTIVE | manter e ampliar administração |
| Favoritos | localStorage | `/api/v1/favorites` | localStorage | `favorites` | NEW_ACTIVE | manter |
| Perfil | `/api/bazaar/profile` | `/api/v1/profiles` | JSON | `users` | NEW_ACTIVE | migrar dados reais e avaliar privacidade do contato |
| Conversas | `/api/bazaar/chat` | `/api/v1/conversations` | JSON | `conversations` | NEW_ACTIVE | manter |
| Mensagens/não lidas | `/api/bazaar/chat` | endpoints de conversa | JSON | `messages`, `message_reads` | NEW_ACTIVE | manter |
| Denúncias | `/api/bazaar/report` | `/api/v1/reports` | JSON | `reports` | NEW_ACTIVE | completar painel administrativo |
| Bloqueios | inexistente | inexistente | inexistente | inexistente | UNKNOWN | definir regra e implementar se necessária |
| Configuração | `/api/config`, `/api/admin/config` | `/api/v1/config`, `/api/v1/admin/config` | config.json/Blob | tabelas de config | NEW_ACTIVE | remover consumidor legado |
| Banners/contatos/taxonomia | config Node | config/admin Spring | config.json | tabelas próprias | PARTIAL | completar UI admin/testes |
| Uploads | `/api/admin/upload` | `/api/v1/media` + `/media/{id}` | Blob/filesystem | `media_assets` + bucket privado | NEW_ACTIVE | manter |
| Open Graph | `/api/bazaar/og` | `/api/v1/share/{id}/image.png` | render dinâmico Node | dados de `listings` | NEW_ACTIVE | manter |
| Compartilhamento | `/api/bazaar/share` | `/api/v1/share/{id}` + Web Share | Node redirect/HTML | dados de `listings` | NEW_ACTIVE | manter |
| Administração de denúncias/anúncios | parcial no Node | `/api/v1/admin/reports` e `/listings` | JSON | `reports`, `listings` | NEW_ACTIVE | manter |

As seis migrations Flyway foram verificadas como aplicadas no container:
configuração, anúncios, usuários, vínculo do vendedor, chat e denúncias.
Metadados de mídia e eventuais bloqueios ainda não possuem schema.

## 6. Auditoria do Docker e Nginx

1. `backend/Dockerfile` usa contexto `./backend`, Maven/Java 21, executa
   `mvn ... clean package` e serve somente o JAR Spring.
2. `frontend/Dockerfile` usa **o contexto raiz**.
3. A etapa `static-build` copia `package*.json`, `apps/` e `scripts/`, executando
   o build Node legado.
4. A etapa `react-build` copia `frontend/` e executa Vite.
5. Depois do Vite, o Dockerfile apaga `dist/vplab`, `dist/bazaar` e `dist/store`
   e os substitui pelo resultado legado. Também copia `assets`, `config.js`,
   `dados.js` e `styles.css`.
6. Nginx serve `/usr/share/nginx/html`. Arquivos e diretórios físicos vencem o
   fallback `/index.html`.
7. `/api/` e `/media/` são enviados ao Spring Boot.
8. `/store/` é uma exceção explícita que entrega o SPA React.
9. `frontend/public/bazaar` contém 17 arquivos concorrentes;
   `frontend/public/vplab` contém outra cópia completa do shell e do Tesseract.
10. O Compose sobe `frontend`, `backend` e `postgres`. Não há MinIO.
11. `mediadata` persiste uploads locais; `pgdata` persiste PostgreSQL.

Conclusão: o backend Docker já é moderno; o frontend Docker ainda depende
operacionalmente de `apps/`; o storage definitivo ainda não existe.

## 7. Auditoria do OCR

### Rota nova

- `/vplab/avaliar-iv` cai no `index.html` do SPA e é resolvida pelo React Router.
- Engine: `@paddleocr/paddleocr-js` com PP-OCRv6 tiny.
- Modelos locais:
  - detecção: 1.792.000 bytes;
  - reconhecimento: 4.526.080 bytes;
  - total dos modelos: 6.318.080 bytes.
- Runtime/chunks grandes carregados sob demanda: aproximadamente 49 MB não
  comprimidos, além dos modelos.
- Nenhuma chamada a serviço OCR externo foi encontrada.
- Upload, drag-and-drop e `Ctrl+V` existem no componente.
- Arquivo não-imagem é rejeitado pelo tipo MIME; erros do engine são exibidos.
- O parser cobre espécie, nível, qualidade, IV, poder e seis atributos.

### Evidência disponível

| Layout | Campos corretos | Tempo |
|---|---:|---:|
| Card completo com barras | 9/9 | 1009 ms |
| Tooltip do inventário | 10/10 | 744 ms |

Métricas **somente para esta amostra de duas imagens**:

- acerto por campo: 19/19 = 100%;
- acerto total: 2/2 = 100%;
- média: 876,5 ms;
- mediana: 876,5 ms;
- pior caso: 1009 ms;
- falha: 0/2.

Esses números não validam o OCR de forma representativa. Memória, mobile,
offline após cache, imagens comprimidas, escalas do Windows, baixo brilho e
ambiguidades `0/O`, `1/I`, `5/S`, `8/B` estão **NÃO TESTADOS**.

### Duplicação

O shell legado `/vplab/?tab=avaliar` continua usando Tesseract.js. Portanto
Paddle e Tesseract estão ativos em fluxos concorrentes. O Tesseract deve ser
mantido apenas até o shell apontar para a rota React e a suíte ampliada aprovar
o novo leitor.

## 8. Duplicações e código legado

- `apps/vpertz-bazaar/public` e `frontend/public/bazaar`.
- `apps/vpertz-lab/public` e `frontend/public/vplab`.
- VPLab possui ainda caminhos acidentalmente duplicados como
  `apps/vpertz-lab/public/apps/vpertz-lab/public/assets`.
- React Bazaar e HTML Bazaar implementam os mesmos seis fluxos.
- API Node e Spring implementam autenticação, perfil, chat, denúncias, config e
  uploads em paralelo.
- `dev-server.mjs` ainda despacha `/api/` Node e serve `.data/uploads`.
- `scripts/build.mjs` ainda é obrigatório para a imagem frontend atual.

Não foi classificado como `DEAD_CODE` o que ainda pode ser usado pela Vercel ou
pelo servidor da porta 8736. A confirmação de produção externa é necessária
antes de apagar APIs Node.

## 9. Dados fora do PostgreSQL

- favoritos do Bazaar em `localStorage`;
- anúncios criados pelo Bazaar legado em `localStorage`;
- contas/chat/config usados pela stack Node em `.data` ou Vercel Blob;
- uploads da stack nova em volume local, sem metadados próprios;
- configurações ainda consumidas por páginas legadas;
- dados estáticos do VPLab em JS/JSON, legitimamente estáticos.

O JWT é armazenado em `localStorage`. Isso não é banco, mas aumenta o impacto de
XSS; cookies `HttpOnly` devem ser avaliados antes da arquitetura final.

## 10. Riscos de remoção

- Remover `apps/` agora quebra 12 rotas/fluxos.
- Remover `api/` quebra o deploy legado/Vercel e as páginas HTML ativas.
- Remover `frontend/public/vplab` antes de ajustar o build pode retirar
  Tesseract/assets usados por testes e fallback.
- Remover `.data` sem migração pode perder contas, configuração e chat locais.
- Ativar todas as páginas Bazaar simultaneamente dificulta isolar regressões de
  autenticação, navegação e assets.

## 11. Ordem exata de migração

1. **Concluído:** ativar isoladamente `/bazaar/anuncio/:id`; os cards do
   marketplace ativo agora apontam para a rota limpa.
2. **Concluído:** ativar `/bazaar/`, com filtros, contadores e paginação Spring.
3. **Concluído:** ativar `/bazaar/login` e `/bazaar/cadastro`, consolidando autenticação React.
4. **Concluído:** ativar perfil próprio e público em React.
5. **Concluído:** ativar `/bazaar/anunciar` e `/bazaar/meus-anuncios`.
6. **Concluído:** ativar chat e denúncias com testes de autorização.
7. **Concluído:** implementar favoritos no Spring/PostgreSQL.
8. **Concluído:** implementar Open Graph/compartilhamento no Spring.
9. **Concluído:** adicionar S3StorageService/MinIO e migration de metadados.
10. **Concluído:** completar administração.
11. Migrar VPLab na ordem: Avaliar IV no shell, PokeFipe, Pokédex, Rotas,
    Breeding, Clãs e Profissões.
12. Migrar Store Jogos/Intermédio e eliminar HTML restante.
13. Retirar `static-build`, `apps/`, APIs Node e cópias de `frontend/public`.

## 12. Primeiro módulo seguro

`/bazaar/anuncio/:id` foi o primeiro módulo escolhido porque:

- `AnuncioPage.tsx` já existe;
- `GET /api/v1/listings/{publicId}` é público e persistido no PostgreSQL;
- a tela pode ser ativada sem alterar dados;
- chat e denúncia já apontam para services Spring quando autenticados;
- uma rota específica pode preceder o wildcard legado sem ativar o Bazaar todo;
- o HTML antigo permanece disponível em `/bazaar/anuncio.html` para comparação.

Resultado: rota React registrada antes do wildcard legado, cards do marketplace
encaminhando para a URL limpa, leitura real testada com o anúncio `an-3` pelo
proxy Nginx → Spring e Docker respondendo HTTP 200. O fluxo autenticado
Negociar → Chat ainda depende da futura ativação da página React de chat e deve
ser retestado nessa etapa.

## 13. Registro da etapa atual

```text
ETAPA: Auditoria completa + primeira ativação Bazaar
STATUS: CONCLUÍDA
COMMIT: feat(bazaar): activate React listing detail route
ARQUIVOS ALTERADOS:
  docs/AUDITORIA_MIGRACAO_REACT.md
  frontend/src/App.tsx
  apps/vpertz-bazaar/public/bazaar.js
  tests/react-route-migration.test.mjs
ROTAS MIGRADAS: /bazaar/anuncio/:id
ROTAS AINDA LEGADAS: 18 fluxos auditados
APIS ANTIGAS REMOVIDAS: nenhuma
DADOS MIGRADOS: nenhum; a rota nova já lê listings do PostgreSQL
TESTES EXECUTADOS: Node, TypeScript/Vite, API/HTTP e Docker
RESULTADOS: aprovados
DIVERGÊNCIAS: chat autenticado e responsividade visual ainda não retestados
PRÓXIMA ETAPA: validar e ativar /bazaar/ em React
```

## 14. Registro da etapa Marketplace

```text
ETAPA: Ativação do Marketplace React
STATUS: CONCLUÍDA
COMMIT: feat(bazaar): activate React marketplace
ROTA ATIVADA: /bazaar/
ROTA LEGADA SUBSTITUÍDA: /bazaar/index.html no fluxo normal
PONTES LEGADAS:
  /bazaar/anunciar.html
  /bazaar/como-funciona.html
BACKEND: GET /api/v1/listings
PERSISTÊNCIA: PostgreSQL
```

Checklist de paridade:

- [x] hero, cabeçalho e rodapé
- [x] busca
- [x] tipo, intenção e moeda
- [x] preço, qualidade, IV, nível e poder
- [x] tipos elementares
- [x] ordenação e paginação
- [x] cards, destaque, shiny e links
- [x] loading, vazio e tratamento de erro implementados
- [x] desktop, tablet e mobile inspecionados
- [x] console sem erros
- [x] Docker entregando React
- [ ] favoritos no PostgreSQL

Evidências executadas:

- API: 17 anúncios ativos, igual ao `count(*)` do PostgreSQL;
- busca `char`: 2 resultados;
- paginação com tamanho 2: páginas 1 e 2 distintas;
- filtros de tipo, intenção, moeda, preço, qualidade, IV, nível, poder e tipos
  elementares responderam HTTP 200;
- ordenação por título testada;
- runtime Docker: 12 cards, 17 no total e nenhum `bazaar.js` carregado;
- viewport real 390 × 844: sem overflow horizontal;
- desktop e mobile: nenhuma exceção no console;
- logs Spring: nenhuma ocorrência de erro/exceção durante os testes.

## 15. Registro da etapa Autenticação

```text
ETAPA: Ativação do login e cadastro React
STATUS: CONCLUÍDA
ROTAS ATIVADAS:
  /bazaar/login
  /bazaar/cadastro
ROTA DE COMPATIBILIDADE:
  /login -> /bazaar/login
BACKEND:
  POST /api/v1/auth/login
  POST /api/v1/auth/register
  GET /api/v1/auth/me
PERSISTÊNCIA: PostgreSQL, tabela users, senha bcrypt
```

Validações executadas:

- [x] cadastro pela interface React;
- [x] login por usuário e por e-mail;
- [x] senha inválida respondendo 401 e mensagem segura;
- [x] token autenticando `/me`;
- [x] sessão restaurada após recarregar a página;
- [x] usuário persistido no PostgreSQL com bcrypt;
- [x] redirecionamento para a origem após autenticação;
- [x] rotas entregues pelo Nginx do Docker;
- [x] desktop inspecionado;
- [x] viewport móvel real 390 × 844 sem overflow;
- [x] nenhuma exceção JavaScript inesperada;
- [x] usuário descartável removido ao final da auditoria.

Limitação conhecida: o JWT permanece no `localStorage`. O fluxo está integrado
ao Spring/PostgreSQL, mas a arquitetura final deve avaliar cookie `HttpOnly`
antes de considerar a segurança de sessão encerrada.

## 16. Registro da etapa Perfil

```text
ETAPA: Ativação do perfil React
STATUS: CONCLUÍDA
ROTAS ATIVADAS:
  /bazaar/perfil
  /bazaar/perfil/:username
ROTA LEGADA SUBSTITUÍDA:
  /bazaar/perfil.html?user=
BACKEND:
  GET /api/v1/profiles/{username}
  PUT /api/v1/profiles/me
PERSISTÊNCIA: PostgreSQL, tabela users
```

Validações executadas:

- [x] perfil próprio protegido por autenticação;
- [x] perfil público acessível anonimamente;
- [x] atualização limitada ao usuário identificado pelo JWT;
- [x] bio, contato, contato preferido e avatar persistidos;
- [x] sanitização de tags sem resíduos visuais;
- [x] perfil inexistente respondendo 404;
- [x] atualização anônima respondendo 401;
- [x] persistência confirmada após reiniciar o backend;
- [x] links do detalhe apontando para a rota React limpa;
- [x] nenhuma carga de `perfil.js` na rota nova;
- [x] desktop inspecionado;
- [x] viewport móvel real 390 × 844 sem overflow.

O arquivo `perfil.html` permanece somente como `LEGACY_REFERENCE`. O
`conta.html` continua ativo porque ainda reúne outros atalhos e fluxos não
migrados.

## 17. Registro da etapa Gestão de anúncios

```text
ETAPA: Ativação da criação e gestão de anúncios React
STATUS: CONCLUÍDA
ROTAS ATIVADAS:
  /bazaar/anunciar
  /bazaar/anunciar/:id
  /bazaar/meus-anuncios
ROTAS LEGADAS SUBSTITUÍDAS:
  /bazaar/anunciar.html
  /bazaar/meus-anuncios.html
BACKEND:
  POST /api/v1/listings
  PUT /api/v1/listings/{id}
  PATCH /api/v1/listings/{id}/status
  DELETE /api/v1/listings/{id}
  POST /api/v1/media
PERSISTÊNCIA: PostgreSQL e volume Docker de mídia
```

Validações executadas:

- [x] criar, editar, listar e excluir com usuário autenticado;
- [x] pausar, reativar, marcar como vendido e reabrir;
- [x] proprietário autorizado e outro usuário respondendo 403;
- [x] status preservado durante a edição;
- [x] nível 433 aceito e teto de segurança em 1000;
- [x] upload PNG real aceito e servido pelo volume de mídia;
- [x] persistência confirmada após recriar o backend;
- [x] rotas limpas entregues pelo Nginx, sem scripts legados;
- [x] desktop e viewport móvel 390 × 844 sem overflow;
- [x] console sem erros;
- [x] dados e mídia descartáveis removidos ao final.

Os HTMLs antigos permanecem apenas como `LEGACY_REFERENCE`. O armazenamento de
mídia local é persistente no Docker, mas continua `PARTIAL` até a futura etapa
S3/MinIO.

## 18. Registro da etapa Chat e denúncias

```text
ETAPA: Ativação do chat e denúncias React
STATUS: CONCLUÍDA
ROTA ATIVADA: /bazaar/chat
ROTA LEGADA SUBSTITUÍDA: /bazaar/chat.html
BACKEND: /api/v1/conversations, /messages, /read, /status e /api/v1/reports
PERSISTÊNCIA: PostgreSQL
```

Validações executadas:

- [x] conversa criada somente para anúncio real e ativo;
- [x] vendedor, título, preço e imagem obtidos do PostgreSQL;
- [x] negociação com o próprio anúncio bloqueada;
- [x] apenas comprador e vendedor acessam histórico, mensagens e status;
- [x] mensagens e contagem de não lidas persistidas;
- [x] link de negociação abre diretamente a conversa;
- [x] denúncia vinculada ao anúncio real;
- [x] denúncia do próprio anúncio bloqueada;
- [x] denúncia aberta duplicada bloqueada;
- [x] registros temporários removidos após a auditoria.

O painel administrativo de tratamento de denúncias continua pendente. O HTML
antigo do chat permanece apenas como `LEGACY_REFERENCE`.

## 19. Registro da etapa Favoritos

```text
ETAPA: Migração de favoritos para Spring/PostgreSQL
STATUS: CONCLUÍDA
API: GET/POST/DELETE /api/v1/favorites
PERSISTÊNCIA: PostgreSQL, tabela favorites
```

Validações executadas:

- [x] favoritos isolados por usuário autenticado;
- [x] inclusão idempotente e chave única no banco;
- [x] anúncio inexistente respondendo 404;
- [x] acesso anônimo respondendo 401;
- [x] remoção automática com usuário ou anúncio;
- [x] persistência confirmada após reiniciar o backend;
- [x] `localStorage` removido do card React;
- [x] uma única consulta para carregar os favoritos da grade;
- [x] atualização otimista com reversão quando a API falha;
- [x] dados temporários removidos após a auditoria.

## 20. Registro da etapa Open Graph e compartilhamento

```text
ETAPA: Migração de Open Graph e compartilhamento para Spring
STATUS: CONCLUÍDA
LINK COMPARTILHÁVEL: /api/v1/share/{listingId}
IMAGEM SOCIAL: /api/v1/share/{listingId}/image.png
DESTINO HUMANO: /bazaar/anuncio/{listingId}
```

Validações executadas:

- [x] título, descrição, vendedor e preço obtidos do PostgreSQL;
- [x] Open Graph e Twitter Card presentes;
- [x] imagem PNG 1200 × 630 gerada pelo Java;
- [x] URL canônica apontando para a rota React limpa;
- [x] anúncio inexistente respondendo 404;
- [x] endpoint público para crawlers sem autenticação;
- [x] origem pública configurada por `APP_PUBLIC_BASE_URL`;
- [x] cabeçalho `Host` não influencia os links gerados;
- [x] Web Share e cópia usam o novo link Spring;
- [x] Docker entregando HTML e PNG pelo proxy Nginx.

Os endpoints Node `/api/bazaar/share` e `/api/bazaar/og` permanecem apenas para
compatibilidade do deploy legado até a etapa final de limpeza.

## 21. Registro da etapa de armazenamento S3/MinIO

```text
ETAPA: Migração de uploads para object storage
STATUS: CONCLUÍDA
UPLOAD: POST /api/v1/media
LEITURA: GET /media/{publicId}
OBJETOS: bucket privado vpertz-media
METADADOS: tabela media_assets
```

Validações executadas:

- [x] upload exige autenticação;
- [x] formato real validado por magic bytes;
- [x] limite de 2,5 MB preservado;
- [x] objeto gravado no MinIO por chave não previsível;
- [x] bucket criado automaticamente e mantido privado;
- [x] autor, tamanho, MIME type, nome original e SHA-256 no PostgreSQL;
- [x] rollback remove o objeto quando a persistência falha;
- [x] leitura pública usa URL estável sem expor credenciais S3;
- [x] resposta inclui cache imutável e ETag baseado no SHA-256;
- [x] fallback local selecionável por `STORAGE_TYPE=local`;
- [x] migration Flyway V7 aplicada;
- [x] persistência confirmada no volume `miniodata`;
- [x] Docker saudável com frontend, backend, PostgreSQL e MinIO.

O volume local `mediadata` deixou de fazer parte do Compose. Os endpoints Node e
o Vercel Blob permanecem somente enquanto houver páginas legadas dependentes
deles.

## 22. Registro da etapa de administração e moderação

```text
ETAPA: Administração de denúncias e anúncios
STATUS: CONCLUÍDA
PAINEL: /admin
DENÚNCIAS: /api/v1/admin/reports
ANÚNCIOS: /api/v1/admin/listings
```

Validações executadas:

- [x] painel React protegido por `ROLE_ADMIN`;
- [x] usuário comum recebe 403 nos endpoints administrativos;
- [x] fila de denúncias filtrável por situação;
- [x] decisão resolvida/rejeitada com nota interna;
- [x] responsável e horário da decisão persistidos;
- [x] busca e filtro administrativo de anúncios;
- [x] status ativo, pausado, vendido e removido;
- [x] listagem pública ignora tentativas de `status=todos`;
- [x] anúncio pausado/removido não é visível ao visitante;
- [x] dono e administrador ainda podem abrir anúncio oculto para gestão;
- [x] migration Flyway V8 aplicada;
- [x] fluxo real React → Spring → PostgreSQL validado no Docker;
- [x] dados temporários da auditoria removidos.

## 23. Checklist de paridade por rota

Para cada migração:

- [ ] layout e assets equivalentes
- [ ] desktop e mobile
- [ ] loading, vazio e erro
- [ ] links e navegação
- [ ] filtros e formulários
- [ ] autenticação e autorização
- [ ] upload, quando aplicável
- [ ] console sem erros
- [ ] backend sem exceções
- [ ] testes unitários/integração
- [ ] build e rota Docker
- [ ] diferença deliberada documentada
- [ ] legado da rota fora do runtime

## 24. Critérios finais

- [ ] todas as páginas completas em React/TypeScript
- [ ] todas as rotas controladas pelo React Router
- [ ] nenhuma página servida de `apps/`
- [ ] nenhuma API Node ativa
- [ ] regras autoritativas no Spring
- [ ] persistência transacional no PostgreSQL
- [x] uploads no S3/MinIO
- [ ] Docker construindo apenas `frontend/` e `backend/`
- [ ] nenhuma cópia concorrente
- [ ] OCR aprovado em suíte representativa
- [ ] testes frontend, backend, integração e Docker aprovados
- [ ] persistência aprovada após reinício
- [ ] documentação e Git limpos

Até todos os itens serem verdadeiros, esta arquitetura permanece **em
migração**.

## 25. Páginas finais do Bazaar

As rotas `/bazaar/como-funciona` e `/bazaar/conta` são páginas React oficiais.
Os endereços históricos terminados em `.html` redirecionam permanentemente para
as rotas limpas e não servem mais os documentos físicos.

A conta é protegida pelo `ProtectedRoute`, reidrata a autenticação pelo JWT e
carrega o perfil por `GET /api/v1/profiles/me`. Esse endpoint extrai o `userId`
exclusivamente do principal autenticado. Atualizações continuam em
`PUT /api/v1/profiles/me`, persistidas no PostgreSQL.

Redefinição de senha e exclusão de conta não foram simuladas, pois não possuem
endpoint Spring. O Bazaar legado permanece no build até a revisão conjunta da
Store e do deploy Vercel. A migração geral continua em andamento.
