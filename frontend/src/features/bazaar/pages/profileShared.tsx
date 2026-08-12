import type { ReactNode } from "react";
import type { Listing } from "../../../types/listing";
import { numeroBR, spriteUrl } from "../../../utils/format";

// Helpers compartilhados entre PerfilPage (público) e ContaPage — portados fielmente
// de "VP Bazaar - Perfil.dc.html". Header/footer ficam no BazaarLayout.

export const A = (p: string) => `/assets/bazaar/${p}`;
export const SPRITES = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";

export const JOGOS: Record<string, { nome: string; logo: string; cor: string; borda: string; fundo: string }> = {
  pip: { nome: "Poke Idle World", logo: A("logo-pokeidleworld.png"), cor: "#9dbbe2", borda: "rgba(80,140,220,.4)", fundo: "rgba(12,24,46,.6)" },
  pwg: { nome: "Poke Web Games", logo: A("logo-pokewebgames.png"), cor: "#e8aaaa", borda: "rgba(200,60,60,.4)", fundo: "rgba(38,12,14,.6)" },
};

const NOMES_TIPOS: Record<string, string> = {
  normal: "Normal", fire: "Fogo", water: "Água", grass: "Planta", electric: "Elétrico", ice: "Gelo",
  fighting: "Lutador", poison: "Venenoso", ground: "Terrestre", flying: "Voador", psychic: "Psíquico",
  bug: "Inseto", rock: "Pedra", ghost: "Fantasma", dragon: "Dragão", dark: "Sombrio", steel: "Aço", fairy: "Fada",
};

const TOM_TIPO: Record<string, string> = {
  fire: "rgba(224,116,58,.2)", water: "rgba(91,155,214,.22)", grass: "rgba(126,217,162,.2)",
  electric: "rgba(229,179,79,.22)", psychic: "rgba(221,79,127,.2)", fairy: "rgba(221,79,127,.18)",
  dragon: "rgba(224,116,58,.2)", dark: "rgba(107,90,82,.28)", ghost: "rgba(124,83,143,.24)",
  ice: "rgba(120,190,220,.2)", poison: "rgba(154,111,187,.22)", steel: "rgba(150,160,180,.2)",
  fighting: "rgba(180,80,60,.2)", ground: "rgba(190,150,90,.2)", rock: "rgba(160,140,90,.2)",
  bug: "rgba(150,180,80,.2)", flying: "rgba(140,160,220,.2)", normal: "rgba(160,150,140,.2)",
};

const BANDAS: Array<[string, number, number, string]> = [
  ["Fraca", 0.8, 1.0, "#6b5a52"], ["Comum", 1.0, 1.1, "#8a7a70"], ["Incomum", 1.1, 1.3, "#7fd9a2"],
  ["Rara", 1.3, 1.5, "#5b9bd6"], ["Épica", 1.5, 1.7, "#9a6fbb"], ["Lendária", 1.7, 1.8, "#e5b34f"],
  ["Mítica", 1.8, 2.2, "#e8654a"], ["Anciã", 2.2, 2.9, "#d84f9e"], ["Divina", 2.9, 3.6, "#f2f0e6"],
];

export function tierQualidade(q: number): { texto: string; cor: string } | null {
  if (!q) return null;
  const banda = BANDAS.find(([, lo, hi]) => q >= lo && q < hi) ?? BANDAS[BANDAS.length - 1];
  return { texto: `${banda[0]} ${q.toFixed(2).replace(".", ",")}`, cor: banda[3] };
}

export const ESTADOS: Record<string, [string, string, string, string]> = {
  ativo: ["Ativo", "#a8f0c4", "rgba(126,217,162,.4)", "rgba(20,50,36,.5)"],
  pausado: ["Pausado", "#e5c98f", "rgba(229,179,79,.36)", "rgba(46,32,12,.5)"],
  vendido: ["Vendido", "#a4937e", "rgba(216,138,74,.24)", "rgba(24,16,13,.6)"],
};

export const ativo = (on: boolean) => ({
  borda: on ? "rgba(229,179,79,.55)" : "rgba(216,138,74,.16)",
  fundo: on ? "rgba(229,179,79,.11)" : "rgba(10,6,5,.45)",
  cor: on ? "#f7eee7" : "#a4937e",
});

// [id, nome, dex|null] — mesma coleção de avatares do material.
export const AVATARES: Array<[string, string, number | null]> = [
  ["inicial", "Iniciais", null], ["282", "Gardevoir", 282], ["94", "Gengar", 94], ["197", "Umbreon", 197],
  ["6", "Charizard", 6], ["143", "Snorlax", 143], ["149", "Dragonite", 149], ["65", "Alakazam", 65],
];

export interface VisualAvatar {
  arteBg: string;
  fundo: string;
  mostraSprite: string;
  mostraIniciais: string;
  corIniciais: string;
}

export function visualAvatar(avatar: string): VisualAvatar {
  const dex = /^\d+$/.test(avatar) ? Number(avatar) : null;
  return {
    arteBg: dex ? `url(${SPRITES}shiny/${dex}.png)` : "none",
    fundo: dex ? "radial-gradient(60% 60% at 50% 45%, #3b2415, #1a1009)" : "linear-gradient(160deg,#f6e0a8,#c08a3a 62%,#a86f28)",
    mostraSprite: dex ? "block" : "none",
    mostraIniciais: dex ? "none" : "block",
    corIniciais: dex ? "#f7eee7" : "#2a1608",
  };
}

export function iniciaisDe(nick: string): string {
  return (nick || "VP").slice(0, 2).toUpperCase();
}

/** Círculo de avatar (usado no hero público e nos menus). */
export function AvatarCirculo({ avatar, nick, size, fonte }: { avatar: string; nick: string; size: number; fonte: number }) {
  const v = visualAvatar(avatar);
  return (
    <span className="bz-avatar-circle" style={{ flex: "none", width: size, height: size, boxSizing: "border-box", display: "grid", placeItems: "center", borderRadius: "50%", background: v.fundo, border: "1px solid rgba(240,200,130,.4)", font: `800 ${fonte}px/1 Cinzel, serif`, color: v.corIniciais, overflow: "hidden" }}>
      <i role="img" aria-label={nick} style={{ gridArea: "1 / 1", width: "78%", height: "78%", background: v.arteBg, backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat", imageRendering: "pixelated", display: v.mostraSprite }} />
      <span style={{ gridArea: "1 / 1", display: v.mostraIniciais }}>{iniciaisDe(nick)}</span>
    </span>
  );
}

export interface CardVisual {
  titulo: string;
  arteBg: string;
  brilho: string;
  jogoLogo: string;
  jogoNome: string;
  estado: string;
  corEstado: string;
  bordaEstado: string;
  fundoEstado: string;
  detalhe: string;
  selos: Array<{ texto: string; cor: string; borda: string }>;
  ehDiamond: boolean;
  preco: string;
}

export function cardDe(l: Listing): CardVisual {
  const j = JOGOS[l.jogo] ?? JOGOS.pip;
  const e = ESTADOS[l.status] ?? ESTADOS.ativo;
  const tomBase = TOM_TIPO[l.tipos?.[0] ?? "normal"] ?? "rgba(216,138,74,.16)";
  const nomesTipos = (l.tipos ?? []).map((t) => NOMES_TIPOS[t] ?? t);
  const ehPokemon = l.categoria === "pokemon";
  const detalhe = ehPokemon
    ? [l.nivel ? `Nv. ${l.nivel}` : "", nomesTipos.join(" / ")].filter(Boolean).join(" · ")
    : [l.categoria === "card" ? "Consumível do Altar" : "Item", l.quantidade ? `${l.quantidade} un.` : ""].filter(Boolean).join(" · ");

  const selos: Array<{ texto: string; cor: string; borda: string }> = [];
  const tier = tierQualidade(l.qualidade);
  if (ehPokemon && tier) selos.push({ texto: tier.texto, cor: tier.cor, borda: "rgba(216,138,74,.22)" });
  const ivSoma = (l.ivs ?? []).length === 6 ? (l.ivs ?? []).reduce((s, n) => s + n, 0) : 0;
  if (ehPokemon && ivSoma) selos.push({ texto: `IV ${ivSoma}`, cor: "#c9a86a", borda: "rgba(216,138,74,.22)" });
  if (!ehPokemon) selos.push({ texto: "Consumível", cor: "#7fd9a2", borda: "rgba(126,217,162,.28)" });

  const ehDiamond = l.moeda === "diamonds";
  return {
    titulo: l.titulo,
    arteBg: `url(${l.dex ? spriteUrl(l.dex, l.shiny) : l.img || `${SPRITES}0.png`})`,
    brilho: `radial-gradient(62% 62% at 50% 46%, ${tomBase}, rgba(10,6,5,.85))`,
    jogoLogo: `url(${j.logo})`, jogoNome: j.nome,
    estado: e[0], corEstado: e[1], bordaEstado: e[2], fundoEstado: e[3],
    detalhe, selos, ehDiamond,
    preco: !l.preco ? "A combinar" : ehDiamond ? numeroBR(l.preco) : `R$ ${l.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
  };
}

/** Card de anúncio (mesma estrutura do material). `acoes` no fim = variante conta; `rodape` custom = variante pública. */
export function AdCard({ listing, thumbTo, tituloTo, rodape }: { listing: Listing; thumbTo?: string; tituloTo?: string; rodape: ReactNode }) {
  const ad = cardDe(listing);
  const Thumb = thumbTo ? "a" : "div";
  const Titulo = tituloTo ? "a" : "span";
  return (
    <article data-h="ad" style={{ display: "flex", gap: 12, padding: 12, borderRadius: 11, border: "1px solid rgba(216,138,74,.16)", background: "linear-gradient(180deg,#1c1412,#120c0a)", transition: "border-color .16s ease,transform .16s ease" }}>
      <Thumb {...(thumbTo ? { href: thumbTo } : {})} style={{ flex: "none", width: 64, height: 64, display: "grid", placeItems: "center", borderRadius: 9, border: "1px solid rgba(216,138,74,.16)", background: ad.brilho }}>
        <i role="img" aria-label={ad.titulo} style={{ width: "78%", height: "78%", background: ad.arteBg, backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat", imageRendering: "pixelated", filter: "drop-shadow(0 5px 8px rgba(0,0,0,.6))" }} />
      </Thumb>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Titulo {...(tituloTo ? { href: tituloTo } : {})} style={{ minWidth: 0, font: "700 13.5px/1.2 Inter", color: "#f7eee7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ad.titulo}</Titulo>
          <span style={{ flex: "none", padding: "3px 7px", borderRadius: 5, border: `1px solid ${ad.bordaEstado}`, background: ad.fundoEstado, font: "800 8.5px/1 Inter", letterSpacing: ".1em", textTransform: "uppercase", whiteSpace: "nowrap", color: ad.corEstado }}>{ad.estado}</span>
          <i role="img" aria-label={ad.jogoNome} title={ad.jogoNome} style={{ flex: "none", marginLeft: "auto", width: 26, height: 19, background: ad.jogoLogo, backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />
        </div>
        <div style={{ marginTop: 5, fontSize: 11, color: "#8a7a70" }}>{ad.detalhe}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
          {ad.selos.map((s, i) => (
            <span key={i} style={{ padding: "3px 7px", borderRadius: 5, border: `1px solid ${s.borda}`, font: "700 9.5px/1.3 Inter", whiteSpace: "nowrap", color: s.cor }}>{s.texto}</span>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 9, paddingTop: 9, borderTop: "1px solid rgba(216,138,74,.12)" }}>
          {ad.ehDiamond && <img src={A("diamante.png")} alt="Diamonds" style={{ flex: "none", width: 15, height: 15, objectFit: "contain" }} />}
          <b style={{ font: "700 15px/1 Cinzel, serif", whiteSpace: "nowrap", color: "#e5b34f" }}>{ad.preco}</b>
          {rodape}
        </div>
      </div>
    </article>
  );
}
