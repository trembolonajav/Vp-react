# Auditoria final de código órfão e organização

## Escopo

Auditoria posterior ao marco arquitetural `17717ae` e à homologação inicial do
OCR `57d34c4`. O objetivo foi procurar excedentes dentro da nova stack sem
remover arquivos descobertos por convenção ou reflexão.

## Resultado

```text
LEGADO NO RUNTIME: NÃO
TESSERACT ATIVO: NÃO
CÓDIGO TYPESCRIPT SEM USO DETECTADO PELO COMPILADOR: NÃO
DEPENDÊNCIA NPM EXCEDENTE COMPROVADA: NÃO
CLASSE SPRING ÓRFÃ COMPROVADA: NÃO
ASSET DUPLICADO BYTE A BYTE: REMOVIDO
ASSETS SEM CONSUMIDOR COMPROVADO: REMOVIDOS
UTILITÁRIO ISOLADO SEM CONSUMIDOR: REMOVIDO
BUILD ESTÁTICO ANTIGO NO DISCO: REMOVIDO
```

## Remoções comprovadas

- `chrome_game_capture.py`: utilitário de captura isolado, sem referência em
  scripts, testes, documentação, frontend, backend ou Docker.
- `frontend/public/assets/bazaar/anuncio-diamond.png`: cópia SHA-256 idêntica a
  `diamante-pokeidle-oficial.png`; o único consumidor passou a usar `DIAMANTE`.
- `frontend/public/assets/logo-pokeidle-world.png`: sem referência em código,
  configuração, CSS, testes ou HTML.
- `frontend/public/assets/pix-oficial.png`: sem consumidor; a classe CSS órfã
  `.bz-pix-official` também foi removida.
- `dist/` na raiz: saída ignorada pelo Git com 285 arquivos e 41.934.895 bytes
  da composição estática antiga. Era regenerável e não participava do Docker.

## Itens preservados intencionalmente

- `design-sources/`: fontes originais de design, fora do runtime.
- `data/clan-ranking/ranking_pokeidle_por_cla.xlsx`: entrada do script ativo
  `generate-clan-ranking.mjs`.
- Controllers, configurações, seeders e implementações de storage Spring:
  descobertos por annotations, component scan, profiles e injeção; contagem de
  referências textuais não é prova segura de orfandade.
- Dependências `starter` e de runtime no Maven: `dependency:analyze` não resolve
  corretamente agregadores Spring, autoconfiguração e drivers carregados em
  runtime; build, testes e inicialização confirmam seus consumidores.
- `index.html`, CSS, bundles JS, WASM e modelos ONNX: artefatos normais da stack
  React/PaddleOCR, não aplicações legadas paralelas.

## Dados locais ignorados

`.data/` contém `bazaar-accounts.json`, `config.json` e logs do servidor antigo.
Não entra no Git, Docker ou build atual. Foi preservado porque contém dados
locais possivelmente relevantes e não é recuperável pela branch de backup.
Pode ser arquivado ou descartado depois de autorização explícita; sua presença
não caracteriza dependência operacional.

## Evidências

- Busca ativa por Tesseract, `iv-scan`, `apps/`, API Vercel e build Node: apenas
  asserts negativos em testes; nenhuma dependência em código/runtime.
- TypeScript usa `strict`, `noUnusedLocals` e `noUnusedParameters`; build aprovado.
- Todos os módulos frontend possuem consumidor no grafo de nomes/importações.
- Hashes de `frontend/public`: nenhuma duplicata restante.
- Testes Node: 48/48.
- Testes Maven: 53/53.
- Build React/Vite: aprovado.

## Conclusão

A árvore versionada está coerente com React/Vite, Spring Boot, PostgreSQL,
MinIO/S3 e PaddleOCR. Não restou órfão removível com prova segura nesta rodada.
Documentação histórica e insumos de geração não são código operacional.
