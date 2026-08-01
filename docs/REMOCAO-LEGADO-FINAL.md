# Auditoria e remoção reversível do legado

## Resultado

```text
ETAPA: Auditoria e remoção do legado
STATUS: CONCLUÍDA
HEAD INICIAL: 9591ac55583f23de608c619fe4050099ec01d73d
BRANCH DE BACKUP: backup/pre-remocao-legado

DOCKER COPIA APPS: NÃO
DOCKER EXECUTA BUILD LEGADO: NÃO
HTMLS LEGADOS NA IMAGEM: NÃO
TESSERACT NA IMAGEM: NÃO
VPLAB LEGADO: REMOVIDO
BAZAAR LEGADO: REMOVIDO
STORE LEGADO: REMOVIDO
HUB LEGADO: REMOVIDO

ASSETS MOVIDOS: 75 arquivos VPLab, 7.329.770 bytes
ASSETS PRESERVADOS: 153 arquivos públicos, 21.539.672 bytes
ASSETS REMOVIDOS: duplicatas e arquivos exclusivos dos runtimes aposentados
APIS NODE REMOVIDAS: 17 arquivos/endpoints e bibliotecas auxiliares
APIS NODE PRESERVADAS: 0
DEPLOY VERCEL: arquitetura independente aposentada; Docker é o deploy oficial

TESTES NODE: 47/47
TESTES MAVEN: 53/53
BUILD REACT: APROVADO (TypeScript + Vite, 112 módulos)
BUILD DOCKER: APROVADO SEM CACHE
SMOKE TEST: APROVADO
PARIDADE MOBILE: preservada; nenhuma alteração de layout nesta etapa
PERSISTÊNCIA POSTGRESQL: APROVADA após reinício (6 usuários, 18 anúncios)
PERSISTÊNCIA MINIO: APROVADA após rebuild/reinício (2 objetos, HTTP 200)

MIGRAÇÃO GERAL: React + Spring + PostgreSQL + MinIO/S3
LEGADO REMOVIDO: SIM
PENDÊNCIAS: nenhuma relativa ao runtime legado
PRÓXIMA ETAPA: otimização de bundle e observabilidade, fora do escopo desta limpeza
```

## Commits da etapa

- `5aa0a53` — auditoria inicial e matrizes.
- `fd330a8` — propriedade React dos assets ativos.
- `977a3ad` — Docker somente Vite.
- `6da8bae` — páginas VPLab e Tesseract.
- `2065719` — fonte da aplicação VPLab.
- `4e2119d` — aplicação Bazaar estática.
- `152a603` — aplicação Store estática.
- `a737020` — aplicação Hub estática.
- `b2964a9` — API Node/Vercel, build e tooling antigos.

## Provas do artefato final

- `docker compose build --no-cache`: aprovado.
- Serviços saudáveis: Spring, PostgreSQL e MinIO; frontend Nginx ativo.
- Imagem frontend: 169 arquivos; somente `index.html` da SPA e `50x.html` do Nginx.
- Ausentes da imagem: `app.js`, `bazaar.js`, `iv-scan.js`, `clan-ui.js`,
  `professions-ui.js`, Tesseract, workers Tesseract e `/vplab/legacy`.
- Rotas oficiais React e APIs `config`/`listings`: HTTP 200 (redirecionamentos
  canônicos de `/`, `/admin` e detalhe conforme configuração de rotas).
- Dezesseis URLs históricas verificadas: HTTP 308 para suas rotas React.
- PostgreSQL manteve contagens antes e depois do reinício isolado do backend.
- Os dois objetos registrados em `media_assets` foram lidos via `/media/*`, 67
  bytes, `image/png`, HTTP 200 após o rebuild.

As ocorrências restantes de termos legados estão restritas a documentos
históricos, asserts negativos de regressão e uma medição que confirma a ausência
de `bazaar.js`; nenhuma é dependência de build ou runtime.
