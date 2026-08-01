# Paridade visual do redesign

Data da validação: 01/08/2026.

## Escopo desta etapa

- Cabeçalho da família VPLab convertido em componente React compartilhado.
- Navegação antiga removida das sete páginas; não há menus duplicados ocultos.
- Busca global, estado ativo, autenticação e menu responsivo preservados em React.
- Rota de Caça mantida sobre o motor TypeScript v3 existente.
- Dezoito ícones de tipo e sete alertas efetivamente consumidos pela rota transferidos para a propriedade do frontend React.
- Nenhum HTML ou JavaScript do protótipo foi incorporado ao runtime.

## Evidências

- [Cabeçalho VPertsz — desktop](screenshots/hub-header-desktop.png)
- [Rota de Caça — desktop](screenshots/vplab-rota-desktop.png)
- [Rota de Caça — recorte estreito](screenshots/vplab-rota-mobile.png)

A captura desktop foi produzida em 1366 × 900 no runtime Docker. A captura estreita foi produzida com `--window-size=390,844`; o Chrome headless mantém um viewport de layout mínimo maior que o bitmap nesse modo, portanto ela serve para detectar quebras e overflow, mas não substitui a homologação em um navegador móvel real ou via CDP com emulação de dispositivo.

## Validações técnicas

- `npm test`: 51 testes aprovados.
- `npm run build`: TypeScript e Vite aprovados.
- `docker compose build --no-cache frontend`: aprovado.
- Stack Docker: frontend, backend, PostgreSQL e MinIO saudáveis.
- `/vplab/rota`: HTTP 200, sem ciclo de redirecionamento.
- Assets de tipo e alerta verificados com HTTP 200.

## Próximas páginas

O cabeçalho e a Rota de Caça formam o primeiro baseline do redesign. Ainda devem receber comparação visual equivalente: Avaliar IV, Pokédex, PokeFipe, Breeding, Clãs e Profissões. A arquitetura continua concluída; este trabalho restante é exclusivamente paridade visual e funcional.

## Cabeçalho VPertsz

O hub principal utiliza as marcas VPertsz, VPLab, VP Store e VP Bazaar fornecidas para o redesign. O CTA usa a arte larga “Assistir live” e a Comunidade passou para uma subnavegação centralizada, mantendo a hierarquia visual adotada no VPLab.

## Cabeçalho padrão compartilhado

Hub, VP Store, VP Bazaar e VPLab agora consomem o mesmo componente `PlatformHeader`. A barra principal usa exclusivamente marcas horizontais, o mesmo CTA “Assistir live” e um hover comum com elevação, brilho, ampliação da marca e sublinhado animado. Cada produto injeta somente sua subnavegação contextual.

- [Header compartilhado — Hub](screenshots/shared-header-hub.png)
- [Header compartilhado — Store](screenshots/shared-header-store.png)
- [Header compartilhado — Bazaar](screenshots/shared-header-bazaar.png)
- [Header compartilhado — VPLab](screenshots/shared-header-vplab.png)
