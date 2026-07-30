# Migração do VPLab — Avaliar IV

## Estado desta etapa

- `/vplab/` e `/vplab/avaliar-iv` são rotas React oficiais.
- O OCR oficial é PaddleOCR PP-OCRv6, executado localmente no navegador.
- Upload por seletor, arrastar e soltar e colar com `Ctrl + V` usam o mesmo pipeline.
- O avaliador reconhece card completo e tooltip compacto do inventário.
- A análise calcula os seis IVs, total provável, intervalo, confiança, potencial e confere o poder.
- As demais ferramentas permanecem temporariamente em `/vplab/legacy/`.
- A comparação entre dois Pokémon continua pendente e será portada em uma etapa própria.

## Auditoria com as imagens de referência

| Layout | Campos | Confiança OCR | Resultado |
| --- | ---: | ---: | --- |
| Card completo | 9 | 99% | espécie, nível, qualidade, poder e 6 atributos corretos |
| Tooltip do inventário | 10 | 89% | mesmos campos e IV `140/192` corretos |

O card completo não contém IV total visível; nesse layout o valor é calculado pelos
seis atributos. Nos dois prints do Gyarados o resultado calculado foi `140/192`.

## Próximas migrações

Pokédex, PokeFipe, Rota de caça, Breeding, Clãs e Profissões ainda dependem da
ponte estática. Cada ferramenta deve ser convertida para `frontend/src/features/vplab`
e validada antes da remoção correspondente em `/vplab/legacy/`.
