import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const SITE_URL = "https://www.vperts.com.br";
export const TWITCH_URL = "https://www.twitch.tv/vpertsz";
const DEFAULT_IMAGE = `${SITE_URL}/assets/banner-live-diaria.webp`;

type SeoEntry = { path: string; title: string; description: string };

export const SEO_PAGES: SeoEntry[] = [
  { path: "/", title: "VPertsz | Comunidade e ferramentas para PokeIdle World", description: "Comunidade VPertsz com ferramentas para PokeIdle World, Pokédex, avaliação de IV, PokeFipe, rotas de caça, breeding, marketplace e canais oficiais." },
  { path: "/comunidade", title: "Comunidade VPertsz | Live e canais oficiais", description: "Conheça a comunidade VPertsz, acompanhe a live de PokeIdle World na Twitch e encontre os grupos e canais oficiais do projeto." },
  { path: "/store", title: "VP Store | Diamonds e negociações de PokeIdle World", description: "Compre diamonds e negocie itens de PokeIdle World com atendimento e intermédio seguro pelos canais oficiais da VP Store." },
  { path: "/store/jogos", title: "Jogos atendidos pela VP Store | VPertsz", description: "Confira os jogos e serviços atendidos pela VP Store para comprar, vender e negociar com acompanhamento da comunidade VPertsz." },
  { path: "/store/negociar", title: "Negociar com segurança | VP Store", description: "Compre e venda diamonds, itens e recursos de jogos com atendimento oficial e negociação segura pela VP Store." },
  { path: "/store/contato", title: "Contato e canais oficiais | VP Store", description: "Fale com a VP Store pelos canais oficiais da comunidade VPertsz e solicite atendimento para compras e negociações." },
  { path: "/store/intermedio", title: "Intermédio seguro para negociações | VP Store", description: "Use o intermédio da VP Store para reduzir riscos em negociações de PokeIdle World entre compradores e vendedores." },
  { path: "/vplab", title: "Calculadora de IV para PokeIdle World | VPLab", description: "Avalie e compare o IV de Pokémon no PokeIdle World com a ferramenta gratuita do VPLab da comunidade VPertsz." },
  { path: "/vplab/avaliar-iv", title: "Avaliar IV de Pokémon no PokeIdle World | VPLab", description: "Calcule, avalie e compare o IV e os atributos dos seus Pokémon no PokeIdle World com o avaliador de IV do VPLab." },
  { path: "/vplab/pokedex", title: "Pokédex do PokeIdle World: stats, golpes e loot | VPLab", description: "Consulte a Pokédex do PokeIdle World com atributos, tipos, golpes, locais de caça, experiência e tabela de loot dos Pokémon." },
  { path: "/vplab/pokefipe", title: "PokeFipe: preço de Pokémon no PokeIdle World | VPLab", description: "Estime preços e consulte a cotação de Pokémon no PokeIdle World considerando espécie, nível, qualidade, IV e mercado." },
  { path: "/vplab/rota", title: "Planejador de rota de caça do PokeIdle World | VPLab", description: "Planeje sua rota de caça no PokeIdle World por tipos, vantagens, imunidades e Pokémon encontrados em cada área." },
  { path: "/vplab/breeding", title: "Calculadora de breeding do PokeIdle World | VPLab", description: "Planeje gerações, ovos e evolução de linhagem com a calculadora de breeding para PokeIdle World do VPLab." },
  { path: "/vplab/clas", title: "Clãs do PokeIdle World: times e ranking | VPLab", description: "Consulte clãs, líderes, ranking e sugestões de times para o sistema de clãs do PokeIdle World." },
  { path: "/vplab/profissoes", title: "Profissões do PokeIdle World: ranks e bônus | VPLab", description: "Veja profissões, requisitos de evolução, ranks e bônus de captura do sistema de profissões do PokeIdle World." },
  { path: "/bazaar", title: "VP Bazaar | Marketplace de PokeIdle World", description: "Encontre Pokémon, itens, shiny cards, contas e diamonds no marketplace da comunidade VPertsz, com opção de intermédio seguro." },
  { path: "/bazaar/como-funciona", title: "Como funciona o VP Bazaar | Marketplace VPertsz", description: "Entenda como anunciar, negociar e solicitar intermédio no VP Bazaar, o marketplace da comunidade VPertsz." },
];

const NOINDEX = [/^\/admin/, /^\/login/, /^\/bazaar\/(login|cadastro|perfil\/?$|anunciar|meus-anuncios|chat|conta)/, /^\/store\/offline/];

function setMeta(selector: string, attrs: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) { element = document.createElement("meta"); document.head.appendChild(element); }
  Object.entries(attrs).forEach(([key, value]) => element!.setAttribute(key, value));
}

export function SeoManager() {
  const { pathname } = useLocation();
  useEffect(() => {
    const path = pathname !== "/" ? pathname.replace(/\/$/, "") : "/";
    const entry = SEO_PAGES.find((page) => page.path === path);
    const title = entry?.title ?? "VPertsz | Comunidade PokeIdle World";
    const description = entry?.description ?? "Plataforma da comunidade VPertsz com ferramentas e serviços para jogadores de PokeIdle World.";
    const canonical = `${SITE_URL}${entry?.path ?? path}`;
    const robots = entry && !NOINDEX.some((pattern) => pattern.test(path)) ? "index, follow, max-image-preview:large" : "noindex, nofollow";
    document.title = title;
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
    link.href = canonical;
    setMeta('meta[name="description"]', { name: "description", content: description });
    setMeta('meta[name="robots"]', { name: "robots", content: robots });
    for (const [property, content] of [["og:title", title], ["og:description", description], ["og:url", canonical], ["og:type", "website"], ["og:image", DEFAULT_IMAGE]]) setMeta(`meta[property="${property}"]`, { property, content });
    for (const [name, content] of [["twitter:card", "summary_large_image"], ["twitter:title", title], ["twitter:description", description], ["twitter:image", DEFAULT_IMAGE]]) setMeta(`meta[name="${name}"]`, { name, content });
  }, [pathname]);
  return null;
}
