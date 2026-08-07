import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const site = "https://www.vperts.com.br";
const image = `${site}/assets/banner-live-diaria.webp`;
const pages = [
  ["/", "VPertsz | Comunidade e ferramentas para PokeIdle World", "Comunidade VPertsz com ferramentas para PokeIdle World, Pokédex, avaliação de IV, PokeFipe, rotas de caça, breeding, marketplace e canais oficiais."],
  ["/comunidade", "Comunidade VPertsz | Live e canais oficiais", "Conheça a comunidade VPertsz, acompanhe a live de PokeIdle World na Twitch e encontre os grupos e canais oficiais do projeto."],
  ["/store", "VP Store | Diamonds e negociações de PokeIdle World", "Compre diamonds e negocie itens de PokeIdle World com atendimento e intermédio seguro pelos canais oficiais da VP Store."],
  ["/store/jogos", "Jogos atendidos pela VP Store | VPertsz", "Confira os jogos e serviços atendidos pela VP Store para comprar, vender e negociar com acompanhamento da comunidade VPertsz."],
  ["/store/negociar", "Negociar com segurança | VP Store", "Compre e venda diamonds, itens e recursos de jogos com atendimento oficial e negociação segura pela VP Store."],
  ["/store/contato", "Contato e canais oficiais | VP Store", "Fale com a VP Store pelos canais oficiais da comunidade VPertsz e solicite atendimento para compras e negociações."],
  ["/store/intermedio", "Intermédio seguro para negociações | VP Store", "Use o intermédio da VP Store para reduzir riscos em negociações de PokeIdle World entre compradores e vendedores."],
  ["/vplab", "Calculadora de IV para PokeIdle World | VPLab", "Avalie e compare o IV de Pokémon no PokeIdle World com a ferramenta gratuita do VPLab da comunidade VPertsz."],
  ["/vplab/avaliar-iv", "Avaliar IV de Pokémon no PokeIdle World | VPLab", "Calcule, avalie e compare o IV e os atributos dos seus Pokémon no PokeIdle World com o avaliador de IV do VPLab."],
  ["/vplab/pokedex", "Pokédex do PokeIdle World: stats, golpes e loot | VPLab", "Consulte a Pokédex do PokeIdle World com atributos, tipos, golpes, locais de caça, experiência e tabela de loot dos Pokémon."],
  ["/vplab/pokefipe", "PokeFipe: preço de Pokémon no PokeIdle World | VPLab", "Estime preços e consulte a cotação de Pokémon no PokeIdle World considerando espécie, nível, qualidade, IV e mercado."],
  ["/vplab/rota", "Planejador de rota de caça do PokeIdle World | VPLab", "Planeje sua rota de caça no PokeIdle World por tipos, vantagens, imunidades e Pokémon encontrados em cada área."],
  ["/vplab/breeding", "Calculadora de breeding do PokeIdle World | VPLab", "Planeje gerações, ovos e evolução de linhagem com a calculadora de breeding para PokeIdle World do VPLab."],
  ["/vplab/clas", "Clãs do PokeIdle World: times e ranking | VPLab", "Consulte clãs, líderes, ranking e sugestões de times para o sistema de clãs do PokeIdle World."],
  ["/vplab/profissoes", "Profissões do PokeIdle World: ranks e bônus | VPLab", "Veja profissões, requisitos de evolução, ranks e bônus de captura do sistema de profissões do PokeIdle World."],
  ["/bazaar", "VP Bazaar | Marketplace de PokeIdle World", "Encontre Pokémon, itens, shiny cards, contas e diamonds no marketplace da comunidade VPertsz, com opção de intermédio seguro."],
  ["/bazaar/como-funciona", "Como funciona o VP Bazaar | Marketplace VPertsz", "Entenda como anunciar, negociar e solicitar intermédio no VP Bazaar, o marketplace da comunidade VPertsz."],
];

const esc = (value) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
const base = await readFile(resolve("dist/index.html"), "utf8");
for (const [path, title, description] of pages) {
  const canonical = `${site}${path}`;
  const data = path === "/" ? {
    "@context": "https://schema.org", "@graph": [
      { "@type": "WebSite", "@id": `${site}/#website`, url: `${site}/`, name: "VPertsz", inLanguage: "pt-BR" },
      { "@type": "Organization", "@id": `${site}/#organization`, name: "VPertsz", url: `${site}/`, logo: `${site}/assets/logo-vpertsz-quadrada.webp`, sameAs: ["https://www.twitch.tv/vpertsz"] }
    ]
  } : { "@context": "https://schema.org", "@type": "WebPage", name: title, description, url: canonical, isPartOf: { "@id": `${site}/#website` }, inLanguage: "pt-BR" };
  const tags = `<title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:locale" content="pt_BR" />
    <meta property="og:site_name" content="VPertsz" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${image}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${image}" />
    <script type="application/ld+json">${JSON.stringify(data).replaceAll("<", "\\u003c")}</script>`;
  const html = base.replace(/<title>[\s\S]*?<\/title>\s*<meta\s+name="description"[\s\S]*?\/>/, tags);
  const output = path === "/" ? resolve("dist/index.html") : resolve(`dist${path}/index.html`);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, html);
}
console.log(`SEO: ${pages.length} páginas públicas geradas.`);
