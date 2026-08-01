# Auditoria de paridade do redesign

## Baseline

- Referência: `C:\\Users\\gabri\\Downloads\\Redesign da Rota de Caça (2)`.
- Frontend de destino: React + TypeScript + Vite.
- Backend e persistência permanecem Spring Boot, PostgreSQL e MinIO/S3.
- Total inventariado: 103 arquivos.
- A referência não será copiada nem incluída na imagem Docker.

## Diagnóstico inicial

- O motor React atual já preserva o catálogo, efetividade amplificada, cobertura,
  agrupamento por nível, caminhos recomendados e alvos descartados.
- A Rota React está visualmente parcial: usa painéis e cards simplificados e não
  emprega os ícones `types-v2`, alertas visuais nem toda a composição do v3.
- O VPLab não possui ainda o header visual dedicado da referência com marca,
  navegação por grupos e menu responsivo reutilizável.
- Os HTMLs de Avaliar IV, Pokédex, PokeFipe e Breeding contêm conteúdo visual a
  comparar, mas suas funcionalidades modernas React/PaddleOCR são autoritativas.
- Assets antigos já portados por hash serão reutilizados. Assets ausentes só
  entrarão quando houver consumidor React explícito.

## Inventário integral

| Arquivo | Tipo | Página/Componente | Conteúdo relevante | Existe no React? | Estado | Ação |
|---|---|---|---|---|---|---|
| `.thumbnail` | thumbnail | Referência | Fonte auxiliar | Não aplicável | REFERENCE_ONLY | Manter fora do runtime |
| `apps\vpertz-lab\public\assets\background-vp-store.webp` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\diamante-pokeidle.webp` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\diamond-button.webp` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\favicon.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\header\breeding.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\header\clans.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\header\evaluate-iv.webp` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\header\map.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\header\pokedex.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\header\professions.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\logo-pokefipe-transparente.webp` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\logo-vplab.webp` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\pokemon-placeholder.webp` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\alerts\alvo-evitar.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\alerts\alvo-ideal.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\alerts\dano-neutro.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\alerts\dano-nulo.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\alerts\dano-resistido.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\alerts\dano-super.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\alerts\dano-vantagem.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\alerts\hunt-lenta.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\alerts\hunt-segura.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\alerts\imunidade.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\alerts\par-compativel.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\alerts\par-rejeitado.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\alerts\recebe-atencao.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\alerts\recebe-muito.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\alerts\recebe-resiste.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\hunt-card-frame.png` | Asset | Identidade/Referência | Imagem ou ícone | Sim | DESIGN_ALREADY_PORTED | KEEP_CURRENT |
| `apps\vpertz-lab\public\assets\route\icon-sheet.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\positive-panel.png` | Asset | Identidade/Referência | Imagem ou ícone | Sim | DESIGN_ALREADY_PORTED | KEEP_CURRENT |
| `apps\vpertz-lab\public\assets\route\types\bug.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types\dark.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types\dragon.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types\electric.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types\fairy.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types\fighting.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types\fire.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types\flying.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types\ghost.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types\grass.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types\ground.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types\ice.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types\normal.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types\poison.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types\psychic.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types\rock.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types\steel.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types\water.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types-v2\bug.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types-v2\dark.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types-v2\dragon.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types-v2\electric.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types-v2\fairy.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types-v2\fighting.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types-v2\fire.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types-v2\flying.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types-v2\ghost.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types-v2\grass.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types-v2\ground.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types-v2\ice.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types-v2\normal.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types-v2\poison.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types-v2\psychic.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types-v2\rock.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types-v2\steel.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\types-v2\water.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-lab\public\assets\route\warning-panel.png` | Asset | Identidade/Referência | Imagem ou ícone | Sim | DESIGN_ALREADY_PORTED | KEEP_CURRENT |
| `apps\vpertz-lab\public\data.js` | JavaScript | Catálogo | Dados/lógica do protótipo | Equivalente TypeScript/JSON | REFERENCE_ONLY | Comparar regras; não copiar |
| `apps\vpertz-lab\public\styles.css` | CSS | Design VPLab | Tokens e estilos globais da referência | Parcial | DESIGN_PARTIAL | Portar seletores necessários |
| `apps\vpertz-store\public\assets\logo-vp-bazaar-horizontal-oficial.webp` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-store\public\assets\logo-vpertsz-horizontal.webp` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-store\public\assets\logo-vpertsz-quadrada.webp` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `apps\vpertz-store\public\assets\logo-vp-store-horizontal.webp` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `Avaliar IV v2.dc.html` | HTML | Avaliar IV v2.dc.html | Estrutura, conteúdo, estados e interação | Parcial | DESIGN_PARTIAL | Converter seletivamente para TSX/CSS |
| `Avaliar IV v3.dc.html` | HTML | Avaliar IV v3.dc.html | Estrutura, conteúdo, estados e interação | Parcial | DESIGN_PARTIAL | Converter seletivamente para TSX/CSS |
| `Avaliar IV v4.dc.html` | HTML | Avaliar IV v4.dc.html | Estrutura, conteúdo, estados e interação | Parcial | DESIGN_PARTIAL | Converter seletivamente para TSX/CSS |
| `Breeding v2.dc.html` | HTML | Breeding v2.dc.html | Estrutura, conteúdo, estados e interação | Parcial | DESIGN_PARTIAL | Converter seletivamente para TSX/CSS |
| `github.md` | Documento | Referência | Contexto | Não aplicável | REFERENCE_ONLY | Consultar |
| `Header da Família.dc.html` | HTML | Header da Família.dc.html | Estrutura, conteúdo, estados e interação | Parcial | DESIGN_PARTIAL | Converter seletivamente para TSX/CSS |
| `Header VPLab.dc.html` | HTML | Header VPLab.dc.html | Estrutura, conteúdo, estados e interação | Parcial | DESIGN_PARTIAL | Converter seletivamente para TSX/CSS |
| `Pacote de Ícones.dc.html` | HTML | Pacote de Ícones.dc.html | Estrutura, conteúdo, estados e interação | Parcial | DESIGN_PARTIAL | Converter seletivamente para TSX/CSS |
| `Pokedex v2.dc.html` | HTML | Pokedex v2.dc.html | Estrutura, conteúdo, estados e interação | Parcial | DESIGN_PARTIAL | Converter seletivamente para TSX/CSS |
| `PokeFipe 2.0.dc.html` | HTML | PokeFipe 2.0.dc.html | Estrutura, conteúdo, estados e interação | Parcial | DESIGN_PARTIAL | Converter seletivamente para TSX/CSS |
| `Rota de Caça v2.dc.html` | HTML | Rota de Caça v2.dc.html | Estrutura, conteúdo, estados e interação | Parcial | DESIGN_PARTIAL | Converter seletivamente para TSX/CSS |
| `Rota de Caça v3.dc.html` | HTML | Rota de Caça v3.dc.html | Estrutura, conteúdo, estados e interação | Parcial | DESIGN_PARTIAL | Converter seletivamente para TSX/CSS |
| `support.js` | JavaScript | Protótipos | Dados/lógica do protótipo | Equivalente TypeScript/JSON | REFERENCE_ONLY | Comparar regras; não copiar |
| `uploads\Calculadora_Pokeidle_Atualizada_Base_Mercado_28-07-2026.xlsx` | Planilha | PokeFipe | Fonte de cálculo/mercado | Lógica TypeScript atual | REFERENCE_ONLY | Comparar metodologia |
| `uploads\pasted-1785258483785-0.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `uploads\pasted-1785258564181-0.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `uploads\pasted-1785278312150-0.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `uploads\pasted-1785278373824-0.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `uploads\pasted-1785302093628-0.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `uploads\pasted-1785302124706-0.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `uploads\pasted-1785302142713-0.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `uploads\pasted-1785302185508-0.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `uploads\pasted-1785302195058-0.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `uploads\pasted-1785302240825-0.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `uploads\pasted-1785302253957-0.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `uploads\pasted-1785302359288-0.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `uploads\vplab-scizor.png` | Asset | Identidade/Referência | Imagem ou ícone | A conferir por hash/consumidor | ASSET_MISSING | Adicionar somente se usado |
| `vplab-dex.json` | JSON | Catálogo VPLab | Dados tipados | Sim, vplab-data | DESIGN_ALREADY_PORTED | KEEP_CURRENT |

## Ordem de implementação

1. Header compartilhado do VPLab e navegação responsiva.
2. Composição visual da Rota de Caça v3 sem alterar o motor atual.
3. Assets `types-v2` e alertas efetivamente usados.
4. Comparação visual nas quatro resoluções e correções responsivas.
5. Revisão das demais páginas VPLab contra seus HTMLs de referência.
