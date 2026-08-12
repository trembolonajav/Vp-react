import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { listListings } from "../../../services/listingsService";
import { EMPTY_FILTERS, type Listing } from "../../../types/listing";

// Migração pixel-perfect de "VP Bazaar - Home.dc.html" (conteúdo da aba; header/footer ficam no BazaarLayout).
// Dados-demo preservados do original; a troca por API entra no estágio de backend sem alterar a aparência.

const A = (p: string) => `/assets/bazaar/${p}`;
const S = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";

const ESCALA = { min: 0.8, max: 3.6 };
const BANDAS: Array<[string, number, number, string]> = [
  ["Fraca", 0.8, 1.0, "#6b5a52"], ["Comum", 1.0, 1.1, "#8a7a70"], ["Incomum", 1.1, 1.3, "#7fd9a2"],
  ["Rara", 1.3, 1.5, "#5b9bd6"], ["Épica", 1.5, 1.7, "#9a6fbb"], ["Lendária", 1.7, 1.8, "#e5b34f"],
  ["Mítica", 1.8, 2.2, "#e8654a"], ["Anciã", 2.2, 2.9, "#d84f9e"], ["Divina", 2.9, 3.6, "#f2f0e6"],
];
const JOGOS: Record<string, { nome: string; sigla: string; logo: string; cor: string; borda: string; fundo: string; linha: string }> = {
  pip: { nome: "Poke Idle World", sigla: "Poke Idle\nWorld", logo: A("logo-pokeidleworld.png"), cor: "#9dbbe2", borda: "rgba(80,140,220,.5)", fundo: "rgba(12,24,46,.72)", linha: "linear-gradient(90deg,#2f6fb8,#63b3d8)" },
  pwg: { nome: "Poke Web Games", sigla: "Poke Web\nGames", logo: A("logo-pokewebgames.png"), cor: "#e8aaaa", borda: "rgba(200,60,60,.5)", fundo: "rgba(38,12,14,.72)", linha: "linear-gradient(90deg,#a51f22,#e0743a)" },
};
const NOMES_TIPOS: Array<[string, string]> = [["normal", "Normal"], ["fire", "Fogo"], ["water", "Água"], ["grass", "Planta"], ["electric", "Elétrico"], ["ice", "Gelo"], ["fighting", "Lutador"], ["poison", "Venenoso"], ["ground", "Terrestre"], ["flying", "Voador"], ["psychic", "Psíquico"], ["bug", "Inseto"], ["rock", "Pedra"], ["ghost", "Fantasma"], ["dragon", "Dragão"], ["dark", "Sombrio"], ["steel", "Aço"], ["fairy", "Fada"]];

interface Anuncio { id: string | number; jogo: string; cat: string; intencao: string; titulo: string; detalhe: string; sprite: string; shiny?: boolean; nivel: number; iv: number; qual: number; tipos: string[]; moeda: string; preco: number; negociavel: boolean; vendedor: string; nota: string; quando: string; brilho: string }

const fmt = (n: number) => n.toFixed(2).replace(".", ",");
const num = (v: string) => { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? null : n; };
const limitar = (v: number) => Math.min(ESCALA.max, Math.max(ESCALA.min, v));
const pct = (v: number) => ((v - ESCALA.min) / (ESCALA.max - ESCALA.min) * 100).toFixed(2) + "%";
const ativo = (on: boolean, corAtiva?: string) => ({
  borda: on ? "rgba(229,179,79,.62)" : "rgba(216,138,74,.18)",
  fundo: on ? "rgba(229,179,79,.13)" : "rgba(10,6,5,.5)",
  cor: on ? (corAtiva || "#f7eee7") : "#a4937e",
});

const SCOPED = `
.bzhome input:focus,.bzhome select:focus{outline:none;border-color:#e5b34f}
.bzhome input::placeholder{color:#7d6d64}
.bzhome [data-h=cat]:hover{color:#f7eee7}
.bzhome [data-h=clear]:hover{color:#e5b34f}
.bzhome [data-h=chip]:hover{border-color:#e5b34f !important;background:rgba(195,54,41,.16) !important}
.bzhome [data-h=game]:hover,.bzhome [data-h=intent]:hover{border-color:rgba(229,179,79,.55) !important}
.bzhome [data-h=qband]:hover,.bzhome [data-h=type]:hover{border-color:rgba(229,179,79,.6) !important}
.bzhome [data-h=card]:hover{transform:translateY(-3px);border-color:rgba(229,179,79,.45) !important;box-shadow:0 12px 28px rgba(0,0,0,.55)}
.bzhome [data-h=seller]:hover{color:#e5b34f}
.bzhome [data-h=empty]:hover{border-color:#e5b34f !important}
@media (max-width:1180px){.bzhome-grid{grid-template-columns:minmax(0,1fr) !important}.bzhome-grid > aside{position:static !important;max-height:none !important}.bzhome-art{display:none !important}}
`;

interface State {
  jogo: string; categoria: string; intencao: string; moeda: string; busca: string; ordem: string;
  precoMin: string; precoMax: string; nivelMin: string; ivMin: string;
  qMin: number; qMax: number; tipos: string[]; qualidadeAberta: boolean; avancadoAberto: boolean;
}

export function MarketplacePage() {
  const navigate = useNavigate();
  const [dadosApi, setDadosApi] = useState<Anuncio[]>([]);
  const [apiCarregada, setApiCarregada] = useState(false);
  const [totaisPorJogo, setTotaisPorJogo] = useState({ pip: 0, pwg: 0 });
  const [st, setSt] = useState<State>({
    jogo: "todos", categoria: "todos", intencao: "todas", moeda: "todas", busca: "", ordem: "recentes",
    precoMin: "", precoMax: "", nivelMin: "", ivMin: "", qMin: 0.8, qMax: 3.6, tipos: [], qualidadeAberta: true, avancadoAberto: false,
  });
  const set = (o: Partial<State>) => setSt((s) => ({ ...s, ...o }));
  const trilha = useRef<HTMLDivElement | null>(null);
  const alvo = useRef<"min" | "max" | null>(null);
  const stateRef = useRef(st); stateRef.current = st;

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      listListings({ ...EMPTY_FILTERS, page: 1 }, controller.signal),
      listListings({ ...EMPTY_FILTERS, jogo: "pokeidle", page: 1 }, controller.signal),
      listListings({ ...EMPTY_FILTERS, jogo: "pokewebgames", page: 1 }, controller.signal),
    ])
      .then(([page, pip, pwg]) => { setDadosApi(page.content.map((item: Listing) => ({
        id: item.id,
        jogo: item.jogo === "pokewebgames" || item.jogo === "pwg" ? "pwg" : "pip",
        cat: ["pokemon", "item", "card"].includes(item.categoria) ? item.categoria : "pokemon",
        intencao: item.intencao === "compra" ? "procura" : item.intencao || "venda",
        titulo: item.titulo,
        detalhe: [item.tipos.join(" · "), item.shiny ? "Shiny" : ""].filter(Boolean).join(" · ") || item.descricao,
        sprite: item.img || (item.dex ? `${S}${item.shiny ? "shiny/" : ""}${item.dex}.png` : A("sprite-rare-candy.png")),
        shiny: item.shiny,
        nivel: item.nivel,
        iv: item.ivs.reduce((total, value) => total + value, 0),
        qual: item.qualidade,
        tipos: item.tipos.map((tipo) => tipo.toLowerCase()),
        moeda: item.moeda,
        preco: item.preco,
        negociavel: item.negociavel,
        vendedor: item.vendedor,
        nota: item.vendedorNota ? item.vendedorNota.toFixed(1).replace(".", ",") : "—",
        quando: item.criadoEm ? new Date(item.criadoEm).toLocaleDateString("pt-BR") : "",
        brilho: "radial-gradient(58% 58% at 50% 46%, rgba(221,79,127,.2), rgba(10,6,5,.9))",
      }))); setTotaisPorJogo({ pip: pip.totalElements, pwg: pwg.totalElements }); setApiCarregada(true); })
      .catch((error: Error) => { if (error.name !== "AbortError") { setDadosApi([]); setApiCarregada(true); } });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const mover = (e: PointerEvent) => {
      if (!alvo.current || !trilha.current) return;
      const r = trilha.current.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const v = Math.round((ESCALA.min + p * (ESCALA.max - ESCALA.min)) * 100) / 100;
      if (alvo.current === "min") set({ qMin: Math.min(v, stateRef.current.qMax) });
      else set({ qMax: Math.max(v, stateRef.current.qMin) });
    };
    const soltar = () => { alvo.current = null; };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", soltar);
    return () => { window.removeEventListener("pointermove", mover); window.removeEventListener("pointerup", soltar); };
  }, []);

  const selo: string = "logo", largura = 250, filtroLargo = false;

  const anuncios = useMemo(() => {
    const busca = st.busca.trim().toLowerCase();
    const pMin = num(st.precoMin), pMax = num(st.precoMax), nMin = num(st.nivelMin), iMin = num(st.ivMin);
    const filtrados = dadosApi.filter((a) => {
      if (st.jogo !== "todos" && a.jogo !== st.jogo) return false;
      if (st.categoria !== "todos" && a.cat !== st.categoria) return false;
      if (st.intencao !== "todas" && a.intencao !== st.intencao) return false;
      if (st.moeda !== "todas" && a.moeda !== st.moeda) return false;
      if (busca && (a.titulo + " " + a.detalhe).toLowerCase().indexOf(busca) < 0) return false;
      if (pMin !== null && a.preco < pMin) return false;
      if (pMax !== null && a.preco > pMax) return false;
      if (a.cat === "pokemon") {
        if (a.qual < st.qMin - 0.001 || a.qual > st.qMax + 0.001) return false;
        if (nMin !== null && a.nivel < nMin) return false;
        if (iMin !== null && a.iv < iMin) return false;
        if (st.tipos.length > 0 && !st.tipos.some((tipo) => a.tipos.includes(tipo))) return false;
      } else if (st.qMin > ESCALA.min + 0.001 || st.qMax < ESCALA.max - 0.001 || nMin !== null || iMin !== null) {
        return false;
      } else if (st.tipos.length > 0) {
        return false;
      }
      return true;
    });
    const ordenados = filtrados.slice().sort((a, b) => {
      if (st.ordem === "menor") return a.preco - b.preco;
      if (st.ordem === "maior") return b.preco - a.preco;
      if (st.ordem === "qualidade") return b.qual - a.qual;
      if (st.ordem === "iv") return b.iv - a.iv;
      return String(a.id).localeCompare(String(b.id));
    });
    return ordenados.map((a) => {
      const j = JOGOS[a.jogo];
      const cinza = "#7d6d64";
      const stats: Array<{ rotulo: string; corRotulo: string; valor: string; cor: string }> = [];
      if (a.cat === "pokemon") {
        stats.push({ rotulo: "Nível", corRotulo: cinza, valor: String(a.nivel), cor: "#f7eee7" });
        stats.push({ rotulo: "IV total", corRotulo: cinza, valor: a.iv + "/192", cor: "#e5b34f" });
        const banda = BANDAS.find((b) => a.qual >= b[1] && a.qual <= b[2]) || BANDAS[0];
        stats.push({ rotulo: banda[0], corRotulo: banda[3], valor: fmt(a.qual), cor: banda[3] });
      } else if (a.cat === "card") {
        stats.push({ rotulo: "Uso", corRotulo: cinza, valor: "Altar shiny", cor: "#dcc3f2" });
        stats.push({ rotulo: "Entrega", corRotulo: cinza, valor: "Imediata", cor: "#7fd9a2" });
      } else {
        stats.push({ rotulo: "Categoria", corRotulo: cinza, valor: "Consumível", cor: "#f7eee7" });
        stats.push({ rotulo: "Entrega", corRotulo: cinza, valor: "Imediata", cor: "#7fd9a2" });
      }
      return {
        id: a.id, titulo: a.titulo, detalhe: a.detalhe, spriteBg: `url(${a.sprite})`, brilho: a.brilho,
        abrir: () => navigate(`/bazaar/anuncio/${a.id}`),
        shiny: !!a.shiny, negociavel: a.negociavel, vendedor: a.vendedor, quando: a.quando,
        iniciais: a.vendedor.slice(0, 2).toUpperCase(),
        stats, colunasStats: `repeat(${stats.length},1fr)`,
        ehDiamond: a.moeda === "dia",
        preco: a.moeda === "dia" ? a.preco.toLocaleString("pt-BR") : "R$ " + a.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
        plate: a.intencao === "venda" ? "À venda" : "Procura-se",
        plateCor: a.intencao === "venda" ? "#ffe0b8" : "#ffc9b8",
        plateBorda: a.intencao === "venda" ? "rgba(229,179,79,.45)" : "rgba(195,54,41,.55)",
        plateFundo: a.intencao === "venda" ? "rgba(38,24,12,.72)" : "rgba(48,14,12,.72)",
        mostraSelo: selo !== "nenhum",
        jogoLogoBg: `url(${j.logo})`, jogoNome: j.nome, jogoCor: j.cor, jogoBorda: j.borda, jogoFundo: j.fundo,
        jogoLinha: j.linha, jogoSigla: selo === "logo" ? "" : j.sigla,
      };
    });
  }, [st, navigate, dadosApi, apiCarregada]);

  const cats: Array<[string, string]> = [["todos", "Todos"], ["pokemon", "Pokémons"], ["item", "Itens"], ["card", "Shiny Cards"]];
  const categorias = cats.map(([id, rotulo]) => ({ rotulo, aoClicar: () => set({ categoria: id }), ...ativo(st.categoria === id) }));
  const jogoPip = ativo(st.jogo === "pip", JOGOS.pip.cor);
  const jogoPwg = ativo(st.jogo === "pwg", JOGOS.pwg.cor);
  const intencoes = ([["venda", "À venda"], ["procura", "Procura-se"]] as Array<[string, string]>).map(([id, rotulo]) => {
    const on = st.intencao === id;
    return { rotulo, aoClicar: () => set({ intencao: on ? "todas" : id }), ...ativo(on) };
  });
  const moedas = ([["brl", "R$", "Reais"], ["dia", "Diamonds", "Diamonds"]] as Array<[string, string, string]>).map(([id, rotulo, nome]) => {
    const on = st.moeda === id;
    return { id, rotulo, nome, ehDiamante: id === "dia", opacidade: on ? "1" : ".6", aoClicar: () => set({ moeda: on ? "todas" : id }), ...ativo(on) };
  });
  const qualidades = BANDAS.map(([nome, lo, hi, ponto]) => {
    const on = st.qMin <= lo + 0.001 && st.qMax >= hi - 0.001;
    return { nome, ponto, borda: on ? "rgba(229,179,79,.6)" : "rgba(216,138,74,.18)", fundo: on ? "rgba(229,179,79,.12)" : "rgba(10,6,5,.5)", cor: on ? "#f7eee7" : "#a4937e", aoClicar: () => set({ qMin: lo, qMax: hi }) };
  });
  const tiposElementais = NOMES_TIPOS.map(([id, nome]) => {
    const on = st.tipos.indexOf(id) >= 0;
    return { nome, iconeBg: `url(${A("types/" + id + ".webp")})`, opacidade: on ? "1" : ".45", aoClicar: () => set({ tipos: on ? st.tipos.filter((x) => x !== id) : st.tipos.concat([id]) }), ...ativo(on) };
  });

  const chips: Array<{ rotulo: string; remover: () => void }> = [];
  if (st.jogo !== "todos") chips.push({ rotulo: JOGOS[st.jogo].nome, remover: () => set({ jogo: "todos" }) });
  if (st.categoria !== "todos") chips.push({ rotulo: (cats.find((c) => c[0] === st.categoria) || ["", ""])[1], remover: () => set({ categoria: "todos" }) });
  if (st.intencao !== "todas") chips.push({ rotulo: st.intencao === "venda" ? "À venda" : "Procura-se", remover: () => set({ intencao: "todas" }) });
  if (st.moeda !== "todas") chips.push({ rotulo: st.moeda === "brl" ? "Reais" : "Diamonds", remover: () => set({ moeda: "todas" }) });
  if (st.precoMin || st.precoMax) chips.push({ rotulo: "Preço " + (st.precoMin || "0") + "–" + (st.precoMax || "∞"), remover: () => set({ precoMin: "", precoMax: "" }) });
  const faixaCheia = st.qMin <= ESCALA.min + 0.001 && st.qMax >= ESCALA.max - 0.001;
  if (!faixaCheia) chips.push({ rotulo: "Qualidade " + fmt(st.qMin) + "–" + fmt(st.qMax), remover: () => set({ qMin: ESCALA.min, qMax: ESCALA.max }) });
  if (st.nivelMin) chips.push({ rotulo: "Nível ≥ " + st.nivelMin, remover: () => set({ nivelMin: "" }) });
  if (st.ivMin) chips.push({ rotulo: "IV ≥ " + st.ivMin, remover: () => set({ ivMin: "" }) });
  st.tipos.forEach((id) => { const n = (NOMES_TIPOS.find((t) => t[0] === id) || ["", ""])[1]; chips.push({ rotulo: n, remover: () => set({ tipos: st.tipos.filter((x) => x !== id) }) }); });

  const totalPip = totaisPorJogo.pip;
  const totalPwg = totaisPorJogo.pwg;
  const limparTudo = () => set({ jogo: "todos", categoria: "todos", intencao: "todas", moeda: "todas", busca: "", precoMin: "", precoMax: "", nivelMin: "", ivMin: "", qMin: ESCALA.min, qMax: ESCALA.max, tipos: [] });

  const inputStyle: CSSProperties = { width: "100%", boxSizing: "border-box", padding: "9px 11px", borderRadius: 8, border: "1px solid rgba(216,138,74,.2)", background: "rgba(10,6,5,.6)", color: "#f7eee7", fontSize: 12.5 };
  const labelCap: CSSProperties = { display: "block", font: "800 9.5px/1 Inter", letterSpacing: ".14em", textTransform: "uppercase", color: "#8a7a70", marginBottom: 8 };

  return (
    <div className="bzhome" style={{ background: "#0a0605", minHeight: "100vh", paddingBottom: 56 }}>
      <style>{SCOPED}</style>
      <div style={{ maxWidth: 1560, margin: "0 auto", padding: "18px 26px 0" }}>

        {/* HERO */}
        <section style={{ position: "relative", overflow: "hidden", borderRadius: 12, border: "1px solid rgba(216,138,74,.26)", background: "radial-gradient(120% 170% at 6% 18%, #2a1512 0%, #150c0a 52%, #0d0806 100%)" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(10,6,5,.96) 0%,rgba(10,6,5,.9) 38%,rgba(10,6,5,.45) 62%,rgba(10,6,5,.2) 100%)" }} />
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(246,226,176,.55) 30%,rgba(246,226,176,.55) 70%,transparent)" }} />
          <div style={{ position: "absolute", left: 0, top: "14%", bottom: "14%", width: 3, borderRadius: "0 3px 3px 0", background: "linear-gradient(180deg,transparent,#c33629 35%,#e5b34f 65%,transparent)" }} />
          <div className="bzhome-art" style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "52%", background: `url(${A("hero-art.png")}) right center/cover`, WebkitMaskImage: "linear-gradient(90deg,transparent,#000 42%)", maskImage: "linear-gradient(90deg,transparent,#000 42%)", opacity: .9 }} />
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 26, padding: "20px 26px", minHeight: 148 }}>
            <div style={{ minWidth: 0, maxWidth: 620 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#c33629", boxShadow: "0 0 8px #c33629" }} />
                <span style={{ font: "800 10px/1 Inter", letterSpacing: ".2em", textTransform: "uppercase", color: "#c9a86a" }}>Marketplace da comunidade</span>
              </div>
              <h1 style={{ margin: "10px 0 0", font: "700 27px/1.15 Cinzel, serif", color: "#f7eee7", textShadow: "0 2px 14px rgba(0,0,0,.6)" }}>Pokémons, itens, shiny cards e <span style={{ background: "linear-gradient(180deg,#f6e2b0,#d99b3c)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "#e5b34f" }}>diamonds</span></h1>
              <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.55, color: "#a4937e", maxWidth: "56ch" }}>Anúncios publicados por jogadores. A proteção da VP existe <b style={{ color: "#e5b34f", fontWeight: 600 }}>somente quando a negociação usa o intermédio oficial</b>.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 14 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 11px", borderRadius: 7, border: "1px solid rgba(216,138,74,.26)", background: "rgba(12,7,6,.55)", backdropFilter: "blur(3px)", font: "600 11px/1 Inter", whiteSpace: "nowrap", color: "#d8c4b6" }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: "#e5b34f" }} />Anúncios da comunidade</span>
                <span style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 11px", borderRadius: 7, border: "1px solid rgba(195,54,41,.4)", background: "rgba(38,12,11,.6)", backdropFilter: "blur(3px)", font: "600 11px/1 Inter", whiteSpace: "nowrap", color: "#f0c9bd" }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: "#c33629", boxShadow: "0 0 7px #c33629" }} />Intermédio oficial da VP</span>
                <span style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 11px", borderRadius: 7, border: "1px solid rgba(126,217,162,.3)", background: "rgba(14,32,24,.55)", backdropFilter: "blur(3px)", font: "600 11px/1 Inter", whiteSpace: "nowrap", color: "#a8d9bd" }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ec97c" }} />Dois jogos, uma vitrine</span>
              </div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 11, border: "1px solid rgba(80,140,220,.34)", background: "rgba(10,20,40,.55)", backdropFilter: "blur(3px)" }}>
                <img src={A("logo-pokeidleworld.png")} alt="Poke Idle World" style={{ height: 38, width: "auto", display: "block" }} />
                <span style={{ font: "700 9px/1 Inter", letterSpacing: ".14em", textTransform: "uppercase", color: "#9dbbe2" }}>{totalPip} anúncios</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, padding: "10px 16px", borderRadius: 11, border: "1px solid rgba(200,60,60,.34)", background: "rgba(30,10,14,.55)", backdropFilter: "blur(3px)" }}>
                <img src={A("logo-pokewebgames.png")} alt="Poke Web Games" style={{ height: 38, width: "auto", display: "block" }} />
                <span style={{ font: "700 9px/1 Inter", letterSpacing: ".14em", textTransform: "uppercase", color: "#e2a3a3" }}>{totalPwg} anúncios</span>
              </div>
            </div>
          </div>
        </section>

        {/* BUSCA + CATEGORIAS */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <label style={{ position: "relative", flex: "1 1 320px", minWidth: 260, display: "block" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#7d6d64" }}>⌕</span>
            <input type="search" value={st.busca} onChange={(e) => set({ busca: e.target.value })} placeholder="Buscar pokémon, item ou shiny card…" style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px 11px 34px", borderRadius: 9, border: "1px solid rgba(216,138,74,.22)", background: "rgba(16,10,9,.9)", color: "#f7eee7", fontSize: 13.5 }} />
          </label>
          <div style={{ display: "flex", gap: 4, padding: 4, borderRadius: 10, border: "1px solid rgba(216,138,74,.18)", background: "rgba(16,10,9,.9)" }}>
            {categorias.map((c) => (
              <button key={c.rotulo} data-h="cat" onClick={c.aoClicar} style={{ padding: "8px 15px", borderRadius: 7, cursor: "pointer", border: `1px solid ${c.borda}`, background: c.fundo, font: "700 12.5px/1 Inter", color: c.cor }}>{c.rotulo}</button>
            ))}
          </div>
        </div>

        {/* GRID */}
        <div className="bzhome-grid" style={{ display: "grid", gridTemplateColumns: `${filtroLargo ? "300px" : "254px"} minmax(0,1fr)`, gap: 18, alignItems: "start", marginTop: 16 }}>

          {/* FILTROS */}
          <aside data-scroll="1" style={{ position: "sticky", top: 74, maxHeight: "calc(100vh - 92px)", overflow: "auto", border: "1px solid rgba(216,138,74,.2)", borderRadius: 12, background: "linear-gradient(180deg,#181110,#110b0a)", padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 11, borderBottom: "1px solid rgba(216,138,74,.16)" }}>
              <strong style={{ font: "800 10px/1 Inter", letterSpacing: ".16em", textTransform: "uppercase", color: "#e5b34f" }}>Filtros</strong>
              <button data-h="clear" onClick={limparTudo} style={{ padding: 0, border: 0, background: "none", cursor: "pointer", font: "700 10.5px/1 Inter", color: "#8a7a70" }}>Limpar</button>
            </div>

            {chips.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, padding: "11px 0", borderBottom: "1px solid rgba(216,138,74,.12)" }}>
                {chips.map((ch, i) => (
                  <button key={ch.rotulo + i} data-h="chip" onClick={ch.remover} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 8px 5px 10px", borderRadius: 999, cursor: "pointer", border: "1px solid rgba(229,179,79,.34)", background: "rgba(229,179,79,.1)", font: "600 11px/1 Inter", color: "#f0d194" }}>{ch.rotulo}<span style={{ opacity: .6, fontSize: 12 }}>×</span></button>
                ))}
              </div>
            )}

            <div style={{ padding: "13px 0 0" }}>
              <span style={labelCap}>Jogo</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <button data-h="game" onClick={() => set({ jogo: st.jogo === "pip" ? "todos" : "pip" })} title="Poke Idle World" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, padding: "10px 6px", borderRadius: 9, cursor: "pointer", border: `1px solid ${jogoPip.borda}`, background: jogoPip.fundo }}>
                  <img src={A("logo-pokeidleworld.png")} alt="Poke Idle World" style={{ height: 30, width: "auto", display: "block", opacity: st.jogo === "pwg" ? .5 : 1 }} />
                  <span style={{ font: "700 9.5px/1.2 Inter", textAlign: "center", color: jogoPip.cor }}>Poke Idle World</span>
                </button>
                <button data-h="game" onClick={() => set({ jogo: st.jogo === "pwg" ? "todos" : "pwg" })} title="Poke Web Games" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, padding: "10px 6px", borderRadius: 9, cursor: "pointer", border: `1px solid ${jogoPwg.borda}`, background: jogoPwg.fundo }}>
                  <img src={A("logo-pokewebgames.png")} alt="Poke Web Games" style={{ height: 30, width: "auto", display: "block", opacity: st.jogo === "pip" ? .5 : 1 }} />
                  <span style={{ font: "700 9.5px/1.2 Inter", textAlign: "center", color: jogoPwg.cor }}>Poke Web Games</span>
                </button>
              </div>
            </div>

            <div style={{ padding: "14px 0 0" }}>
              <span style={labelCap}>Tipo de anúncio</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {intencoes.map((i) => (
                  <button key={i.rotulo} data-h="intent" onClick={i.aoClicar} style={{ padding: "9px 6px", borderRadius: 8, cursor: "pointer", border: `1px solid ${i.borda}`, background: i.fundo, font: "700 11.5px/1 Inter", color: i.cor }}>{i.rotulo}</button>
                ))}
              </div>
            </div>

            <div style={{ padding: "14px 0 0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ font: "800 9.5px/1 Inter", letterSpacing: ".14em", textTransform: "uppercase", color: "#8a7a70" }}>Preço</span>
                <div style={{ display: "flex", gap: 4 }}>
                  {moedas.map((m) => (
                    <button key={m.id} onClick={m.aoClicar} title={m.nome} style={{ display: "flex", alignItems: "center", gap: 5, height: 26, padding: "0 10px", borderRadius: 6, cursor: "pointer", border: `1px solid ${m.borda}`, background: m.fundo, font: "700 10px/1 Inter", color: m.cor }}>
                      {m.ehDiamante && <i role="img" aria-label="Diamonds" style={{ width: 14, height: 14, background: `url(${A("diamante.png")}) center/contain no-repeat`, opacity: Number(m.opacidade) }} />}{m.rotulo}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <input type="number" value={st.precoMin} onChange={(e) => set({ precoMin: e.target.value })} placeholder="Mínimo" style={inputStyle} />
                <input type="number" value={st.precoMax} onChange={(e) => set({ precoMax: e.target.value })} placeholder="Máximo" style={inputStyle} />
              </div>
            </div>

            {/* QUALIDADE */}
            <div style={{ marginTop: 14, paddingTop: 13, borderTop: "1px solid rgba(216,138,74,.12)" }}>
              <button onClick={() => set({ qualidadeAberta: !st.qualidadeAberta })} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: 0, border: 0, background: "none", cursor: "pointer" }}>
                <span style={{ font: "800 9.5px/1 Inter", letterSpacing: ".14em", textTransform: "uppercase", color: "#e5b34f" }}>Qualidade</span>
                <span style={{ display: "flex", alignItems: "center", gap: 8, font: "600 10.5px/1 Inter", color: "#8a7a70" }}>{faixaCheia ? "todas" : fmt(st.qMin) + " – " + fmt(st.qMax)}<span style={{ fontSize: 12, color: "#c9a86a" }}>{st.qualidadeAberta ? "−" : "+"}</span></span>
              </button>
              {st.qualidadeAberta && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {qualidades.map((q) => (
                      <button key={q.nome} data-h="qband" onClick={q.aoClicar} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 9px", borderRadius: 7, cursor: "pointer", border: `1px solid ${q.borda}`, background: q.fundo, font: "700 10.5px/1 Inter", color: q.cor }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: q.ponto }} />{q.nome}</button>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, font: "600 9.5px/1 Inter", letterSpacing: ".06em", color: "#7d6d64" }}><span>0,80</span><span>escala de qualidade</span><span>3,60</span></div>
                  <div ref={trilha} onPointerDown={(e) => {
                    if (!trilha.current) return;
                    const r = trilha.current.getBoundingClientRect();
                    const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
                    const v = Math.round((ESCALA.min + p * (ESCALA.max - ESCALA.min)) * 100) / 100;
                    const perto = Math.abs(v - st.qMin) <= Math.abs(v - st.qMax) ? "min" : "max";
                    alvo.current = perto;
                    if (perto === "min") set({ qMin: Math.min(v, st.qMax) }); else set({ qMax: Math.max(v, st.qMin) });
                  }} style={{ position: "relative", height: 16, marginTop: 4, cursor: "pointer", touchAction: "none" }}>
                    <div style={{ position: "absolute", top: 6, left: 0, right: 0, height: 5, borderRadius: 3, background: "linear-gradient(90deg,#5d4c3c 0%,#8a7a70 8%,#7fd9a2 12%,#5b9bd6 20%,#9a6fbb 28%,#e5b34f 36%,#e8654a 50%,#d84f9e 75%,#f2f0e6 100%)" }} />
                    <div style={{ position: "absolute", top: 6, left: 0, height: 5, borderRadius: "3px 0 0 3px", background: "rgba(10,6,5,.72)", width: pct(st.qMin) }} />
                    <div style={{ position: "absolute", top: 6, right: 0, height: 5, borderRadius: "0 3px 3px 0", background: "rgba(10,6,5,.72)", width: (100 - parseFloat(pct(st.qMax))).toFixed(2) + "%" }} />
                    <span onPointerDown={(e) => { e.stopPropagation(); alvo.current = "min"; }} style={{ position: "absolute", top: 1, left: pct(st.qMin), width: 15, height: 15, marginLeft: -7, borderRadius: "50%", border: "2px solid #0a0605", background: "#f0d194", boxShadow: "0 2px 6px rgba(0,0,0,.7)", cursor: "grab", touchAction: "none" }} />
                    <span onPointerDown={(e) => { e.stopPropagation(); alvo.current = "max"; }} style={{ position: "absolute", top: 1, left: pct(st.qMax), width: 15, height: 15, marginLeft: -7, borderRadius: "50%", border: "2px solid #0a0605", background: "#f0d194", boxShadow: "0 2px 6px rgba(0,0,0,.7)", cursor: "grab", touchAction: "none" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 10 }}>
                    <input type="text" value={fmt(st.qMin)} onChange={(e) => { const v = num(e.target.value); if (v !== null) set({ qMin: Math.min(limitar(v), st.qMax) }); }} style={{ ...inputStyle, padding: "8px 11px", textAlign: "center" }} />
                    <input type="text" value={fmt(st.qMax)} onChange={(e) => { const v = num(e.target.value); if (v !== null) set({ qMax: Math.max(limitar(v), st.qMin) }); }} style={{ ...inputStyle, padding: "8px 11px", textAlign: "center" }} />
                  </div>
                </div>
              )}
            </div>

            {/* ATRIBUTOS */}
            <div style={{ marginTop: 14, paddingTop: 13, borderTop: "1px solid rgba(216,138,74,.12)" }}>
              <button onClick={() => set({ avancadoAberto: !st.avancadoAberto })} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: 0, border: 0, background: "none", cursor: "pointer" }}>
                <span style={{ font: "800 9.5px/1 Inter", letterSpacing: ".14em", textTransform: "uppercase", color: "#e5b34f" }}>Atributos do pokémon</span>
                <span style={{ display: "flex", alignItems: "center", gap: 8, font: "600 10.5px/1 Inter", color: "#8a7a70" }}>{(st.nivelMin || st.ivMin || st.tipos.length) ? "ativos" : "opcional"}<span style={{ fontSize: 12, color: "#c9a86a" }}>{st.avancadoAberto ? "−" : "+"}</span></span>
              </button>
              {st.avancadoAberto && (
                <div style={{ marginTop: 11 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={{ font: "600 9.5px/1 Inter", color: "#7d6d64" }}>Nível mín.</span><input type="number" value={st.nivelMin} onChange={(e) => set({ nivelMin: e.target.value })} placeholder="1" style={{ ...inputStyle, padding: "8px 10px" }} /></label>
                    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={{ font: "600 9.5px/1 Inter", color: "#7d6d64" }}>IV total mín.</span><input type="number" value={st.ivMin} onChange={(e) => set({ ivMin: e.target.value })} placeholder="0 / 192" style={{ ...inputStyle, padding: "8px 10px" }} /></label>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "13px 0 8px" }}>
                    <span style={{ font: "600 9.5px/1 Inter", color: "#7d6d64" }}>Tipo elemental</span>
                    <button onClick={() => set({ tipos: [] })} style={{ border: 0, background: "none", padding: 0, cursor: "pointer", font: "700 9.5px/1 Inter", color: st.tipos.length ? "#e5b34f" : "#5d4c3c" }}>{st.tipos.length ? st.tipos.length + " ativos · limpar" : "nenhum"}</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 5 }}>
                    {tiposElementais.map((t) => (
                      <button key={t.nome} data-h="type" onClick={t.aoClicar} title={t.nome} style={{ display: "grid", placeItems: "center", aspectRatio: "1/1", borderRadius: 7, cursor: "pointer", border: `1px solid ${t.borda}`, background: t.fundo }}>
                        <i role="img" aria-label={t.nome} style={{ width: 18, height: 18, display: "block", background: t.iconeBg, backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat", opacity: Number(t.opacidade) }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* LISTAGEM */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", padding: "11px 15px", marginBottom: 14, border: "1px solid rgba(216,138,74,.16)", borderRadius: 11, background: "rgba(20,13,11,.85)" }}>
              <span style={{ fontSize: 13, color: "#a4937e" }}><b style={{ color: "#f7eee7", fontWeight: 700 }}>{anuncios.length}</b> {anuncios.length === 1 ? "anúncio encontrado" : "anúncios encontrados"}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ font: "800 9.5px/1 Inter", letterSpacing: ".14em", textTransform: "uppercase", color: "#7d6d64" }}>Ordenar</span>
                <select value={st.ordem} onChange={(e) => set({ ordem: e.target.value })} style={{ padding: "8px 11px", borderRadius: 8, border: "1px solid rgba(216,138,74,.2)", background: "rgba(10,6,5,.7)", color: "#f7eee7", fontSize: 12.5 }}>
                  <option value="recentes">Mais recentes</option>
                  <option value="menor">Menor preço</option>
                  <option value="maior">Maior preço</option>
                  <option value="qualidade">Maior qualidade</option>
                  <option value="iv">Maior IV</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill,minmax(${largura}px,1fr))`, gap: 14 }}>
              {anuncios.map((ad) => (
                <article key={ad.id} data-h="card" onClick={ad.abrir} style={{ position: "relative", display: "flex", flexDirection: "column", borderRadius: 12, border: "1px solid rgba(216,138,74,.18)", background: "linear-gradient(180deg,#1a1210,#100b09)", overflow: "hidden", cursor: "pointer", transition: "transform .16s ease, border-color .16s ease, box-shadow .16s ease" }}>
                  <span style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: ad.jogoLinha }} />
                  <div style={{ position: "relative", aspectRatio: "1/.86", display: "grid", placeItems: "center", background: ad.brilho }}>
                    <i role="img" aria-label={ad.titulo} style={{ width: "62%", height: "62%", background: ad.spriteBg, backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat", imageRendering: "pixelated", filter: "drop-shadow(0 10px 14px rgba(0,0,0,.75))" }} />
                    <div style={{ position: "absolute", top: 9, left: 9, display: "flex", gap: 5 }}>
                      <span style={{ padding: "4px 8px", borderRadius: 5, border: `1px solid ${ad.plateBorda}`, background: ad.plateFundo, backdropFilter: "blur(3px)", font: "800 9px/1 Inter", letterSpacing: ".12em", textTransform: "uppercase", whiteSpace: "nowrap", color: ad.plateCor }}>{ad.plate}</span>
                      {ad.shiny && <span style={{ padding: "4px 8px", borderRadius: 5, border: "1px solid rgba(126,217,162,.45)", background: "rgba(20,50,36,.7)", backdropFilter: "blur(3px)", font: "800 9px/1 Inter", letterSpacing: ".12em", textTransform: "uppercase", whiteSpace: "nowrap", color: "#a8f0c4" }}>Shiny</span>}
                    </div>
                    {ad.mostraSelo && (
                      <span title={ad.jogoNome} style={{ position: "absolute", top: 8, right: 8, display: "flex", alignItems: "center", gap: 7, height: 40, padding: "0 11px", borderRadius: 9, border: `1px solid ${ad.jogoBorda}`, background: ad.jogoFundo, backdropFilter: "blur(5px)", boxShadow: "0 4px 12px rgba(0,0,0,.5)" }}>
                        <i role="img" aria-label={ad.jogoNome} style={{ flex: "none", width: 34, height: 28, background: ad.jogoLogoBg, backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />
                        <span style={{ font: "800 9px/1.15 Inter", letterSpacing: ".06em", textTransform: "uppercase", whiteSpace: "pre-line", color: ad.jogoCor }}>{ad.jogoSigla}</span>
                      </span>
                    )}
                  </div>
                  <div style={{ padding: "12px 13px 13px", borderTop: "1px solid rgba(216,138,74,.14)" }}>
                    <h3 style={{ margin: 0, font: "700 14.5px/1.25 Inter", color: "#f7eee7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ad.titulo}</h3>
                    <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "#8a7a70" }}>{ad.detalhe}</p>
                    <div style={{ display: "grid", gridTemplateColumns: ad.colunasStats, gap: 1, marginTop: 10, borderRadius: 7, overflow: "hidden", background: "rgba(216,138,74,.14)" }}>
                      {ad.stats.map((s, i) => (
                        <div key={i} style={{ padding: "7px 8px", background: "#150e0c" }}>
                          <div style={{ font: "700 8px/1 Inter", letterSpacing: ".12em", textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: s.corRotulo }}>{s.rotulo}</div>
                          <div style={{ marginTop: 5, font: "700 12.5px/1 Inter", whiteSpace: "nowrap", color: s.cor }}>{s.valor}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 11 }}>
                      {ad.ehDiamond && <img src={A("diamante.png")} alt="Diamonds" style={{ width: 20, height: 20, objectFit: "contain", filter: "drop-shadow(0 0 6px rgba(70,140,255,.45))" }} />}
                      <span style={{ font: "700 19px/1 Cinzel, serif", whiteSpace: "nowrap", color: "#e5b34f" }}>{ad.preco}</span>
                      {ad.negociavel && <span style={{ marginLeft: "auto", flex: "none", padding: "4px 8px", borderRadius: 5, border: "1px solid rgba(216,138,74,.24)", font: "700 9px/1 Inter", letterSpacing: ".06em", whiteSpace: "nowrap", color: "#c9a86a" }}>Propostas</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 11, paddingTop: 10, borderTop: "1px solid rgba(216,138,74,.12)" }}>
                      <span data-h="seller" style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, overflow: "hidden", font: "600 11.5px/1 Inter", whiteSpace: "nowrap", color: "#c9b3a4" }}><span style={{ flex: "none", width: 20, height: 20, borderRadius: "50%", display: "grid", placeItems: "center", background: "linear-gradient(180deg,#3a2213,#1d1109)", border: "1px solid rgba(216,138,74,.3)", font: "700 8.5px/1 Inter", color: "#e5b34f" }}>{ad.iniciais}</span><span>{ad.vendedor}</span></span>
                      <span style={{ flex: "none", fontSize: 10.5, whiteSpace: "nowrap", color: "#7d6d64" }}>{ad.quando}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {anuncios.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "56px 20px", border: "1px dashed rgba(216,138,74,.24)", borderRadius: 12, background: "rgba(20,13,11,.6)", textAlign: "center" }}>
                <span style={{ font: "700 17px/1.2 Cinzel, serif", color: "#f7eee7" }}>Nenhum anúncio com esses filtros</span>
                <p style={{ margin: 0, maxWidth: "38ch", fontSize: 12.5, lineHeight: 1.5, color: "#8a7a70" }}>Tente ampliar a faixa de qualidade ou limpar alguns filtros.</p>
                <button data-h="empty" onClick={limparTudo} style={{ padding: "10px 18px", borderRadius: 8, cursor: "pointer", border: "1px solid rgba(216,138,74,.34)", background: "rgba(229,179,79,.1)", font: "700 11.5px/1 Inter", letterSpacing: ".06em", color: "#f0d194" }}>Limpar filtros</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
