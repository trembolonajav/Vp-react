# Homologação do PaddleOCR

## Escopo

- Data: 2026-08-01.
- Runtime: imagem Docker oficial, React/Vite + PaddleOCR PP-OCRv6.
- Origem: `C:\Users\gabri\Downloads\homologacao`.
- Amostra: 46 imagens PNG; as 20 capturas de 2026-07-31 possuem gabarito visual previamente fornecido.
- A lógica do OCR não foi alterada nesta execução.

## Resultado operacional — 46 imagens

| Métrica | Resultado |
|---|---:|
| Concluídas sem timeout | 46/46 (100%) |
| Conjunto completo informado pelo scanner | 36/46 (78,26%) |
| Com pelo menos um campo ausente | 10/46 (21,74%) |
| Campos reconhecidos, média | 9,74/10 |
| Tempo OCR médio com modelo aquecido | 536,3 ms |
| Melhor tempo | 326 ms |
| Pior tempo | 1.026 ms |
| Confiança média declarada | 95,6% |
| Menor confiança declarada | 88% |
| Maior confiança declarada | 99% |

O tempo externo de cada invocação ficou aproximadamente entre 0,6 s e 1,7 s.
A primeira carga fria do bundle/modelo não foi isolada nesta rodada e deve ser
medida separadamente com cache e perfil do navegador limpos.

## Precisão com gabarito — 20 imagens de 2026-07-31

Foram comparados 11 valores visíveis por card: espécie, nível, multiplicador de
qualidade, IV, poder e os seis atributos.

| Campo | Corretos | Precisão |
|---|---:|---:|
| Espécie | 19/20 | 95% |
| Nível | 20/20 | 100% |
| Multiplicador | 20/20 | 100% |
| IV | 20/20 | 100% |
| Poder | 19/20 | 95% |
| HP | 20/20 | 100% |
| Ataque | 20/20 | 100% |
| Defesa | 20/20 | 100% |
| Ataque Especial | 20/20 | 100% |
| Defesa Especial | 20/20 | 100% |
| Velocidade | 18/20 | 90% |
| **Total** | **216/220** | **98,18%** |

### Divergências encontradas

- `Captura de tela 2026-07-31 140010.png`: Velocidade `0` ficou vazia.
- `Captura de tela 2026-07-31 140104.png`: Poder `12` ficou vazio.
- `Captura de tela 2026-07-31 140109.png`: `Gyarados` foi lido como `ehdaria`.
- `Captura de tela 2026-07-31 140343.png`: Velocidade `0` ficou vazia.

A confiança declarada permaneceu alta em parte dessas falhas. Portanto ela não
deve, sozinha, autorizar preenchimento silencioso sem revisão do usuário.

## Achado de infraestrutura

Durante a primeira execução, `/vplab/avaliar-iv` era redirecionada para `/` pelo
fallback do Nginx. Foi adicionada uma localização explícita que serve o
`index.html` da SPA. Após a correção, a rota respondeu HTTP 200 e a suíte pôde
ser executada. Nenhuma regra de OCR, cálculo ou layout foi modificada.

## Decisão

```text
MIGRAÇÃO PARA PADDLEOCR: CONCLUÍDA
EXECUÇÃO NAS 46 IMAGENS: CONCLUÍDA
PRECISÃO DO GABARITO DE 20 IMAGENS: 98,18%
HOMOLOGAÇÃO FUNCIONAL: APROVADA COM RESSALVAS
HOMOLOGAÇÃO PARA PRODUÇÃO: PENDENTE
```

Antes da aprovação definitiva ainda faltam: primeira carga com cache limpo,
execução móvel real, pico de memória, imagens deliberadamente comprimidas/ruins
e validação do fluxo de correção manual. Os 26 arquivos sem gabarito explícito
foram usados na estabilidade e desempenho, mas não entram no percentual de
precisão para evitar atribuir uma verdade esperada por inferência.
