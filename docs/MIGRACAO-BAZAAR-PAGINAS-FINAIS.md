# Migração das páginas finais do Bazaar

Etapa aceita em 01/08/2026.

## Rotas

- `/bazaar/como-funciona`: React, pública.
- `/bazaar/conta`: React, protegida.
- `/bazaar/como-funciona.html`: redireciona permanentemente para a rota React.
- `/bazaar/conta.html`: redireciona permanentemente para a rota React.

## Conta e segurança

O frontend usa `GET /api/v1/profiles/me` e `PUT /api/v1/profiles/me`. Ambos
derivam a identidade do JWT no Spring; não recebem ID ou username do navegador.
Os dados editáveis são bio, contato, contato preferido e avatar. Nome e e-mail
são somente leitura e vêm da sessão autenticada.

Não foram simuladas redefinição de senha ou exclusão de conta: essas funções não
possuem endpoints Spring. Favoritos, anúncios, conversas, perfil público e logout
já vivem em fluxos React/Spring/PostgreSQL próprios.

## Legado

O Bazaar legado permanece no build como referência e ponte temporária. Nenhum
arquivo em `apps/` ou `api/` foi removido nesta etapa. A migração geral continua
em andamento e a próxima frente permanece a Store.

## Fechamento operacional

Em 01/08/2026, a imagem Docker foi reconstruída e as duas páginas foram
validadas pelo Nginx. Os redirecionamentos `.html` responderam 308, a conta
anônima convergiu para o login, o perfil autenticado persistiu após recriação do
backend e `/api/v1/config` continuou em HTTP 200 após dois reinícios isolados.
Desktop e mobile 390 × 844 foram inspecionados; a medição móvel confirmou
ausência de overflow horizontal. O Bazaar está funcionalmente 100% React, mas o
legado físico ainda não deve ser removido.
