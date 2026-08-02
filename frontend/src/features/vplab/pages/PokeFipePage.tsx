import { useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import { PokemonPicker } from "../components/PokemonPicker";

// "Curva do resultado" e "Tabela por espécie" ficam ocultas por enquanto (a pedido).
const SHOW_EXTRA_SECTIONS: boolean = false;

const sprite = (n: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${n}.png`;
const brl = (n: number) => "R$ " + Number(n || 0).toFixed(2).replace(".", ",");
const num = (n: number) => Math.round(n || 0).toLocaleString("pt-BR");

const P = { dd: 0.12, perLevel: 0.03, levelCut: 400, perLevelAfter: 0.08, breedFloor: 5, defaultBase: 4, quickFactor: 0.85, listFactor: 1.10 };

interface Species { slug: string; nome: string; base: number | null; confidence: string; origin: string; note: string; dexNo: number }
const SPECIES: Species[] = ([
  ["abra", "Abra", 5, "Média", "Calibrada por mercado", "2 anúncios comparáveis em nível baixo", 63],
  ["alakazam", "Alakazam", 6, "Média", "Calibrada por mercado", "2 anúncios; valores normalizados consistentes", 65],
  ["blastoise", "Blastoise", 5.5, "Alta", "Calibrada por mercado", "3 referências, incluindo 2 vendas", 9],
  ["charizard", "Charizard", 4.5, "Alta", "Calibrada por mercado", "5 referências, incluindo venda confirmada", 6],
  ["charmander", "Charmander", 4, "Baixa", "Provisória", "Somente anúncio de breed; piso de breed é aplicado", 4],
  ["ditto-shiny", "Ditto (Shiny)", null, "Manual", "Manual / fora do modelo", "Shiny deve ser avaliado em tabela separada", 132],
  ["dragonite", "Dragonite", 5, "Baixa", "Provisória", "Preço informado sem level, IV ou multiplicador", 149],
  ["electabuzz", "Electabuzz", 4.5, "Baixa", "Provisória", "Apenas anúncio level 507; não permite isolar a base", 125],
  ["flareon", "Flareon", 5.5, "Baixa", "Provisória", "Uma referência de anúncio", 136],
  ["gastly", "Gastly", 3, "Baixa", "Provisória", "Sem preço; inferência conservadora pela linha evolutiva", 92],
  ["gengar", "Gengar", 5.5, "Alta", "Calibrada por mercado", "5 referências, incluindo venda confirmada", 94],
  ["geodude", "Geodude", 4, "Média", "Calibrada por mercado", "Referência em real e referência em diamantes", 74],
  ["golem", "Golem", 4.5, "Alta", "Calibrada por mercado", "5 referências, incluindo venda confirmada", 76],
  ["granbull", "Granbull", 4, "Baixa", "Provisória", "Preço visível, mas multiplicador encoberto", 210],
  ["grimer", "Grimer", 2.5, "Baixa", "Provisória", "Sem preço; base provisória conservadora", 88],
  ["growlithe", "Growlithe", 6, "Baixa", "Provisória", "Uma referência; anúncio pode conter prêmio da espécie", 58],
  ["kadabra", "Kadabra", 4.5, "Baixa", "Provisória", "Sem preço; inferência pela linha do Alakazam", 64],
  ["kakuna", "Kakuna", 1.5, "Baixa", "Provisória", "Somente anúncio de breed; piso de breed é aplicado", 14],
  ["lapras", "Lapras", 4, "Baixa", "Provisória", "Preço apenas em DD e sem level/multiplicador", 131],
  ["magmar", "Magmar", 4, "Baixa", "Provisória", "Preço apenas em DD e sem level/multiplicador", 126],
  ["marowak", "Marowak", 4, "Baixa", "Provisória", "Somente anúncio de level alto", 105],
  ["oddish", "Oddish", 2, "Baixa", "Provisória", "Sem preço; base provisória conservadora", 43],
  ["paras", "Paras", 2, "Baixa", "Provisória", "Somente anúncio de breed; piso de breed é aplicado", 46],
  ["parasect", "Parasect", 3.5, "Baixa", "Provisória", "Sem preço; base provisória", 47],
  ["pichu", "Pichu", 4, "Baixa", "Provisória", "Uma referência level 1", 172],
  ["pidgey", "Pidgey", 1.5, "Baixa", "Provisória", "Uma referência level 1", 16],
  ["poliwrath", "Poliwrath", 4.5, "Baixa", "Provisória", "Somente anúncio de level alto", 62],
  ["primeape", "Primeape", 4, "Baixa", "Provisória", "Somente anúncio de level alto", 57],
  ["rattata", "Rattata", 1.5, "Baixa", "Provisória", "Somente anúncio de breed; piso de breed é aplicado", 19],
  ["rhydon", "Rhydon", 4, "Baixa", "Provisória", "Preço apenas em DD e sem level/multiplicador", 112],
  ["scizor", "Scizor", 5, "Baixa", "Provisória", "Preço informado sem level, IV ou multiplicador", 212],
  ["shellder", "Shellder", 1, "Baixa", "Provisória", "Uma referência de preço em nível baixo", 90],
  ["spearow", "Spearow", 1.5, "Baixa", "Provisória", "Somente anúncio de breed; piso de breed é aplicado", 21],
  ["tentacool", "Tentacool", 2.5, "Baixa", "Provisória", "Sem preço; base provisória conservadora", 72],
  ["victreebel", "Victreebel", 5.5, "Média", "Calibrada por mercado", "Venda confirmada", 71],
  ["vileplume", "Vileplume", 3.5, "Baixa", "Provisória", "Sem preço; base provisória", 45],
  ["weedle", "Weedle", 1.5, "Baixa", "Provisória", "Somente anúncio de breed; piso de breed é aplicado", 13],
] as Array<[string, string, number | null, string, string, string, number]>).map(([slug, nome, base, confidence, origin, note, dexNo]) => ({ slug, nome, base, confidence, origin, note, dexNo }));

interface Band { from: number; to: number; bonus: number; read: string }
const BANDS: Band[] = ([
  [0, 169, -2.5, "Resultado muito baixo"], [170, 189, -2.5, "Penalidade relevante"], [190, 199, 0, "Faixa neutra"],
  [200, 209, 0.3, "Bônus leve"], [210, 219, 0.6, "Bônus leve"], [220, 229, 0.9, "Bônus moderado"],
  [230, 239, 1.2, "Bônus moderado"], [240, 249, 1.5, "Bônus bom"], [250, 259, 1.8, "Bônus bom"],
  [260, 269, 2.1, "Bônus alto"], [270, 279, 2.4, "Bônus alto"], [280, 289, 2.7, "Bônus alto"],
  [290, 309, 3, "Bônus muito alto"], [310, 329, 3.5, "Bônus muito alto"], [330, 349, 4, "Bônus excepcional"],
  [350, 999, 4.5, "Teto provisório"],
] as Array<[number, number, number, string]>).map(([from, to, bonus, read]) => ({ from, to, bonus, read }));

const CONF_COLOR: Record<string, string> = { Alta: "#4fc47a", "Média": "#e5b34f", Baixa: "#ff6b55", Manual: "#a86fd8" };
const QTIERS: Array<[number, string]> = [[.8, "Fraca"], [1, "Comum"], [1.1, "Incomum"], [1.3, "Rara"], [1.5, "Épica"], [1.7, "Lendária"], [2, "Mítica"], [3, "Anciã"], [4, "Divina"]];
const QCOLOR: Record<string, string> = { "Fraca": "#8d8d9c", "Comum": "#b5a196", "Incomum": "#4fc47a", "Rara": "#5b9bd8", "Épica": "#a86fd8", "Lendária": "#e5b34f", "Mítica": "#ff8f7d", "Anciã": "#83b9ff", "Divina": "#4fd8b0" };
const tierName = (q: number) => ([...QTIERS].reverse().find(([m]) => q >= m - 1e-9) || QTIERS[0])[1];
const bandFor = (result: number) => BANDS.slice().reverse().find((b) => Math.floor(result) >= b.from) || BANDS[0];
const levelValue = (lvl: number) => {
  const L = Math.max(1, lvl);
  const raw = L <= P.levelCut ? (L - 1) * P.perLevel : (P.levelCut - 1) * P.perLevel + (L - P.levelCut) * P.perLevelAfter;
  return Math.round(raw * 100) / 100;
};

const panel: CSSProperties = {
  background: "linear-gradient(160deg,rgba(30,18,16,.95),rgba(13,8,7,.95))",
  border: "1px solid rgba(216,138,74,.18)", borderRadius: 22, boxShadow: "0 10px 30px rgba(0,0,0,.35)",
};
const bgIcon = (url: string): CSSProperties => ({ backgroundImage: `url(${url})`, backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center" });
const uLabel: CSSProperties = { fontSize: 10, letterSpacing: ".09em", textTransform: "uppercase", color: "#b5a196", fontWeight: 700 };
const eyebrow: CSSProperties = { display: "block", color: "#d98350", textTransform: "uppercase", letterSpacing: ".22em", fontSize: 11, fontWeight: 800, marginBottom: 8 };
const cap: CSSProperties = { fontSize: 9.5, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "#7d6d64" };

const SCOPED_CSS = `
.fipev2 .mono{font-variant-numeric:tabular-nums;font-family:ui-monospace,"Cascadia Code",Consolas,monospace}
.fipev2 input,.fipev2 select{font:inherit;color:#f7eee7;width:100%;min-width:0;padding:11px 13px;border:1px solid rgba(216,138,74,.18);border-radius:10px;background:#0b0706;transition:border-color .15s,box-shadow .15s}
.fipev2 input:focus,.fipev2 select:focus{outline:none;border-color:#e5b34f;box-shadow:0 0 0 3px rgba(229,179,79,.09)}
.fipev2 [data-hover=action]:hover{color:#fff4d4}
`;

export function PokeFipePage() {
  const [params] = useSearchParams();
  const initialSlug = SPECIES.some((s) => s.slug === params.get("p")) ? params.get("p")! : "charizard";
  const [slug, setSlug] = useState(initialSlug);
  const [level, setLevel] = useState<string | number>(params.get("level") ?? 300);
  const [iv, setIv] = useState<string | number>(params.get("iv") ?? 120);
  const [mult, setMult] = useState<string | number>(params.get("multiplier") ?? 1.8);
  const [segment, setSegment] = useState<"Geral" | "Breed">("Geral");
  const [filter, setFilter] = useState("Todas");
  const [actionNote, setActionNote] = useState("");

  const evaluate = () => {
    const sp = SPECIES.find((s) => s.slug === slug) || SPECIES[0];
    const lvl = Math.max(1, Math.floor(+level || 1));
    const nIv = Math.max(0, +iv || 0);
    const nMult = Math.max(0, +mult || 0);
    const result = nIv * nMult;
    const band = bandFor(result);
    const base = sp.base;
    const levels = levelValue(lvl);
    if (base === null) return { sp, level: lvl, iv: nIv, mult: nMult, result, band, manual: true as const };
    const breedFloor = segment === "Breed" && lvl <= 20 && nIv >= 150 ? P.breedFloor : 0;
    const fair = Math.round(Math.max(base + band.bonus + levels, breedFloor) * 100) / 100;
    return {
      sp, level: lvl, iv: nIv, mult: nMult, result, band, base, levels, breedFloor, manual: false as const, fair,
      quick: Math.round(fair * P.quickFactor * 100) / 100, list: Math.round(fair * P.listFactor * 100) / 100, dd: Math.round(fair / P.dd),
    };
  };
  const e = evaluate();

  const exportPng = async () => {
    if (e.manual) { setActionNote("Shiny é avaliado manualmente — nada a exportar."); return; }
    const W = 900, H = 560, cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const g = cv.getContext("2d"); if (!g) return;
    const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, "#1e1210"); bg.addColorStop(1, "#0a0605");
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(216,138,74,.35)"; g.lineWidth = 3; g.strokeRect(6, 6, W - 12, H - 12);
    g.fillStyle = "#d98350"; g.font = "800 16px Inter, sans-serif"; g.fillText("VPLAB · POKEFIPE 2.0", 44, 56);
    g.fillStyle = "#f7eee7"; g.font = "800 40px Cinzel, Georgia, serif"; g.fillText(e.sp.nome, 44, 104);
    g.fillStyle = "#7d6d64"; g.font = "500 15px Inter, sans-serif";
    g.fillText(`Nível ${num(e.level)} · IV ${num(e.iv)} · multiplicador ${e.mult} · resultado ${num(e.result)}`, 44, 132);
    const img = await new Promise<HTMLImageElement | null>((res) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = () => res(null); i.src = sprite(e.sp.dexNo); });
    if (img) g.drawImage(img, W - 190, 46, 128, 128);
    const cards: Array<[string, string, string]> = [["VENDA RÁPIDA", brl(e.quick), "#b5a196"], ["VALOR JUSTO", brl(e.fair), "#e5b34f"], ["ANUNCIAR", brl(e.list), "#4fc47a"]];
    cards.forEach(([label, value, color], i) => {
      const x = 44 + i * 272;
      g.fillStyle = i === 1 ? "rgba(229,179,79,.10)" : "rgba(255,255,255,.03)"; g.fillRect(x, 176, 252, 116);
      g.strokeStyle = i === 1 ? "rgba(229,179,79,.4)" : "rgba(216,138,74,.2)"; g.lineWidth = 1.5; g.strokeRect(x, 176, 252, 116);
      g.fillStyle = "#7d6d64"; g.font = "800 12px Inter, sans-serif"; g.fillText(label, x + 18, 206);
      g.fillStyle = color; g.font = "700 34px ui-monospace, monospace"; g.fillText(value, x + 18, 254);
    });
    const rows: Array<[string, string]> = [
      ["Base da espécie", brl(e.base)],
      ["Bônus do resultado IV × mult.", (e.band.bonus >= 0 ? "+ " : "− ") + brl(Math.abs(e.band.bonus)) + "  (" + e.band.read.toLowerCase() + ")"],
      ["Valor dos levels", "+ " + brl(e.levels)],
      ["Equivalente em diamonds", num(e.dd) + " DD"],
      ["Confiança da base", e.sp.confidence],
    ];
    g.font = "600 15px Inter, sans-serif";
    rows.forEach(([k, v], i) => {
      const y = 340 + i * 36;
      g.fillStyle = "#b5a196"; g.fillText(k, 44, y);
      g.fillStyle = "#f7eee7"; g.font = "700 16px ui-monospace, monospace"; g.fillText(v, 520, y); g.font = "600 15px Inter, sans-serif";
    });
    g.fillStyle = "#7d6d64"; g.font = "500 12px Inter, sans-serif";
    g.fillText("Base de mercado 28/07/2026 · erro médio ± R$ 0,29 · vplab · twitch.tv/vpertsz", 44, H - 28);
    const a = document.createElement("a"); a.download = `pokefipe-${e.sp.slug}.png`; a.href = cv.toDataURL("image/png"); a.click();
    setActionNote("Imagem gerada — confira os downloads.");
  };

  const copyText = () => {
    if (e.manual) { setActionNote("Shiny é avaliado manualmente."); return; }
    const txt = `${e.sp.nome} · Nv ${num(e.level)} · IV ${num(e.iv)} · mult ${e.mult}\n`
      + `Valor justo ${brl(e.fair)} (${num(e.dd)} DD)\n`
      + `Aceito a partir de ${brl(e.quick)} · anunciado por ${brl(e.list)}\n`
      + `Avaliado no VPLab · PokeFipe 2.0`;
    if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(() => { });
    setActionNote("Texto do anúncio copiado.");
  };

  const counts: Record<string, number> = { Todas: SPECIES.length };
  ["Alta", "Média", "Baixa", "Manual"].forEach((c) => { counts[c] = SPECIES.filter((s) => s.confidence === c).length; });
  const visible = filter === "Todas" ? SPECIES : SPECIES.filter((s) => s.confidence === filter);

  const qTier = tierName(+mult || 0);
  const qColor = QCOLOR[qTier] || "#b5a196";
  const confColor = CONF_COLOR[e.sp.confidence];

  const prices = e.manual
    ? [
      { key: 1, label: "Venda rápida", value: "—", note: "depende da negociação", color: "#7d6d64", tone: "#7d6d64", size: "26px", edge: "rgba(216,138,74,.16)", bg: "rgba(0,0,0,.26)" },
      { key: 2, label: "Valor justo", value: "Manual", note: "shiny sai da curva de mercado", color: "#a86fd8", tone: "#a86fd8", size: "26px", edge: "rgba(168,111,216,.4)", bg: "rgba(168,111,216,.1)" },
      { key: 3, label: "Anunciar", value: "—", note: "use tabela separada", color: "#7d6d64", tone: "#7d6d64", size: "26px", edge: "rgba(216,138,74,.16)", bg: "rgba(0,0,0,.26)" },
    ]
    : [
      { key: 1, label: "Venda rápida", value: brl(e.quick), note: "85% — liquidez imediata", color: "#f7eee7", tone: "#7d6d64", size: "24px", edge: "rgba(216,138,74,.18)", bg: "rgba(0,0,0,.26)" },
      { key: 2, label: "Valor justo", value: brl(e.fair), note: "referência central da negociação", color: "#e5b34f", tone: "#d98350", size: "30px", edge: "rgba(229,179,79,.42)", bg: "linear-gradient(160deg,rgba(229,179,79,.12),rgba(13,8,7,.55))" },
      { key: 3, label: "Anunciar", value: brl(e.list), note: "110% — margem de negociação", color: "#4fc47a", tone: "#7d6d64", size: "24px", edge: "rgba(79,196,122,.3)", bg: "rgba(79,196,122,.07)" },
    ];

  const breakdown = e.manual
    ? [{ key: 1, label: "Sem base no modelo", note: "Shiny e itens raros não entram na curva por espécie.", value: "—", color: "#7d6d64", bg: "transparent" }]
    : [
      { key: 1, label: "Base da espécie", note: `${e.sp.origin} · confiança ${e.sp.confidence.toLowerCase()}`, value: brl(e.base), color: "#f7eee7", bg: "transparent" },
      { key: 2, label: `Bônus do resultado (${num(e.result)})`, note: `${e.band.read} · faixa ${e.band.to === 999 ? e.band.from + "+" : e.band.from + "–" + e.band.to}`, value: (e.band.bonus > 0 ? "+ " : e.band.bonus < 0 ? "− " : "") + brl(Math.abs(e.band.bonus)), color: e.band.bonus > 0 ? "#4fc47a" : e.band.bonus < 0 ? "#ff6b55" : "#b5a196", bg: "rgba(255,255,255,.015)" },
      { key: 3, label: "Valor dos levels", note: e.level > P.levelCut ? `399 levels a R$ 0,03 + ${num(e.level - P.levelCut)} a R$ 0,08` : `${num(Math.max(0, e.level - 1))} levels a R$ 0,03`, value: "+ " + brl(e.levels), color: "#f7eee7", bg: "transparent" },
      ...(e.breedFloor ? [{ key: 4, label: "Piso de breed aplicado", note: "level até 20 com IV a partir de 150 não vale menos que R$ 5,00", value: brl(P.breedFloor), color: "#e5b34f", bg: "rgba(229,179,79,.06)" }] : []),
      { key: 5, label: "Valor justo", note: "soma final arredondada", value: brl(e.fair), color: "#e5b34f", bg: "rgba(229,179,79,.06)" },
    ];

  const fields = [
    { key: "level", label: "Level", value: level, hint: "R$ 0,03/level até 400", set: setLevel },
    { key: "iv", label: "IV total", value: iv, hint: "como aparece no card", set: setIv },
    { key: "mult", label: "Multiplicador", value: mult, hint: "Quality do card · ex.: 1,80", set: setMult },
  ];

  return (
    <main className="fipev2" style={{ padding: "26px 0 90px" }}>
      <style>{SCOPED_CSS}</style>
      <div style={{ width: "min(1200px,calc(100% - 44px))", marginInline: "auto", display: "grid", gap: 18 }}>

        {/* ---- Avaliação ---- */}
        <section style={{ ...panel, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18, flexWrap: "wrap", marginBottom: 18 }}>
            <div>
              <span style={eyebrow}>PokeFipe · modelo 2.0</span>
              <h2 style={{ fontFamily: "Cinzel,serif", fontSize: 21, margin: "0 0 4px" }}>Quanto vale esse Pokémon hoje?</h2>
              <p style={{ color: "#b5a196", fontSize: 13, margin: 0, maxWidth: 700 }}>Base por espécie calibrada com o mercado + bônus pelo resultado <b style={{ color: "#f7eee7" }}>IV × multiplicador</b> + valor dos levels. Você recebe as três referências que importam numa negociação: <b style={{ color: "#f7eee7" }}>venda rápida</b>, <b style={{ color: "#f7eee7" }}>valor justo</b> e <b style={{ color: "#f7eee7" }}>preço para anunciar</b>.</p>
            </div>
            <div style={{ display: "grid", gap: 6, padding: "12px 14px", border: "1px solid rgba(79,196,122,.28)", borderRadius: 14, background: "rgba(79,196,122,.07)", minWidth: 210 }}>
              <span style={cap}>Precisão do modelo</span>
              <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <b className="mono" style={{ fontSize: 19, color: "#4fc47a" }}>± R$ 0,29</b>
                <s className="mono" style={{ fontSize: 12, color: "#7d6d64" }}>R$ 10,47</s>
              </span>
              <small style={{ fontSize: 10.5, color: "#b5a196", lineHeight: 1.4 }}>Erro médio nas 6 vendas confirmadas — a tabela antiga errava 66,9%, a 2.0 erra 2,0%.</small>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,.92fr) minmax(0,1.08fr)", gap: 16, alignItems: "start" }}>
            {/* Entradas */}
            <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
              <div style={uLabel}>Entradas</div>
              <div style={{ display: "grid", gridTemplateColumns: "104px minmax(0,1fr)", gap: 13, alignItems: "center" }}>
                <div style={{ position: "relative", width: 104, height: 104, borderRadius: 16, border: "1px solid rgba(229,179,79,.28)", background: "radial-gradient(70% 70% at 50% 35%,rgba(194,54,41,.22),rgba(0,0,0,.55))" }}>
                  <span style={{ position: "absolute", inset: 5, ...bgIcon(sprite(e.sp.dexNo)), imageRendering: "pixelated", filter: "drop-shadow(0 6px 12px rgba(0,0,0,.6))" }} />
                </div>
                <div style={{ display: "grid", gap: 9, minWidth: 0 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
                    <span style={uLabel}>Espécie</span>
                    <PokemonPicker ariaLabel="Buscar espécie" options={SPECIES.map((s) => ({ slug: s.slug, name: s.nome, dexNo: s.dexNo }))} value={slug} onSelect={(sl) => { setSlug(sl); setActionNote(""); }} />
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 11px", borderRadius: 99, border: `1px solid ${qColor}55`, background: `${qColor}14`, fontSize: 10.5, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: qColor }}>Quality {qTier}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 11px", borderRadius: 99, border: `1px solid ${confColor}55`, background: `${confColor}14`, fontSize: 10.5, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: confColor }}>Confiança {e.sp.confidence}</span>
                    <small style={{ fontSize: 11, color: "#7d6d64" }}>{e.sp.origin}</small>
                  </div>
                  <small style={{ fontSize: 10.5, color: "#b5a196", lineHeight: 1.4 }}>{(+mult || 0) > 1.8 + 1e-9 ? "acima do teto de captura selvagem — só shiny ou breeding chega aqui, e o mercado paga prêmio por isso" : "dentro da faixa de captura selvagem (teto 1,80)"}</small>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 9 }}>
                {fields.map((f) => (
                  <label key={f.key} style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
                    <span style={uLabel}>{f.label}</span>
                    <input className="mono" type="number" value={f.value} onChange={(ev) => { f.set(ev.target.value); setActionNote(""); }} style={{ textAlign: "center" }} />
                    <small style={{ fontSize: 9.5, color: "#7d6d64" }}>{f.hint}</small>
                  </label>
                ))}
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
                <span style={uLabel}>Segmento</span>
                <div style={{ display: "flex", gap: 7 }}>
                  {(["Geral", "Breed"] as const).map((s) => {
                    const on = segment === s;
                    return <span key={s} onClick={() => { setSegment(s); setActionNote(""); }} style={{ flex: 1, textAlign: "center", padding: "10px 12px", borderRadius: 10, border: `1px solid ${on ? "rgba(226,75,53,.45)" : "rgba(216,138,74,.18)"}`, background: on ? "rgba(226,75,53,.2)" : "rgba(255,255,255,.03)", color: on ? "#fff" : "#b5a196", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>{s}</span>;
                  })}
                </div>
                <small style={{ fontSize: 9.5, color: "#7d6d64" }}>Breed aplica piso de R$ 5,00 em Pokémon até o level 20 com IV a partir de 150.</small>
              </label>

              {e.manual && (
                <div style={{ padding: 13, border: "1px solid rgba(168,111,216,.35)", borderRadius: 13, background: "rgba(168,111,216,.09)", fontSize: 12, color: "#e0d0f0", lineHeight: 1.5 }}>
                  <b style={{ color: "#fff" }}>Fora do modelo.</b> Shiny e itens raros não seguem a curva de mercado — precisam de avaliação manual, em tabela separada.
                </div>
              )}

              <div style={{ padding: 13, border: "1px solid rgba(216,138,74,.16)", borderRadius: 13, background: "rgba(0,0,0,.26)" }}>
                <div style={{ ...cap, marginBottom: 7 }}>Nota da base desta espécie</div>
                <p style={{ margin: 0, fontSize: 11.5, color: "#b5a196", lineHeight: 1.5 }}>{e.sp.note}</p>
              </div>
            </div>

            {/* Avaliação */}
            <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                <div style={uLabel}>Avaliação</div>
                <div style={{ fontSize: 11, color: "#7d6d64" }}>{e.manual ? "fora do modelo" : `${e.sp.nome} · resultado ${num(e.result)}`}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10 }}>
                {prices.map((p) => (
                  <div key={p.key} style={{ padding: "15px 14px", border: `1px solid ${p.edge}`, borderRadius: 16, background: p.bg, textAlign: "center" }}>
                    <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".11em", textTransform: "uppercase", color: p.tone }}>{p.label}</div>
                    <div className="mono" style={{ marginTop: 7, fontSize: p.size, fontWeight: 700, color: p.color, lineHeight: 1.1 }}>{p.value}</div>
                    <div style={{ marginTop: 5, fontSize: 10.5, color: "#b5a196", lineHeight: 1.35 }}>{p.note}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "13px 15px", border: "1px solid rgba(229,179,79,.28)", borderRadius: 14, background: "linear-gradient(160deg,rgba(229,179,79,.09),rgba(13,8,7,.5))" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <span style={{ width: 34, height: 34, ...bgIcon("/assets/diamante-pokeidle-oficial.png") }} />
                  <div style={{ display: "grid", gap: 2 }}>
                    <span style={cap}>Equivalente em diamonds</span>
                    <b className="mono" style={{ fontSize: 19, color: "#e5b34f" }}>{e.manual ? "—" : num(e.dd)} DD</b>
                  </div>
                </div>
              </div>

              <div style={{ border: "1px solid rgba(216,138,74,.16)", borderRadius: 16, background: "rgba(0,0,0,.24)", overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, padding: "12px 14px", borderBottom: "1px solid rgba(216,138,74,.12)" }}>
                  <span style={cap}>De onde vem o valor justo</span>
                  <span className="mono" style={{ fontSize: 11, color: "#7d6d64" }}>{e.manual ? "avaliação manual" : "base + bônus do resultado + levels"}</span>
                </div>
                {breakdown.map((b) => (
                  <div key={b.key} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 12, alignItems: "center", padding: "11px 14px", borderBottom: "1px solid rgba(216,138,74,.07)", background: b.bg }}>
                    <span style={{ display: "grid", gap: 2, minWidth: 0 }}>
                      <b style={{ fontSize: 12, color: "#f7eee7" }}>{b.label}</b>
                      <small style={{ fontSize: 10.5, color: "#b5a196", lineHeight: 1.4 }}>{b.note}</small>
                    </span>
                    <b className="mono" style={{ fontSize: 14, color: b.color, whiteSpace: "nowrap" }}>{b.value}</b>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
                <span data-hover="action" onClick={exportPng} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 16px", borderRadius: 11, border: "1px solid rgba(229,179,79,.32)", background: "rgba(229,179,79,.08)", color: "#e5b34f", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>↓ Exportar avaliação</span>
                <span data-hover="action" onClick={copyText} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 16px", borderRadius: 11, border: "1px solid rgba(216,138,74,.2)", background: "rgba(255,255,255,.03)", color: "#b5a196", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>⧉ Copiar texto do anúncio</span>
                <span style={{ alignSelf: "center", fontSize: 11, color: "#7d6d64" }}>{actionNote}</span>
              </div>
            </div>
          </div>
        </section>

        {SHOW_EXTRA_SECTIONS && (<>
        {/* ---- Curva do resultado ---- */}
        <section style={{ ...panel, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <span style={eyebrow}>Curva do resultado</span>
              <h2 style={{ fontFamily: "Cinzel,serif", fontSize: 20, margin: "0 0 4px" }}>O que o IV × multiplicador faz com o preço</h2>
              <p style={{ color: "#b5a196", fontSize: 13, margin: 0, maxWidth: 640 }}>Abaixo de 190 o resultado <b style={{ color: "#ff6b55" }}>derruba</b> o valor; de 190 a 199 é neutro; a partir de 200 começa a somar. Sua faixa atual está destacada.</p>
            </div>
            <div style={{ display: "grid", gap: 3, textAlign: "right" }}>
              <span style={cap}>Seu resultado</span>
              <b className="mono" style={{ fontSize: 22, color: "#e5b34f" }}>{num(e.result)}</b>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(112px,1fr))", gap: 7 }}>
            {BANDS.map((b) => {
              const active = b === e.band;
              const positive = b.bonus > 0, negative = b.bonus < 0;
              const color = negative ? "#ff6b55" : positive ? "#4fc47a" : "#b5a196";
              const bonusLabel = (b.bonus > 0 ? "+" : b.bonus < 0 ? "−" : "") + brl(Math.abs(b.bonus)).replace("R$ ", "R$");
              return (
                <div key={b.from} style={{ padding: "10px 11px", border: `1px solid ${active ? "rgba(229,179,79,.5)" : "rgba(216,138,74,.14)"}`, borderRadius: 11, background: active ? "rgba(229,179,79,.10)" : "rgba(0,0,0,.24)" }}>
                  <div className="mono" style={{ fontSize: 10.5, color: active ? "#e5b34f" : "#7d6d64", fontWeight: 700 }}>{b.to === 999 ? `${b.from}+` : `${b.from}–${b.to}`}</div>
                  <div className="mono" style={{ marginTop: 4, fontSize: 15, fontWeight: 700, color }}>{bonusLabel}</div>
                  <div style={{ marginTop: 3, fontSize: 9.5, color: "#7d6d64", lineHeight: 1.3 }}>{b.read}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ---- Tabela por espécie ---- */}
        <section style={{ ...panel, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <span style={eyebrow}>Base de mercado · 28/07/2026</span>
              <h2 style={{ fontFamily: "Cinzel,serif", fontSize: 20, margin: "0 0 4px" }}>Tabela por espécie e nível de confiança</h2>
              <p style={{ color: "#b5a196", fontSize: 13, margin: 0, maxWidth: 660 }}>Base <b style={{ color: "#4fc47a" }}>Alta</b> tem venda confirmada; <b style={{ color: "#e5b34f" }}>Média</b> tem anúncios comparáveis; <b style={{ color: "#ff6b55" }}>Baixa</b> é provisória e deve ser revisada quando aparecer venda real.</p>
            </div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {["Todas", "Alta", "Média", "Baixa", "Manual"].map((label) => {
                const on = filter === label;
                return <span key={label} onClick={() => setFilter(label)} style={{ padding: "8px 13px", borderRadius: 99, border: `1px solid ${on ? "rgba(226,75,53,.45)" : "rgba(216,138,74,.18)"}`, background: on ? "rgba(226,75,53,.2)" : "rgba(255,255,255,.03)", color: on ? "#fff" : "#b5a196", fontSize: 11.5, fontWeight: 800, cursor: "pointer" }}>{label} <span className="mono" style={{ opacity: .7 }}>{counts[label]}</span></span>;
              })}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(228px,1fr))", gap: 9 }}>
            {visible.map((s) => (
              <div key={s.slug} onClick={() => { setSlug(s.slug); setActionNote(""); }} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", border: `1px solid ${s.slug === slug ? "rgba(229,179,79,.45)" : "rgba(216,138,74,.14)"}`, borderRadius: 12, background: s.slug === slug ? "rgba(229,179,79,.08)" : "rgba(0,0,0,.24)", cursor: "pointer" }}>
                <span style={{ width: 44, height: 44, flex: "0 0 44px", borderRadius: 11, border: "1px solid rgba(216,138,74,.16)", backgroundColor: "rgba(0,0,0,.34)", backgroundImage: `url(${sprite(s.dexNo)})`, backgroundSize: "78%", backgroundRepeat: "no-repeat", backgroundPosition: "center", imageRendering: "pixelated" }} />
                <span style={{ display: "grid", gap: 2, minWidth: 0, flex: 1 }}>
                  <b style={{ fontSize: 12.5, color: "#f7eee7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.nome}</b>
                  <small style={{ fontSize: 10, color: CONF_COLOR[s.confidence], fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>{s.confidence}</small>
                </span>
                <b className="mono" style={{ fontSize: 13.5, color: "#e5b34f", whiteSpace: "nowrap" }}>{s.base === null ? "manual" : brl(s.base)}</b>
              </div>
            ))}
          </div>
          <p style={{ margin: "14px 0 0", color: "#7d6d64", fontSize: 11, lineHeight: 1.6 }}>Parâmetros gerais: R$ 0,12 por diamond · R$ 0,03 por level até o 400 e R$ 0,08 por level acima · base padrão R$ 4,00 quando a espécie não tem referência · venda rápida 85% e anúncio 110% do valor justo. Anúncio não vendido não é preço de mercado — vendas confirmadas têm prioridade na próxima calibragem.</p>
        </section>
        </>)}
      </div>
    </main>
  );
}
