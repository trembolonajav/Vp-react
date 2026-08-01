# Migração final das rotas da Store

Etapa implementada em 01/08/2026, a partir do HEAD `b0cf836`.

## Auditoria de rotas

| Rota | HTML legado | Componente React | React Router | Nginx/Docker | Funcionalidade equivalente | Estado |
|---|---|---|---|---|---|---|
| `/store/` | `index.html` preservado | `StoreHomePage` | ativa | SPA priorizada | catálogo e links de negociação | `REACT_ACTIVE` |
| `/store/intermedio` | `intermedio.html` preservado | `IntermedioPage` | ativa | SPA priorizada | conteúdo, segurança e WhatsApp oficial | `REACT_ACTIVE` |
| `/store/jogos` | `jogos.html` preservado | `StoreHomePage` | ativa | SPA priorizada | catálogo foi incorporado à home e usa a mesma configuração | `REACT_ACTIVE` |
| `/store/offline` | `offline.html` preservado | `OfflinePage` | ativa | SPA priorizada | aviso, marca e retorno à Store | `REACT_ACTIVE` |
| `/store/admin` | o legado real era `/admin.html` | redireciona para `AdminPage` | ativa | 308 para `/admin` | painel React/Spring/PostgreSQL protegido | `REACT_ACTIVE` |

`/store/intermedio` não estava faltando: foi migrada no commit `33f05bf`. A
lacuna era apenas a auditoria histórica ainda desatualizada. `/store/jogos` usa
deliberadamente `StoreHomePage`, pois o catálogo completo já havia sido
incorporado à home; não há duas implementações divergentes.

## Compatibilidade

- `/store/jogos.html` → `308 /store/jogos`
- `/store/intermedio.html` → `308 /store/intermedio`
- `/store/offline.html` → `308 /store/offline`
- `/store/admin` e `/store/admin.html` → `308 /admin`

Os arquivos históricos continuam no build temporário, mas não vencem as rotas
oficiais. Nenhum HTML antigo foi incorporado ao React.

## Dados e falhas

O catálogo carrega `/api/v1/config` pelo Spring; a configuração oficial é
persistida no PostgreSQL. A tela agora apresenta estados explícitos de loading e
falha da API, sem recorrer a JSON ou `localStorage` como fonte oficial.

## Legado

`apps/`, `api/`, `scripts/build.mjs`, `/vplab/legacy/` e o build estático foram
preservados. Sua retirada continua reservada para uma etapa isolada e
reversível.

## Validação operacional

- build Docker reconstruído sem cache no HEAD da etapa;
- rotas limpas servidas pelo Nginx e URLs `.html` respondendo 308;
- `/api/v1/config` permaneceu em HTTP 200 após dois reinícios isolados e após a
  recriação do backend, sem reiniciar o frontend;
- perfil autenticado atualizado e relido após recriar o backend, confirmando a
  persistência no PostgreSQL;
- token inválido responde 401 e um 401 autenticado encerra o estado da sessão
  no React;
- escrita por `/profiles/{username}` é negada com 403; somente `/profiles/me`
  aceita atualização;
- desktop inspecionado por captura headless e mobile emulado em 390 × 844 sem
  overflow (`scrollWidth === clientWidth === 390`) nas páginas auditadas;
- logs de frontend/backend sem `ERROR`, `Exception` ou 502 inesperado no ciclo.

O Bazaar está funcionalmente 100% React nas rotas oficiais auditadas. Isso não
autoriza remover seus arquivos históricos: o legado físico permanece publicado
como ponte temporária.
