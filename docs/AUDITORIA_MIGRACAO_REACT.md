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

Spring Boot → volume Docker mediadata
└── uploads locais
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
| Frontend ativo | **44%** | 11 de 25 rotas/fluxos de usuário auditados são React ativos |
| Cobertura React existente | **56%** | 14 de 25 já possuem página TSX, ativa ou desligada |
| Backend funcional | **67%** | 10 de 15 domínios necessários possuem API Spring utilizável |
| Persistência moderna | **71%** | 5 de 7 domínios persistentes principais possuem tabelas/repositórios PostgreSQL |
| Docker definitivo | **50%** | backend e Postgres definitivos; frontend ainda incorpora legado e storage ainda não é MinIO/S3 |
| OCR representativamente validado | **0%** | 2 imagens aprovadas, mas a suíte representativa exigida ainda não existe |

Há **16 rotas/fluxos legados ativos**: seis do Bazaar, três da Store e sete
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
| Store | `/store/jogos.html` | HTML/JS | inexistente | Node/config legado | JSON/Blob ou arquivo | legado | LEGACY_ACTIVE | migrar |
| Store | `/store/intermedio.html` | HTML/JS | inexistente | client-side | estático | legado | LEGACY_ACTIVE | migrar |
| Store | `/store/offline.html` | HTML | inexistente | nenhum | nenhum | legado | LEGACY_ACTIVE | reavaliar PWA |
| Admin | `/admin` | React protegido | `AdminPage` | Spring ADMIN | PostgreSQL | React | NEW_ACTIVE | completar gestão |
| Admin antigo | `/store/admin.html` | HTML/JS em `apps/` | `AdminPage` | APIs Node | JSON/Blob | não copiado no runtime atual | LEGACY_REFERENCE | remover após paridade |

### Bazaar

| Área | Rota | Implementação atual | Implementação nova | Backend | Persistência | Docker serve | Estado | Ação |
|---|---|---|---|---|---|---|---|---|
| Bazaar | `/bazaar/` | React | `MarketplacePage` | Spring listings | PostgreSQL; favoritos locais | React | PARTIAL | favoritos ainda precisam de API |
| Bazaar | `/bazaar/anuncio/:id` | React | `AnuncioPage` | Spring listings/chat/reports | PostgreSQL | React | NEW_ACTIVE | ampliar teste visual e autenticado |
| Bazaar antigo | `/bazaar/anuncio.html?id=` | HTML/JS | substituído pela rota limpa | Node Bazaar | `.data`/Blob | arquivo ainda presente | LEGACY_REFERENCE | retirar do runtime após paridade |
| Bazaar | `/bazaar/anunciar.html` | HTML/JS | `AnunciarPage` | Node + localStorage | localStorage | legado | NEW_INACTIVE | ativar com Spring |
| Bazaar | `/bazaar/meus-anuncios.html` | HTML/JS | `MeusAnunciosPage` | localStorage | localStorage | legado | NEW_INACTIVE | ativar com Spring |
| Bazaar | `/bazaar/perfil.html` | HTML/JS | `PerfilPage` | Node profile | JSON efêmero | legado | NEW_INACTIVE | ativar com Spring |
| Bazaar | `/bazaar/chat.html` | HTML/JS | `ChatPage` | Node chat | JSON efêmero | legado | NEW_INACTIVE | ativar com Spring |
| Bazaar | `/bazaar/conta.html` | HTML/JS | inexistente como página de conta | Node auth/profile | JSON efêmero | legado | LEGACY_ACTIVE | criar React |
| Bazaar | `/bazaar/login` | React | `LoginPage` | Spring auth | PostgreSQL | React | NEW_ACTIVE | manter |
| Bazaar | `/bazaar/cadastro` | React | `LoginPage` | Spring auth | PostgreSQL | React | NEW_ACTIVE | manter |
| Bazaar | `/login` | redirecionamento React | substituído por `/bazaar/login` | nenhum | nenhum | React | LEGACY_BRIDGE | remover após atualizar links externos |
| Bazaar | `/bazaar/como-funciona.html` | HTML | inexistente | nenhum | estático | legado | LEGACY_ACTIVE | converter para React |

O `App.tsx` mantém `BazaarRedirect` somente para caminhos limpos ainda não
migrados. Marketplace e detalhe são React. Anunciar e Como funciona
usam links `.html` explícitos classificados como `LEGACY_BRIDGE`, evitando
apresentar essas páginas como migradas.

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
| Anúncios | `/api/config` + arrays | `/api/v1/listings` | config/localStorage | `listings`, `listing_types` | NEW_INACTIVE no Bazaar | ativar frontend |
| Favoritos | localStorage | inexistente | localStorage | inexistente | LEGACY_ACTIVE | criar migration/API |
| Perfil | `/api/bazaar/profile` | `/api/v1/profiles` | JSON | `users` | NEW_INACTIVE | ativar página React |
| Conversas | `/api/bazaar/chat` | `/api/v1/conversations` | JSON | `conversations` | NEW_INACTIVE | ativar React |
| Mensagens/não lidas | `/api/bazaar/chat` | endpoints de conversa | JSON | `messages`, `message_reads` | NEW_INACTIVE | testes de autorização |
| Denúncias | `/api/bazaar/report` | `/api/v1/reports` | JSON | `reports` | NEW_INACTIVE | ativar modal React |
| Bloqueios | inexistente | inexistente | inexistente | inexistente | UNKNOWN | definir regra e implementar se necessária |
| Configuração | `/api/config`, `/api/admin/config` | `/api/v1/config`, `/api/v1/admin/config` | config.json/Blob | tabelas de config | NEW_ACTIVE | remover consumidor legado |
| Banners/contatos/taxonomia | config Node | config/admin Spring | config.json | tabelas próprias | PARTIAL | completar UI admin/testes |
| Uploads | `/api/admin/upload` | `/api/v1/media` | Blob/filesystem | somente URL nos consumidores | PARTIAL | implementar S3/MinIO e metadados |
| Open Graph | `/api/bazaar/og` | inexistente | render dinâmico Node | nenhum | LEGACY_ACTIVE | criar endpoint Spring |
| Compartilhamento | `/api/bazaar/share` | Web Share no React | Node redirect/HTML | nenhum | PARTIAL | definir SSR/OG |
| Administração de denúncias/anúncios | parcial no Node | config apenas | JSON | tabelas existem | PARTIAL | endpoints ADMIN |

As cinco migrations Flyway foram verificadas como aplicadas no container:
configuração, anúncios, usuários, vínculo do vendedor, chat e denúncias.
Favoritos, metadados de mídia e eventuais bloqueios ainda não possuem schema.

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

- Remover `apps/` agora quebra 16 rotas/fluxos.
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
4. Ativar `/bazaar/anunciar` e `/bazaar/meus-anuncios`.
5. Ativar perfil, chat e denúncias; ampliar testes de autorização.
6. Implementar favoritos no Spring/PostgreSQL.
7. Implementar Open Graph/compartilhamento no Spring.
8. Adicionar S3StorageService/MinIO e migration de metadados.
9. Completar administração.
10. Migrar VPLab na ordem: Avaliar IV no shell, PokeFipe, Pokédex, Rotas,
    Breeding, Clãs e Profissões.
11. Migrar Store Jogos/Intermédio e eliminar HTML restante.
12. Retirar `static-build`, `apps/`, APIs Node e cópias de `frontend/public`.

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

## 16. Checklist de paridade por rota

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

## 17. Critérios finais

- [ ] todas as páginas completas em React/TypeScript
- [ ] todas as rotas controladas pelo React Router
- [ ] nenhuma página servida de `apps/`
- [ ] nenhuma API Node ativa
- [ ] regras autoritativas no Spring
- [ ] persistência transacional no PostgreSQL
- [ ] uploads no S3/MinIO
- [ ] Docker construindo apenas `frontend/` e `backend/`
- [ ] nenhuma cópia concorrente
- [ ] OCR aprovado em suíte representativa
- [ ] testes frontend, backend, integração e Docker aprovados
- [ ] persistência aprovada após reinício
- [ ] documentação e Git limpos

Até todos os itens serem verdadeiros, esta arquitetura permanece **em
migração**.
