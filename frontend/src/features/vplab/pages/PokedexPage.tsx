import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { loadPokemonCatalog, type PokemonDexEntry } from "../services/ivCalculator";

const T: Record<string, string> = {
  normal: "Normal", fire: "Fogo", water: "Água", electric: "Elétrico", grass: "Planta", ice: "Gelo",
  fighting: "Lutador", poison: "Veneno", ground: "Terra", flying: "Voador", psychic: "Psíquico", bug: "Inseto",
  rock: "Pedra", ghost: "Fantasma", dragon: "Dragão", dark: "Sombrio", steel: "Aço", fairy: "Fada",
};
const TI = (k: string) => `/assets/vplab/route/types-v2/${k}.png`;
const AI = (k: string) => `/assets/vplab/route/alerts/${k}.png`;
const CHART: Record<string, Record<string, number>> = {
  normal: { rock: .5, ghost: 0, steel: .5 },
  fire: { fire: .5, water: .5, grass: 2, ice: 2, bug: 2, rock: .5, dragon: .5, steel: 2 },
  water: { fire: 2, water: .5, grass: .5, ground: 2, rock: 2, dragon: .5 },
  electric: { water: 2, electric: .5, grass: .5, ground: 0, flying: 2, dragon: .5 },
  grass: { fire: .5, water: 2, grass: .5, poison: .5, ground: 2, flying: .5, bug: .5, rock: 2, dragon: .5, steel: .5 },
  ice: { fire: .5, water: .5, grass: 2, ice: .5, ground: 2, flying: 2, dragon: 2, steel: .5 },
  fighting: { normal: 2, ice: 2, poison: .5, flying: .5, psychic: .5, bug: .5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: .5 },
  poison: { grass: 2, poison: .5, ground: .5, rock: .5, ghost: .5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: .5, poison: 2, flying: 0, bug: .5, rock: 2, steel: 2 },
  flying: { electric: .5, grass: 2, fighting: 2, bug: 2, rock: .5, steel: .5 },
  psychic: { fighting: 2, poison: 2, psychic: .5, dark: 0, steel: .5 },
  bug: { fire: .5, grass: 2, fighting: .5, poison: .5, flying: .5, psychic: 2, ghost: .5, dark: 2, steel: .5, fairy: .5 },
  rock: { fire: 2, ice: 2, fighting: .5, ground: .5, flying: 2, bug: 2, steel: .5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: .5 },
  dragon: { dragon: 2, steel: .5, fairy: 0 },
  dark: { fighting: .5, psychic: 2, ghost: 2, dark: .5, fairy: .5 },
  steel: { fire: .5, water: .5, electric: .5, ice: 2, rock: 2, steel: .5, fairy: 2 },
  fairy: { fire: .5, fighting: 2, poison: .5, dragon: 2, dark: 2, steel: .5 },
};
const RARITY: Record<string, string> = { "Comum": "#b5a196", "Incomum": "#4fc47a", "Raro": "#5b9bd8", "Épico": "#a86fd8", "Lendário": "#e5b34f", "Mítico": "#ff8f7d" };
const STAT = ["HP", "Ataque", "Defesa", "Atq. Esp.", "Def. Esp.", "Velocid."];
const ACTION_ICONS = { avaliar: "/assets/vplab/header/evaluate-iv.webp", rota: "/assets/vplab/header/map.png", fipe: "/assets/vplab/header/pokefipe.webp" };

const num = (n: number) => Math.round(n || 0).toLocaleString("pt-BR");
const sprite = (n: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${n}.png`;
const eff = (atk: string, defs: string[]) => defs.reduce((m, d) => m * (CHART[atk] && CHART[atk][d] !== undefined ? CHART[atk][d] : 1), 1);
const statColor = (v: number) => v >= 120 ? "#4fc47a" : v >= 90 ? "#e5b34f" : v >= 60 ? "#e0a93c" : "#ff8f7d";

const panel: CSSProperties = {
  background: "linear-gradient(160deg,rgba(30,18,16,.95),rgba(13,8,7,.95))",
  border: "1px solid rgba(216,138,74,.18)", borderRadius: 22, boxShadow: "0 10px 30px rgba(0,0,0,.35)",
};
const bgIcon = (url: string): CSSProperties => ({ backgroundImage: `url(${url})`, backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center" });
const fieldLabelSpan: CSSProperties = { fontSize: 10, letterSpacing: ".09em", textTransform: "uppercase", color: "#b5a196", fontWeight: 700 };

const SCOPED_CSS = `
.dexv2 .mono{font-variant-numeric:tabular-nums;font-family:ui-monospace,"Cascadia Code",Consolas,monospace}
.dexv2 input,.dexv2 select{font:inherit;color:#f7eee7;width:100%;min-width:0;padding:11px 13px;border:1px solid rgba(216,138,74,.18);border-radius:10px;background:#0b0706;transition:border-color .15s,box-shadow .15s}
.dexv2 input:focus,.dexv2 select:focus{outline:none;border-color:#e5b34f;box-shadow:0 0 0 3px rgba(229,179,79,.09)}
.dexv2 [data-hover=card]:hover{border-color:rgba(229,179,79,.42)}
.dexv2 [data-hover=action]:hover{color:#fff}
.dexv2 .dexscroll{scrollbar-width:thin;scrollbar-color:#2b1a16 transparent}
.dexv2 .dexscroll::-webkit-scrollbar{width:10px;height:10px}
.dexv2 .dexscroll::-webkit-scrollbar-thumb{background:#2b1a16;border-radius:9px}
`;

const RARITY_ORDER = ["Comum", "Incomum", "Raro", "Épico", "Lendário", "Mítico"];
const SORT_OPTIONS: Array<[string, string]> = [["dex", "Número da dex"], ["nome", "Nome (A–Z)"], ["hunt", "Nível de hunt"], ["stats", "Base stats"], ["xp", "XP por abate"]];

export function PokedexPage() {
  const [catalog, setCatalog] = useState<PokemonDexEntry[]>([]);
  const [query, setQuery] = useState("");
  const [band, setBand] = useState("all");
  const [rarity, setRarity] = useState("Todas");
  const [types, setTypes] = useState<string[]>([]);
  const [sort, setSort] = useState("dex");
  const [pick, setPick] = useState(6);

  useEffect(() => { loadPokemonCatalog().then(setCatalog).catch(() => setCatalog([])); }, []);

  const bands = useMemo(() => [...new Set(catalog.map((d) => d.h))].sort((a, b) => a - b), [catalog]);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = catalog.filter((d) => {
      if (q && !(d.m.toLowerCase().includes(q) || String(d.n).padStart(3, "0").includes(q))) return false;
      if (band !== "all" && d.h !== +band) return false;
      if (rarity !== "Todas" && d.r !== rarity) return false;
      if (types.length && !types.every((t) => d.t.includes(t))) return false;
      return true;
    });
    return [...filtered].sort((a, b) =>
      sort === "nome" ? a.m.localeCompare(b.m)
        : sort === "hunt" ? a.h - b.h || a.n - b.n
          : sort === "stats" ? b.bs.reduce((x, y) => x + y, 0) - a.bs.reduce((x, y) => x + y, 0)
            : sort === "xp" ? (b.xp || 0) - (a.xp || 0)
              : a.n - b.n);
  }, [catalog, query, band, rarity, types, sort]);

  const sel = useMemo(() => catalog.find((d) => d.n === pick) || list[0] || catalog[0], [catalog, list, pick]);
  const loaded = catalog.length > 0;

  return (
    <main className="dexv2" style={{ padding: "26px 0 90px" }}>
      <style>{SCOPED_CSS}</style>
      <div style={{ width: "min(1200px,calc(100% - 44px))", marginInline: "auto", display: "grid", gap: 16 }}>

        {/* ---- Filtros ---- */}
        <section style={{ ...panel, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 15 }}>
            <div>
              <span style={{ display: "block", color: "#d98350", textTransform: "uppercase", letterSpacing: ".22em", fontSize: 11, fontWeight: 800, marginBottom: 8 }}>Pokédex</span>
              <h2 style={{ fontFamily: "Cinzel,serif", fontSize: 21, margin: "0 0 4px" }}>Tudo sobre a espécie, em uma tela</h2>
              <p style={{ color: "#b5a196", fontSize: 13, margin: 0, maxWidth: 660 }}>Onde caçar, o que ele derruba, quanto vale, quais golpes ele aprende e — o que faltava — <b style={{ color: "#f7eee7" }}>contra quem ele é forte, fraco e imune</b>.</p>
            </div>
            <div className="mono" style={{ display: "grid", gap: 2, textAlign: "right" }}>
              <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "#7d6d64", fontFamily: "Inter,sans-serif" }}>No catálogo</span>
              <b style={{ fontSize: 20, color: "#e5b34f" }}>{loaded ? num(catalog.length) : "…"}</b>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr) minmax(0,1fr)", gap: 10, marginBottom: 12 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
              <span style={fieldLabelSpan}>Buscar</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nome ou número da dex…" />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
              <span style={fieldLabelSpan}>Nível de hunt</span>
              <select value={band} onChange={(e) => setBand(e.target.value)}>
                <option value="all">Todos os níveis</option>
                {bands.map((b) => <option key={b} value={String(b)}>Hunt Nv {b}</option>)}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
              <span style={fieldLabelSpan}>Ordenar</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                {SORT_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
          </div>

          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
            {Object.keys(T).map((t) => {
              const on = types.includes(t);
              return (
                <span key={t} onClick={() => setTypes(on ? types.filter((x) => x !== t) : [...types, t])}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 9px 4px 4px", borderRadius: 99, border: `1px solid ${on ? "rgba(226,75,53,.45)" : "rgba(216,138,74,.16)"}`, background: on ? "rgba(226,75,53,.2)" : "rgba(0,0,0,.3)", fontSize: 9.5, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: on ? "#fff" : "#b5a196", cursor: "pointer" }}>
                  <span style={{ width: 17, height: 17, ...bgIcon(TI(t)) }} />
                  {T[t]}
                </span>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {["Todas", ...RARITY_ORDER].map((label) => {
              const on = rarity === label;
              const count = label === "Todas" ? catalog.length : catalog.filter((d) => d.r === label).length;
              return (
                <span key={label} onClick={() => setRarity(label)}
                  style={{ padding: "7px 12px", borderRadius: 99, border: `1px solid ${on ? "rgba(226,75,53,.45)" : "rgba(216,138,74,.16)"}`, background: on ? "rgba(226,75,53,.2)" : "rgba(0,0,0,.3)", color: on ? "#fff" : (RARITY[label] || "#b5a196"), fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                  {label} <span className="mono" style={{ opacity: .65 }}>{num(count)}</span>
                </span>
              );
            })}
            <span style={{ marginLeft: "auto", fontSize: 11.5, color: "#7d6d64" }}>{loaded ? `${num(list.length)} de ${num(catalog.length)} espécies` : "lendo o catálogo…"}</span>
          </div>
        </section>

        {/* ---- Mestre / detalhe ---- */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.35fr)", gap: 16, alignItems: "start" }}>

          <section style={{ ...panel, padding: 16 }}>
            <div className="dexscroll" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(148px,1fr))", gap: 8, maxHeight: 760, overflow: "auto" }}>
              {list.map((d) => (
                <div key={d.n} data-hover="card" onClick={() => setPick(d.n)}
                  style={{ display: "grid", gap: 5, justifyItems: "center", padding: "11px 9px", border: `1px solid ${d.n === pick ? "rgba(229,179,79,.5)" : "rgba(216,138,74,.14)"}`, borderRadius: 13, background: d.n === pick ? "rgba(229,179,79,.09)" : "rgba(0,0,0,.26)", cursor: "pointer" }}>
                  <span style={{ width: 62, height: 62, ...bgIcon(sprite(d.n)), imageRendering: "pixelated", filter: "drop-shadow(0 5px 9px rgba(0,0,0,.6))" }} />
                  <b style={{ fontSize: 12, color: "#f7eee7", textAlign: "center", lineHeight: 1.2 }}>{d.m}</b>
                  <span className="mono" style={{ fontSize: 9, color: "#7d6d64" }}>#{String(d.n).padStart(3, "0")} · {d.boss ? "boss" : "Nv " + d.h}</span>
                  <span style={{ display: "flex", gap: 3 }}>
                    {d.t.map((t) => <span key={t} style={{ width: 18, height: 18, ...bgIcon(TI(t)) }} />)}
                  </span>
                </div>
              ))}
            </div>
            {loaded && list.length === 0 && (
              <div style={{ padding: "34px 18px", textAlign: "center", color: "#7d6d64", fontSize: 12.5 }}>Nada encontrado com esses filtros.</div>
            )}
          </section>

          {sel && <PokemonDetail sel={sel} />}
        </div>

        <p style={{ margin: 0, color: "#7d6d64", fontSize: 11, lineHeight: 1.6, maxWidth: 880 }}>Dados do catálogo do VPLab (<span className="mono">data.js</span> · Poképedia oficial com os spawns conferidos no mapa do jogo em 17/07/2026): nível de hunt, raridade, base stats, golpes, XP, preço no NPC e tabela de loot com chance real. Vantagens e imunidades são calculadas pela tabela de tipos do jogo.</p>
      </div>
    </main>
  );
}

function PokemonDetail({ sel }: { sel: PokemonDexEntry }) {
  const rarityColor = RARITY[sel.r] || "#b5a196";
  const statSum = sel.bs.reduce((a, b) => a + b, 0);

  const groups: Record<number, string[]> = { 4: [], 2: [], 1: [], 0.5: [], 0.25: [], 0: [] };
  Object.keys(T).forEach((atk) => {
    const m = eff(atk, sel.t);
    (groups[m] = groups[m] || []).push(atk);
  });
  const mkRow = (label: string, icon: string, color: string, edge: string, bg: string, keys: string[], x: string) => ({ label, icon, color, edge, bg, x, types: (keys || []).map((t) => ({ key: t, label: T[t], icon: TI(t) })), none: !keys || !keys.length });
  const matchup = [
    mkRow("Fraqueza dupla", AI("dano-super"), "#4fc47a", "rgba(79,196,122,.3)", "rgba(79,196,122,.07)", groups[4], "×4 → ×5,5 na hunt"),
    mkRow("Fraco contra", AI("dano-vantagem"), "#8fd48a", "rgba(79,196,122,.22)", "rgba(79,196,122,.05)", groups[2], "×2 → ×2,5 na hunt"),
    mkRow("Resiste a", AI("dano-resistido"), "#e0a93c", "rgba(224,169,60,.26)", "rgba(224,169,60,.06)", [...(groups[0.5] || []), ...(groups[0.25] || [])], "×0,5 ou menos"),
    mkRow("Imune a", AI("imunidade"), "#83b9ff", "rgba(131,185,255,.3)", "rgba(131,185,255,.07)", groups[0], "×0 — não sofre nada"),
  ];

  const lootSorted = [...sel.loot].sort((a, b) => (b[1] || 0) - (a[1] || 0));
  const facts = [
    { label: "Hunt", value: sel.boss ? "Boss" : "Nv " + sel.h, color: sel.boss ? "#ff8f7d" : "#e5b34f" },
    { label: "XP por abate", value: num(sel.xp), color: "#f7eee7" },
    { label: "Preço no NPC", value: sel.npc ? "$" + num(sel.npc) : "—", color: "#f7eee7" },
    { label: "Golpes", value: num(sel.g.length), color: "#f7eee7" },
  ];
  const actions = [
    { label: "Avaliar IV", icon: ACTION_ICONS.avaliar, color: "#e8c9a8", edge: "rgba(216,138,74,.24)", bg: "rgba(255,255,255,.03)", to: `/vplab/avaliar-iv?p=${sel.s}` },
    { label: "Planejar rota", icon: ACTION_ICONS.rota, color: "#ffd9cf", edge: "rgba(226,75,53,.4)", bg: "linear-gradient(180deg,rgba(226,75,53,.2),rgba(142,29,25,.26))", to: `/vplab/rota?p=${sel.s}` },
    { label: "Ver na PokeFipe", icon: ACTION_ICONS.fipe, color: "#e5b34f", edge: "rgba(229,179,79,.3)", bg: "rgba(229,179,79,.08)", to: `/vplab/pokefipe?p=${sel.s}` },
  ];

  const sectionLabel: CSSProperties = { fontSize: 10, fontWeight: 800, letterSpacing: ".13em", textTransform: "uppercase", color: "#7d6d64" };

  return (
    <section style={{ ...panel, border: "1px solid rgba(229,179,79,.24)", padding: 22, position: "sticky", top: 150 }}>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{ position: "relative", width: 132, height: 132, flex: "0 0 132px", borderRadius: 18, border: "1px solid rgba(229,179,79,.3)", background: "radial-gradient(70% 70% at 50% 35%,rgba(194,54,41,.24),rgba(0,0,0,.55))" }}>
          <span style={{ position: "absolute", inset: 7, ...bgIcon(sprite(sel.n)), imageRendering: "pixelated", filter: "drop-shadow(0 8px 14px rgba(0,0,0,.65))" }} />
        </div>
        <div style={{ display: "grid", gap: 8, minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span className="mono" style={{ fontSize: 12, color: "#7d6d64" }}>#{String(sel.n).padStart(3, "0")}</span>
            <h2 style={{ fontFamily: "Cinzel,serif", fontSize: 26, margin: 0 }}>{sel.m}</h2>
            <span style={{ padding: "4px 11px", borderRadius: 99, border: `1px solid ${rarityColor}55`, background: `${rarityColor}16`, fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: rarityColor }}>{sel.r}</span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {sel.t.map((t) => (
              <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 11px 4px 4px", borderRadius: 99, border: "1px solid rgba(216,138,74,.22)", background: "rgba(0,0,0,.4)", fontSize: 10, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase", color: "#e8c9a8" }}>
                <span style={{ width: 20, height: 20, ...bgIcon(TI(t)) }} />
                {T[t]}
              </span>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(104px,1fr))", gap: 7 }}>
            {facts.map((f) => (
              <div key={f.label} style={{ padding: "8px 10px", border: "1px solid rgba(216,138,74,.16)", borderRadius: 11, background: "rgba(0,0,0,.28)" }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#7d6d64" }}>{f.label}</div>
                <div className="mono" style={{ marginTop: 3, fontSize: 13.5, fontWeight: 700, color: f.color }}>{f.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {/* Base stats */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
            <span style={sectionLabel}>Base stats</span>
            <span className="mono" style={{ fontSize: 11, color: "#b5a196" }}>total {num(statSum)}</span>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {sel.bs.map((v, i) => {
              const c = statColor(v);
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "74px minmax(0,1fr) 38px", gap: 9, alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#b5a196" }}>{STAT[i]}</span>
                  <span style={{ display: "block", height: 8, borderRadius: 99, background: "rgba(255,255,255,.06)", overflow: "hidden", border: "1px solid rgba(216,138,74,.12)" }}>
                    <span style={{ display: "block", height: "100%", borderRadius: "inherit", width: `${Math.max(3, Math.min(100, v / 200 * 100))}%`, background: `linear-gradient(90deg,${c},${c}88)` }} />
                  </span>
                  <b className="mono" style={{ fontSize: 11.5, color: c, textAlign: "right" }}>{num(v)}</b>
                </div>
              );
            })}
          </div>
        </div>

        {/* Matchup */}
        <div>
          <span style={{ ...sectionLabel, display: "block", marginBottom: 8 }}>Contra ele — o que usar e o que evitar</span>
          <div style={{ display: "grid", gap: 7 }}>
            {matchup.map((m) => (
              <div key={m.label} style={{ display: "grid", gridTemplateColumns: "118px minmax(0,1fr)", gap: 10, alignItems: "center", padding: "8px 10px", border: `1px solid ${m.edge}`, borderRadius: 11, background: m.bg }}>
                <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 22, height: 22, ...bgIcon(m.icon) }} />
                  <span style={{ display: "grid", gap: 1 }}>
                    <b style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: m.color }}>{m.label}</b>
                    <small className="mono" style={{ fontSize: 9, color: "#7d6d64" }}>{m.x}</small>
                  </span>
                </span>
                <span style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {m.types.map((t) => <span key={t.key} title={t.label} style={{ width: 22, height: 22, ...bgIcon(t.icon) }} />)}
                  {m.none && <small style={{ fontSize: 10.5, color: "#7d6d64" }}>nenhum</small>}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Golpes */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
            <span style={sectionLabel}>Golpes que ele aprende</span>
            <span style={{ fontSize: 11, color: "#7d6d64" }}>{sel.g.length} no total</span>
          </div>
          <div className="dexscroll" style={{ display: "flex", gap: 6, flexWrap: "wrap", maxHeight: 150, overflow: "auto" }}>
            {sel.g.map((g, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 11px 5px 5px", borderRadius: 10, border: "1px solid rgba(216,138,74,.16)", background: "rgba(0,0,0,.28)" }}>
                <span style={{ width: 20, height: 20, ...bgIcon(TI(g[1])) }} />
                <span style={{ display: "grid", gap: 1, lineHeight: 1.2 }}>
                  <b style={{ fontSize: 11, color: "#f7eee7" }}>{g[0]}</b>
                  <small className="mono" style={{ fontSize: 9, color: "#7d6d64" }}>{T[g[1]]} · {g[2] === "fisico" ? "físico" : "especial"} · {g[3]}</small>
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Loot */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
            <span style={sectionLabel}>Loot</span>
            <span className="mono" style={{ fontSize: 11, color: "#b5a196" }}>média {sel.la ? "$" + num(sel.la) : "—"} por abate</span>
          </div>
          <div style={{ border: "1px solid rgba(216,138,74,.16)", borderRadius: 12, background: "rgba(0,0,0,.26)", overflow: "hidden" }}>
            {lootSorted.map((l, i) => {
              const [nome, chance, mn, mx, value] = l;
              const color = !chance ? "#e5b34f" : chance >= 40000 ? "#b5a196" : chance >= 5000 ? "#4fc47a" : "#e5b34f";
              const qty = mn === mx ? `${mn} unidade${mn > 1 ? "s" : ""}` : `${mn}–${mx} unidades`;
              const chanceLabel = chance ? (chance / 1000).toFixed(chance >= 1000 ? 1 : 2).replace(".", ",") + "%" : "raríssimo";
              return (
                <div key={nome + i} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 84px 92px", gap: 10, alignItems: "center", padding: "9px 12px", borderBottom: "1px solid rgba(216,138,74,.08)", background: i % 2 ? "rgba(255,255,255,.015)" : "transparent" }}>
                  <span style={{ display: "grid", gap: 1, minWidth: 0 }}>
                    <b style={{ fontSize: 11.5, color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nome}</b>
                    <small style={{ fontSize: 9.5, color: "#7d6d64" }}>{qty}</small>
                  </span>
                  <span className="mono" style={{ fontSize: 11, color, textAlign: "right" }}>{chanceLabel}</span>
                  <span className="mono" style={{ fontSize: 11, color: "#b5a196", textAlign: "right" }}>{value ? "$" + num(value) : "—"}</span>
                </div>
              );
            })}
            {lootSorted.length === 0 && (
              <div style={{ padding: 16, textAlign: "center", fontSize: 11.5, color: "#7d6d64" }}>Sem loot registrado no catálogo.</div>
            )}
          </div>
        </div>

        {/* Ações */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 4, borderTop: "1px solid rgba(216,138,74,.12)" }}>
          {actions.map((a) => (
            <Link key={a.label} to={a.to} data-hover="action"
              style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 14px", borderRadius: 11, border: `1px solid ${a.edge}`, background: a.bg, color: a.color, fontSize: 12, fontWeight: 800, textDecoration: "none" }}>
              <span style={{ width: 18, height: 18, ...bgIcon(a.icon), imageRendering: "pixelated" }} />
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
