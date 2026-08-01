# Matriz de assets legados

Hashes são SHA-256. Arquivos dentro de um grupo possuem o mesmo destino e ação;
o inventário de hashes individual é mantido abaixo para rastreabilidade.

| Grupo | Consumidor React | URL antiga | Destino novo | Arquivos | Bytes | Ação |
|---|---|---|---|---:|---:|---|
| Breeding | `BreedingPage` | `/vplab/legacy/assets/breeding/*` | `/assets/vplab/breeding/*` | 8 | 905.338 | `MOVE_TO_REACT_ASSETS` |
| Clãs | `ClanPage` | `/vplab/legacy/assets/clans/*-symbol.png` | `/assets/vplab/clans/*` | 21 | 922.932 | `MOVE_TO_REACT_ASSETS` |
| Rota | `HuntRoutePage` | `/vplab/legacy/assets/route/*` | `/assets/vplab/route/*` | 21 | 3.606.576 | `MOVE_TO_REACT_ASSETS` |
| Profissões | `ProfessionsPage` | `/vplab/legacy/assets/professions/official/*` | `/assets/vplab/professions/official/*` | 25 | 1.894.924 | `MOVE_TO_REACT_ASSETS` |
| Dados VPLab | páginas React de VPLab | `/vplab-data/*` | inalterado | 2 | 624.128 | `KEEP_AS_DATA` |
| PaddleOCR | `IvScannerPage` | `/ocr-models/*` | inalterado | 2 | 6.318.080 | `KEEP_AS_OCR_MODEL` |
| Tesseract + idiomas | nenhum React | `/vplab/vendor/*` | nenhum | 8 | 21.882.395 | `REMOVE_DUPLICATE` |
| shell/JS/CSS VPLab | nenhum React | `/vplab/*` | nenhum | 14 | 548.825 | `REMOVE_DUPLICATE` |
| assets VPLab não referenciados | nenhum React | `/vplab/assets/*` | nenhum | demais | — | `REMOVE_DUPLICATE` |
| assets globais | Store/Bazaar/Hub React | `/assets/*` | inalterado | 74 | 7.267.694 | `KEEP_TEMPORARILY` |

Os três duplicados byte a byte `background-vp-store.webp`,
`diamante-pokeidle.webp` e `favicon.png` permanecem somente na origem global;
as cópias sob `vplab/assets` serão removidas.

## Tesseract

O shell antigo carregava `iv-scan.js`, que usava Tesseract. Nenhum componente
React importa Tesseract; o scanner oficial importa PaddleOCR e lê apenas os dois
arquivos em `/ocr-models`. A cópia pública contém 21.882.395 bytes de Tesseract,
workers, core e idiomas e pode ser integralmente excluída.

