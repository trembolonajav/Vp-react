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
## Manifesto SHA-256 dos assets VPLab preservados

Inventário individual após a transferência byte a byte para propriedade do React.

| Asset | Bytes | SHA-256 |
|---|---:|---|
| `frontend/public/assets/vplab/breeding/analise-dos-pais.webp` | 62524 | `4b76a691f9ea86754dc05ed16ecc91f2a53a1daac257fd447278054fb4360da8` |
| `frontend/public/assets/vplab/breeding/centro-breeding.webp` | 83750 | `b45532b84bb7b890e427b3fd283f5789ee4aa16e15f717119cd69b830f6f4b1c` |
| `frontend/public/assets/vplab/breeding/incubadora.webp` | 8050 | `39ce48a23513df99b011900e4fcfb7b0884c1927728390ed95c07c61aebd74a4` |
| `frontend/public/assets/vplab/breeding/melhoria-iv.webp` | 27936 | `7ae078e8c13621cc35be84e1eff46b7a6b02781f95e494cf29c5ab4098125ae0` |
| `frontend/public/assets/vplab/breeding/official/dna.webp` | 587266 | `f587ad5622059c214ffb0ec1cf93a6ea85e85ae59074176446537cd26e495df1` |
| `frontend/public/assets/vplab/breeding/official/egg.png` | 66346 | `c6d65606968285d2dec727591316fc5fcbddbf606a3417ed11932eacf9b3c967` |
| `frontend/public/assets/vplab/breeding/rota-feromonio.webp` | 35606 | `ea66dc6c2d03ea2446494a97ca2303abb9c3780c724e191b818632e0cf389c6e` |
| `frontend/public/assets/vplab/breeding/rota-gratis.webp` | 33860 | `a398ee218369253c7137c37d48ccce63430783145eaafdd082d56991f97cdb5d` |
| `frontend/public/assets/vplab/clans/clan-frame-transparent.webp` | 45118 | `69168c6ca7fa3313ee4ebd5dd55bb456fb5874a85061685be5b6a229c22c7058` |
| `frontend/public/assets/vplab/clans/gardestrike.png` | 29620 | `56c3a6e48d49d6ae8873ed1a8ebaa41debb3938e59f803dba73080420785e32e` |
| `frontend/public/assets/vplab/clans/gardestrike-symbol.png` | 54992 | `6c6e91b7a9203041f51c7b7818301ff31b11e9cd221c5368e7afc142fc7a27ae` |
| `frontend/public/assets/vplab/clans/ironhard.png` | 31496 | `6e183bbe3767b7dc8b0b6c8e1278a37a178f6b32aa5ef32f1f6a056b8c6ff9e1` |
| `frontend/public/assets/vplab/clans/ironhard-symbol.png` | 47630 | `f7a614e5b46aadbfcb30ef026c074acff267e1367af01facefd285aaacaf44b5` |
| `frontend/public/assets/vplab/clans/malefic.png` | 31263 | `faa1b17453d223483966b9eafcb87e2848f32c4004da220c7683a668aae78e77` |
| `frontend/public/assets/vplab/clans/malefic-symbol.png` | 57397 | `377142de02c6ab80606959cec13d6368e579d200d1d3d325b154f3214544ec01` |
| `frontend/public/assets/vplab/clans/naturia.png` | 33857 | `c4e7e39048ce5ffe6abf2be0145cb43ab76e31f34bb5ae595ee12b31bc77ec4c` |
| `frontend/public/assets/vplab/clans/naturia-symbol.png` | 81001 | `9270da4687235482f84d5e6602081cbce769b9418c5a14518f33c4066badb9ff` |
| `frontend/public/assets/vplab/clans/orebound.png` | 32280 | `8bf21772be194289046a800be7448b02d912c15ab8fd7a9a62ba8e406199d63a` |
| `frontend/public/assets/vplab/clans/orebound-symbol.png` | 43474 | `7495394f7fd656ec0b61d36bbaa9f09cbed3c645cbbc375c79aaff6e26c4aa5b` |
| `frontend/public/assets/vplab/clans/psycraft.png` | 33494 | `8bbf061fdde56ee2d9266ed48892461954abf9918a663d91e7b3fd1b47a8e71e` |
| `frontend/public/assets/vplab/clans/psycraft-symbol.png` | 71937 | `9aef0557fad50e8925a8feb6ed86e489bd49b507e2117a74a2fb54f4f819ec73` |
| `frontend/public/assets/vplab/clans/raibolt.png` | 30886 | `4189895a046add97ef8bb946c83b99bc846210ddad672cdaa796d4f018077105` |
| `frontend/public/assets/vplab/clans/raibolt-symbol.png` | 37695 | `5813d91147400eec1c5828ca3a85672f9e93f22997b9d8644e513d42ae94a277` |
| `frontend/public/assets/vplab/clans/seavell.png` | 30586 | `c78441ca7fbe916390499da22a73be9c3035bafd433f806e795d7618203c88c9` |
| `frontend/public/assets/vplab/clans/seavell-symbol.png` | 59125 | `a1a64d7521a54b20b0bbc65fd41f32d5e3d5a4384399727c1c431208a6f62bdb` |
| `frontend/public/assets/vplab/clans/volcanic.png` | 30998 | `1f1907104571fd71612abac5d998a5675d1b9ffb55a1d8664611590fd0cfe6cd` |
| `frontend/public/assets/vplab/clans/volcanic-symbol.png` | 60319 | `0e07ee96497f0752a60d019fb89a9b2201327b837b23db76febe21dab3a1d679` |
| `frontend/public/assets/vplab/clans/wingeon.png` | 32149 | `ea38ecf0120b6091c98691f6625ebb915a608c6ade3447b35197f1431ebae785` |
| `frontend/public/assets/vplab/clans/wingeon-symbol.png` | 47615 | `f926ced5f70edbee1f3d5db99633a4da7c68088a5bdb4c27c7eabf4a4c0d26a9` |
| `frontend/public/assets/vplab/professions/botanist.svg` | 371 | `bc14b114d4e9ff6b7118265b1089963ffc9f4dc02057ab32961fe7bbd22f78fc` |
| `frontend/public/assets/vplab/professions/capture-bonus.svg` | 360 | `eba4ecee3b7a3fa56fa4dc936d19ab65256bc61a22e317f34e25e55b57c56946` |
| `frontend/public/assets/vplab/professions/official/header_prestige.png` | 1860137 | `70e30d30dd1667994d69086cde095aac1d9ec2161532564d46874775fa7d1f79` |
| `frontend/public/assets/vplab/professions/official/icon_botanist.png` | 812 | `f61f3a659eba0bdcd3ee994cf6ceed74c929a6e1f703aee68e621b468e896fc9` |
| `frontend/public/assets/vplab/professions/official/icon_prestige.png` | 476 | `9e313a5b2c110eee2e8a49bcc592d2f875bd36e2d2896c9d7a7dadfd3ff4d006` |
| `frontend/public/assets/vplab/professions/official/icon_researcher.png` | 605 | `11d90789c2eafb6606dda564237dc6192f3d32e2757a10a81c030d662adf62de` |
| `frontend/public/assets/vplab/professions/official/icon_scientist.png` | 5276 | `dfda7f06bbbff60e0cf558bd07ba5dc7556b71a2db01786cb9e07a55508d34ff` |
| `frontend/public/assets/vplab/professions/official/rank_ball.png` | 840 | `f5e9e750a08245b2d083fbf22f2318ed6e9e5e444b46d211995d40197e198316` |
| `frontend/public/assets/vplab/professions/official/rare_pokemon_picture.png` | 10988 | `256ebb9348323fffab4527fc4acf1d2ac887c046d7aa4e6d49befb84643a0d69` |
| `frontend/public/assets/vplab/professions/official/species_icon.png` | 1547 | `25d4c6ef8c300e745d3616e5536ab261a3036577c0e3e03aa51924e9cc4bb0b2` |
| `frontend/public/assets/vplab/professions/official/talent_electric.png` | 1090 | `9ba8499c1156656a37c4ccd594d605c475cb14ef8e21cdb5d07e8f9e31f54a0e` |
| `frontend/public/assets/vplab/professions/official/talent_fighting.png` | 1157 | `a54a12136331220c60b1480fa6fe8dade8feada8896402619d2679e15f32eb05` |
| `frontend/public/assets/vplab/professions/official/talent_fire.png` | 1185 | `3578577d5d47b8b1498a1e9e1e7046c1268ebb0747044cfe734a587af86673c2` |
| `frontend/public/assets/vplab/professions/official/talent_flying.png` | 1031 | `f55559d35da364590618187db1fac0b28c0471575e45197ba39880ee5d04454d` |
| `frontend/public/assets/vplab/professions/official/talent_ghost.png` | 1061 | `671ea6c9853b7858823307858e4b35ede906f1dc8eec7e7fc7697566caf896bb` |
| `frontend/public/assets/vplab/professions/official/talent_grass.png` | 1188 | `5a02b7994fd891dc74e65026f85ef78ef5a9596eec6dd484c9cc20849f685e60` |
| `frontend/public/assets/vplab/professions/official/talent_ground.png` | 1415 | `532c55f761036dbc4fb54c67fe974b9a9baf3e68d2ec6193d88b3fa6eb27459b` |
| `frontend/public/assets/vplab/professions/official/talent_psychic.png` | 1071 | `59a0ab22b7d81a115650aa44c8b161ecbd31f098cb3f20ace17f6c8acb49ee3f` |
| `frontend/public/assets/vplab/professions/official/talent_steel.png` | 988 | `6af2940951dfe4cadd4ae171ec10b2f372b329163fe7c7f3034e0fbc97558edc` |
| `frontend/public/assets/vplab/professions/official/talent_water.png` | 1206 | `4427b24d799e30f8392ae3eb9dcac7e97668b59de03354d822e2332ba2f1fa32` |
| `frontend/public/assets/vplab/professions/pokemon-researcher.svg` | 458 | `56531f5e5d8d46e97fa410e7a1b15e22a54ceaa002a553100bb77d0f1a8320a7` |
| `frontend/public/assets/vplab/professions/prestige-trainer.svg` | 374 | `0140084d839ce6a04892c74a62e1a2b98cd48a6170471bcd6299fa6634dc21f7` |
| `frontend/public/assets/vplab/professions/scientist.svg` | 405 | `ebf1a3571289fcec39d398f29d0f79478a2b32c0654c6ff47fca1ffd4ab418a6` |
| `frontend/public/assets/vplab/professions/shiny-photo.svg` | 451 | `01c6fbaead6b65b5e856b0a7af77f056ca5dc970269f5d473eefd4c551c9bad3` |
| `frontend/public/assets/vplab/professions/talent-tree.svg` | 432 | `fb0ff23d5787d6347869c7e69e38a3dcc71f0a40fd53829da78315f542b84adf` |
| `frontend/public/assets/vplab/route/hunt-card-frame.png` | 1267622 | `c86941d4e0d707074a682118e0527315a0b62f2f8e153d402ea24184782913d6` |
| `frontend/public/assets/vplab/route/positive-panel.png` | 804662 | `ba3921918724e9fce4a9a0a2a22590ed999a2ca1dea44c846592a2f3a4a46e38` |
| `frontend/public/assets/vplab/route/types/bug.png` | 43831 | `c1ac4114d8e70eb1c00b12ba5c1f60877be9ee3d6f22487a6f7f42d5e8a0e22c` |
| `frontend/public/assets/vplab/route/types/dark.png` | 46675 | `2473bae211957f081f78e706b19b7b4ae44751539dfc1b0b193eea74b363eb5b` |
| `frontend/public/assets/vplab/route/types/dragon.png` | 47983 | `0f748c15b5a4ac1cd3aa78374e9420b45b97d62783432ba60d9e5106cb37cac3` |
| `frontend/public/assets/vplab/route/types/electric.png` | 28685 | `e2b036068ab77800d28189c7d4730f5d78bf610a2922f365bd03d306b436559a` |
| `frontend/public/assets/vplab/route/types/fairy.png` | 37676 | `6a76feeff1fc8d27f23cc9bd0bdb66001ef57a954a0d98e10252adebc1c6988f` |
| `frontend/public/assets/vplab/route/types/fighting.png` | 44337 | `d0045980553934040407e4d6785d73f5f99aee2d17dc907fa5d34c12e7b9a069` |
| `frontend/public/assets/vplab/route/types/fire.png` | 48289 | `afb9b09368c4ff9df2d1c9e7211acd85dc77dc94f1915aaf8c3cbfb3ca52a9d8` |
| `frontend/public/assets/vplab/route/types/flying.png` | 42032 | `b2701e9c43f4fea0011b4500ed3d88b17df3b3973bd8fb89a4acf517b8de5330` |
| `frontend/public/assets/vplab/route/types/ghost.png` | 52657 | `6b0053ba410d81c667a526261063bf56fb46ffc53f560b594caa99400b3130b2` |
| `frontend/public/assets/vplab/route/types/grass.png` | 50220 | `b422fcc95673947afb27a952e8226c79dd5088e00b8d9e0026872b2be65e11e4` |
| `frontend/public/assets/vplab/route/types/ground.png` | 39686 | `979959f3adc064d3bcd255c915f94549b86539c19bebecffdfd68182b3717cfc` |
| `frontend/public/assets/vplab/route/types/ice.png` | 60576 | `71957c866a18b48154d59063e3c43bcabffa8cd78eee01c41e587af119c35c50` |
| `frontend/public/assets/vplab/route/types/normal.png` | 49662 | `c7dcdd06518c752015a2a8ccf4a38f676885d958d0c92c7fb1c718e07776c6a2` |
| `frontend/public/assets/vplab/route/types/poison.png` | 60099 | `f223f20632c33fab37dcb0502e40f402ea01067e813d5eb42b3eee8fec722bd7` |
| `frontend/public/assets/vplab/route/types/psychic.png` | 53397 | `6855657438d4fdb2aad8dcf2fe6b3f8ba545c89fc37adfdc00e64a55a5274d1d` |
| `frontend/public/assets/vplab/route/types/rock.png` | 52200 | `a40e45fa135da0d3501f52926ab1707cfdb0e5101025c0e9024c8d5870dfd266` |
| `frontend/public/assets/vplab/route/types/steel.png` | 51851 | `6cd4672e0205367b3164442824bb7174d4f8c4bfd485142ad4b4ebab615400f5` |
| `frontend/public/assets/vplab/route/types/water.png` | 46502 | `267bbf1b5cd53c458200626e9b460ddfb6147f2fe3e2f9952f611e25ee7cd378` |
| `frontend/public/assets/vplab/route/warning-panel.png` | 677934 | `97a93250635f11cea4342ea9ca76f2abd7b05be9255a4d6508fa6df30c8c1feb` |

