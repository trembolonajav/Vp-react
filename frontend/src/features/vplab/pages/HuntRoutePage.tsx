import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import { loadPokemonCatalog, type PokemonDexEntry } from "../services/ivCalculator";
import { createHuntTargets, fmtMultiplier as fx, TYPE_LABELS as T, type HuntTarget } from "../services/huntRoute";

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
const eff = (atk: string, defs: string[]) => defs.reduce((m, d) => m * (CHART[atk] && CHART[atk][d] !== undefined ? CHART[atk][d] : 1), 1);
const amp = (m: number) => m === 0 ? 0 : m > 1 ? 1 + (m - 1) * 1.5 : m < 1 ? m / 1.5 : 1;
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const sprite = (n: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${n}.png`;

interface Tier { icon: string; color: string; tier: string }
interface Verdict { label: string; icon: string; tone: string; rank: number; keep: boolean; why: string }
interface Analysis {
  target: HuntTarget; best: { type: string; m: number }; worst: { name: string; type: string; m: number; score: number };
  dealt: Tier; taken: Tier; verdict: Verdict; score: number;
}

function analyse(target: HuntTarget, me: PokemonDexEntry, cover: string[]): Analysis {
  const myTypes = me.t;
  const atkPool = [...new Set([...myTypes, ...cover])];
  const best = atkPool.map((t) => ({ type: t, m: amp(eff(t, target.t)) })).sort((a, b) => b.m - a.m)[0] || { type: myTypes[0], m: 0 };
  const availableMoves = target.g.filter(([, , category, power, learnedAt]) =>
    (category === "fisico" || category === "especial") && power > 0 && learnedAt <= target.huntLevel);
  const incoming = availableMoves.map(([name, type, category, power]) => {
    const m = amp(eff(type, myTypes));
    const stab = target.t.includes(type) ? 1.5 : 1;
    const attack = category === "especial" ? target.bs[3] : target.bs[1];
    const defense = category === "especial" ? me.bs[4] : me.bs[2];
    // O card exibe a efetividade, mas a escolha acompanha o golpe que o jogo
    // realmente prefere: poder, STAB e o atributo ofensivo correspondente.
    return { name, type, m, score: power * stab * m * attack / Math.max(1, defense) };
  }).sort((a, b) => b.score - a.score || b.m - a.m);
  const worst = incoming[0] || { name: "Nenhum golpe", type: target.t[0] || "normal", m: 0, score: 0 };

  const dealt: Tier = best.m >= 5 ? { icon: AI("dano-super"), color: "#4fc47a", tier: "dano brutal" }
    : best.m >= 2.5 ? { icon: AI("dano-super"), color: "#4fc47a", tier: "super eficaz" }
      : best.m > 1 ? { icon: AI("dano-vantagem"), color: "#8fd48a", tier: "acima do normal" }
        : best.m === 1 ? { icon: AI("dano-neutro"), color: "#b5a196", tier: "sem vantagem" }
          : best.m > 0 ? { icon: AI("dano-resistido"), color: "#e0a93c", tier: "ele resiste" }
            : { icon: AI("dano-nulo"), color: "#ff6b55", tier: "não acerta" };

  const taken: Tier = worst.m === 0 ? { icon: AI("hunt-segura"), color: "#4fd8b0", tier: "nada te acerta" }
    : worst.m >= 2.5 ? { icon: AI("recebe-muito"), color: "#ff6b55", tier: "leva muito dano" }
      : worst.m > 1 ? { icon: AI("recebe-atencao"), color: "#e0a93c", tier: "dano acima do normal" }
        : worst.m === 1 ? { icon: AI("dano-neutro"), color: "#b5a196", tier: "troca equilibrada" }
          : { icon: AI("recebe-resiste"), color: "#4fc47a", tier: "você resiste" };

  let verdict: Verdict;
  if (best.m === 0) verdict = { label: "Não caçar", icon: AI("alvo-evitar"), tone: "#ff6b55", rank: -100, keep: false, why: "seu golpe não acerta" };
  else if (worst.m >= 2.5 && best.m < 2.5) verdict = { label: "Não caçar", icon: AI("alvo-evitar"), tone: "#ff6b55", rank: -50, keep: false, why: "ele bate super e você não" };
  else if (worst.m >= 2.5) verdict = { label: "Troca perigosa", icon: AI("recebe-muito"), tone: "#ff8f7d", rank: 20, keep: true, why: "você bate forte, mas ele também" };
  else if (worst.m === 0 && best.m >= 2.5) verdict = { label: "Alvo perfeito", icon: AI("alvo-ideal"), tone: "#e5b34f", rank: 100, keep: true, why: "bate super e é intocável" };
  else if (worst.m === 0) verdict = { label: "Hunt segura", icon: AI("hunt-segura"), tone: "#4fd8b0", rank: 70, keep: true, why: "ele não consegue te acertar" };
  else if (best.m >= 2.5 && worst.m <= 1) verdict = { label: "Alvo ideal", icon: AI("alvo-ideal"), tone: "#e5b34f", rank: 80, keep: true, why: "bate super sem tomar dano extra" };
  else if (best.m >= 2.5) verdict = { label: "Bom alvo", icon: AI("dano-super"), tone: "#4fc47a", rank: 60, keep: true, why: "dano super eficaz" };
  else if (best.m < 1) verdict = { label: "Hunt lenta", icon: AI("hunt-lenta"), tone: "#e8d9a8", rank: worst.m <= 1 ? 10 : -20, keep: worst.m <= 1, why: "custa tempo, ele resiste" };
  else verdict = { label: "Alvo neutro", icon: AI("dano-neutro"), tone: "#b5a196", rank: 35, keep: true, why: "troca sem vantagem" };

  return { target, best, worst, dealt, taken, verdict, score: verdict.rank * 10 + best.m * 4 - worst.m * 2 };
}

const panel: CSSProperties = {
  background: "linear-gradient(160deg,rgba(30,18,16,.95),rgba(13,8,7,.95))",
  border: "1px solid rgba(216,138,74,.18)", borderRadius: 22, boxShadow: "0 10px 30px rgba(0,0,0,.35)",
};
const bgIcon = (url: string): CSSProperties => ({ backgroundImage: `url(${url})`, backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center" });
const uLabel: CSSProperties = { fontSize: 10, letterSpacing: ".09em", textTransform: "uppercase", color: "#b5a196", fontWeight: 700 };
const sectionCap: CSSProperties = { fontSize: 9.5, fontWeight: 800, letterSpacing: ".13em", textTransform: "uppercase", color: "#7d6d64" };

const SCOPED_CSS = `
.rotav3 .mono{font-variant-numeric:tabular-nums;font-family:ui-monospace,"Cascadia Code",Consolas,monospace}
.rotav3 input,.rotav3 select{font:inherit;color:#f7eee7;width:100%;min-width:0;padding:11px 13px;border:1px solid rgba(216,138,74,.18);border-radius:10px;background:#0b0706;transition:border-color .15s,box-shadow .15s}
.rotav3 input:focus,.rotav3 select:focus{outline:none;border-color:#e5b34f;box-shadow:0 0 0 3px rgba(229,179,79,.09)}
.rotav3 [data-hover=x]:hover{color:#fff}
.rotav3 .hunt-pokemon-picker{position:relative}
.rotav3 .hunt-pokemon-search{position:relative}
.rotav3 .hunt-pokemon-search::before{content:"⌕";position:absolute;left:14px;top:50%;z-index:1;transform:translateY(-52%);font-size:21px;line-height:1;color:#e5a334;pointer-events:none}
.rotav3 .hunt-pokemon-search input{height:50px;padding:11px 42px 11px 37px;border-color:#d89a29;border-radius:7px;background:#090605;font-size:16px;box-shadow:0 0 0 3px rgba(229,163,52,.08)}
.rotav3 .hunt-pokemon-search input:focus{border-color:#efb542;box-shadow:0 0 0 3px rgba(229,179,79,.12)}
.rotav3 .hunt-pokemon-clear{position:absolute;right:11px;top:50%;z-index:2;transform:translateY(-50%);width:27px;border:0;background:transparent;color:#8f7b70;font-size:20px;cursor:pointer}
.rotav3 .hunt-pokemon-options{position:absolute;z-index:30;top:calc(100% + 9px);left:0;right:0;max-height:300px;margin:0;padding:5px 0;overflow-y:auto;overscroll-behavior:contain;list-style:none;border:1px solid rgba(218,160,48,.52);border-radius:9px;background:#0d0806;box-shadow:0 18px 40px rgba(0,0,0,.68)}
.rotav3 .hunt-pokemon-option{display:flex;align-items:center;justify-content:space-between;gap:18px;width:100%;padding:11px 15px;border:0;background:transparent;color:#fff;text-align:left;cursor:pointer}
.rotav3 .hunt-pokemon-option:hover,.rotav3 .hunt-pokemon-option[aria-selected=true]{background:rgba(229,179,79,.1)}
.rotav3 .hunt-pokemon-option strong{font-size:15px;font-weight:650}
.rotav3 .hunt-pokemon-option small{color:#e7903b;font:700 10px ui-monospace,"Cascadia Code",Consolas,monospace}
.rotav3 .hunt-pokemon-empty{padding:17px 15px;color:#8f7b70;font-size:13px}
`;

export function HuntRoutePage() {
  const [params] = useSearchParams();
  const [catalog, setCatalog] = useState<PokemonDexEntry[]>([]);
  const [me, setMe] = useState(params.get("p") ?? "charizard");
  const [level, setLevel] = useState<string | number>(Number(params.get("level")) || 20);
  const [coverage, setCoverage] = useState<string[]>([]);
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const [pokemonQuery, setPokemonQuery] = useState("");
  const [pokemonPickerOpen, setPokemonPickerOpen] = useState(false);

  useEffect(() => { loadPokemonCatalog().then(setCatalog).catch(() => setCatalog([])); }, []);

  const targets = useMemo(() => createHuntTargets(catalog), [catalog]);
  const meSpecies = useMemo(() => catalog.find((h) => h.s === me) || catalog.find((h) => h.s === "charizard") || catalog[0], [catalog, me]);
  const pokemonOptions = useMemo(() => {
    const query = pokemonQuery.trim().toLocaleLowerCase("pt-BR").replace(/^#/, "");
    return [...catalog]
      .sort((a, b) => a.n - b.n)
      .filter((pokemon) => !query || pokemon.m.toLocaleLowerCase("pt-BR").includes(query) || String(pokemon.n).padStart(3, "0").includes(query));
  }, [catalog, pokemonQuery]);
  const myTypes = useMemo(() => meSpecies?.t ?? [], [meSpecies]);
  const cover = useMemo(() => coverage.filter((c) => !myTypes.includes(c)), [coverage, myTypes]);
  const lvl = Math.max(1, Math.floor(Number(level) || 1));

  const levels = useMemo(() => [...new Set(targets.map((h) => h.huntLevel))].sort((a, b) => a - b), [targets]);
  const currentBand = levels.filter((l) => l <= lvl).pop() ?? levels[0];
  const analysed = useMemo(() => meSpecies ? targets.map((h) => analyse(h, meSpecies, cover)) : [], [targets, meSpecies, cover]);
  const byBand = useMemo(() => levels.map((l) => analysed.filter((a) => a.target.huntLevel === l).sort((x, y) => y.score - x.score)), [levels, analysed]);

  if (!meSpecies) {
    return <main className="rotav3" style={{ padding: "26px 0 90px" }}>
      <div style={{ width: "min(1200px,calc(100% - 44px))", marginInline: "auto", color: "#7d6d64", fontSize: 13 }}>Carregando o catálogo…</div>
    </main>;
  }

  const bands = levels.map((l, i) => {
    const all = byBand[i];
    const keep = all.filter((a) => a.verdict.keep);
    const drop = all.filter((a) => !a.verdict.keep);
    const isCurrent = l === currentBand;
    const isPast = l < currentBand;
    const isOpen = !!open[l];
    const shown = isOpen ? [...keep, ...drop] : keep.slice(0, isPast ? 3 : 6);
    const top = keep[0];
    return { l, isCurrent, isPast, keep, drop, all, isOpen, shown, top };
  }).filter((b) => b.l >= currentBand);

  const path = (levels.filter((l) => l >= currentBand).map((l, i, arr) => {
    const best = byBand[levels.indexOf(l)].filter((a) => a.verdict.keep)[0];
    if (!best) return null;
    return { l, nome: best.target.displayName, n: best.target.n, x: fx(best.best.m), tone: best.verdict.tone, arrow: i < arr.length - 1 ? "›" : "" };
  }).filter(Boolean)) as Array<{ l: number; nome: string; n: number; x: string; tone: string; arrow: string }>;

  const good = analysed.filter((a) => a.verdict.keep);
  const safe = analysed.filter((a) => a.worst.m === 0 && a.best.m > 0);
  const perfect = analysed.filter((a) => a.best.m >= 2.5 && a.worst.m <= 1);
  const bad = analysed.filter((a) => !a.verdict.keep);
  const stats = [
    { label: "Valem a pena", value: good.length, note: "alvos que compensam com ele", color: "#4fc47a", edge: "rgba(79,196,122,.28)", bg: "rgba(79,196,122,.07)" },
    { label: "Imunes ao moveset", value: safe.length, note: "nenhum golpe causa dano", color: "#4fd8b0", edge: "rgba(79,216,176,.3)", bg: "rgba(79,216,176,.07)" },
    { label: "Vantagem forte", value: perfect.length, note: "super eficaz sem risco extra", color: "#e5b34f", edge: "rgba(229,179,79,.3)", bg: "rgba(229,179,79,.07)" },
    { label: "Descartados", value: bad.length, note: "perde tempo ou morre", color: "#ff6b55", edge: "rgba(255,107,85,.28)", bg: "rgba(255,107,85,.06)" },
  ];
  const summaryNote = `${targets.length} hunts no catálogo · ${catalog.length} espécies · faixa ${currentBand}`;

  const toggleCover = (t: string) => { if (myTypes.includes(t)) return; setCoverage((v) => v.includes(t) ? v.filter((x) => x !== t) : [...v, t]); };
  const selectPokemon = (pokemon: PokemonDexEntry) => {
    setMe(pokemon.s);
    setPokemonQuery(pokemon.m);
    setCoverage([]);
    setPokemonPickerOpen(false);
  };

  return (
    <main className="rotav3" style={{ padding: "26px 0 90px" }}>
      <style>{SCOPED_CSS}</style>
      <div style={{ width: "min(1200px,calc(100% - 44px))", marginInline: "auto", display: "grid", gap: 18 }}>

        {/* ---- Config ---- */}
        <section style={{ ...panel, padding: 24 }}>
          <span style={{ display: "block", color: "#d98350", textTransform: "uppercase", letterSpacing: ".22em", fontSize: 11, fontWeight: 800, marginBottom: 8 }}>Rota de caça</span>
          <h2 style={{ fontFamily: "Cinzel,serif", fontSize: 21, margin: "0 0 4px" }}>Peguei esse Pokémon — para onde eu vou?</h2>
          <p style={{ color: "#b5a196", fontSize: 13, margin: "0 0 18px", maxWidth: 780 }}>Diga quem você usa e em que nível está. O VPLab desenha a rota faixa por faixa: o <b style={{ color: "#f7eee7" }}>melhor alvo</b>, as <b style={{ color: "#f7eee7" }}>alternativas</b>, as <b style={{ color: "#f7eee7" }}>hunts seguras</b> (onde ele não consegue te acertar) e o que é <b style={{ color: "#f7eee7" }}>perda de tempo</b>.</p>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.25fr)", gap: 16, alignItems: "start" }}>
            {/* Left column */}
            <div style={{ display: "grid", gap: 13, minWidth: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "104px minmax(0,1fr)", gap: 13, alignItems: "center" }}>
                <div style={{ position: "relative", width: 104, height: 104, borderRadius: 16, border: "1px solid rgba(229,179,79,.28)", background: "radial-gradient(70% 70% at 50% 35%,rgba(194,54,41,.22),rgba(0,0,0,.55))" }}>
                  <span style={{ position: "absolute", inset: 5, ...bgIcon(sprite(meSpecies.n)), imageRendering: "pixelated", filter: "drop-shadow(0 6px 12px rgba(0,0,0,.6))" }} />
                </div>
                <div style={{ display: "grid", gap: 9, minWidth: 0 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
                    <span style={uLabel}>Meu Pokémon</span>
                    <div className="hunt-pokemon-picker">
                      <div className="hunt-pokemon-search">
                        <input
                          role="combobox"
                          aria-label="Buscar Pokémon"
                          aria-expanded={pokemonPickerOpen}
                          aria-controls="hunt-pokemon-options"
                          aria-autocomplete="list"
                          placeholder="Buscar Pokémon..."
                          value={pokemonQuery}
                          onFocus={() => setPokemonPickerOpen(true)}
                          onBlur={() => window.setTimeout(() => setPokemonPickerOpen(false), 120)}
                          onChange={(event) => { setPokemonQuery(event.target.value); setPokemonPickerOpen(true); }}
                          onKeyDown={(event) => {
                            if (event.key === "Escape") setPokemonPickerOpen(false);
                            if (event.key === "Enter" && pokemonPickerOpen && pokemonOptions[0]) { event.preventDefault(); selectPokemon(pokemonOptions[0]); }
                          }}
                        />
                        {pokemonQuery && <button className="hunt-pokemon-clear" type="button" aria-label="Limpar busca" onMouseDown={(event) => event.preventDefault()} onClick={() => { setPokemonQuery(""); setPokemonPickerOpen(true); }}>×</button>}
                      </div>
                      {pokemonPickerOpen && (
                        <ul className="hunt-pokemon-options" id="hunt-pokemon-options" role="listbox">
                          {pokemonOptions.map((pokemon) => (
                            <li key={pokemon.s} role="presentation">
                              <button className="hunt-pokemon-option" type="button" role="option" aria-selected={pokemon.s === me} onMouseDown={(event) => event.preventDefault()} onClick={() => selectPokemon(pokemon)}>
                                <strong>{pokemon.m}{pokemon.boss ? " (lendário)" : ""}</strong>
                                <small>#{String(pokemon.n).padStart(3, "0")}</small>
                              </button>
                            </li>
                          ))}
                          {!pokemonOptions.length && <li className="hunt-pokemon-empty">Nenhum Pokémon encontrado.</li>}
                        </ul>
                      )}
                    </div>
                  </label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {myTypes.map((t) => (
                      <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 11px 4px 4px", borderRadius: 99, border: "1px solid rgba(216,138,74,.22)", background: "rgba(0,0,0,.4)", fontSize: 10, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase", color: "#e8c9a8" }}>
                        <span style={{ width: 20, height: 20, ...bgIcon(TI(t)) }} />{T[t]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
                <span style={uLabel}>Nível atual</span>
                <input className="mono" type="number" min={1} max={999} value={level} onChange={(e) => setLevel(e.target.value)} style={{ textAlign: "center" }} />
              </label>

              <div style={{ display: "grid", gap: 7 }}>
                <span style={uLabel}>Golpes de cobertura <span style={{ color: "#7d6d64", letterSpacing: 0, textTransform: "none", fontWeight: 600 }}>— tipos fora dos dele</span></span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {Object.keys(T).map((t) => {
                    const own = myTypes.includes(t), on = coverage.includes(t);
                    return (
                      <span key={t} onClick={() => toggleCover(t)} title={T[t]}
                        style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 9px 4px 4px", borderRadius: 99, border: `1px solid ${own ? "rgba(216,138,74,.1)" : on ? "rgba(226,75,53,.45)" : "rgba(216,138,74,.16)"}`, background: own ? "rgba(255,255,255,.02)" : on ? "rgba(226,75,53,.2)" : "rgba(0,0,0,.3)", fontSize: 9.5, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase", color: own ? "#7d6d64" : on ? "#fff" : "#b5a196", cursor: own ? "default" : "pointer", opacity: own ? .45 : 1 }}>
                        <span style={{ width: 17, height: 17, ...bgIcon(TI(t)) }} />{T[t]}
                      </span>
                    );
                  })}
                </div>
                <small style={{ fontSize: 10.5, color: "#7d6d64" }}>Marque o que ele realmente tem liberado — a rota recalcula na hora.</small>
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: "grid", gap: 11, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                <span style={uLabel}>Resumo da rota</span>
                <span style={{ fontSize: 11, color: "#7d6d64" }}>{summaryNote}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(138px,1fr))", gap: 9 }}>
                {stats.map((s) => (
                  <div key={s.label} style={{ padding: "12px 13px", border: `1px solid ${s.edge}`, borderRadius: 13, background: s.bg }}>
                    <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".11em", textTransform: "uppercase", color: "#7d6d64" }}>{s.label}</div>
                    <div className="mono" style={{ marginTop: 5, fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ marginTop: 3, fontSize: 10.5, color: "#b5a196", lineHeight: 1.35 }}>{s.note}</div>
                  </div>
                ))}
              </div>

              <div style={{ padding: 14, border: "1px solid rgba(229,179,79,.3)", borderRadius: 15, background: "linear-gradient(160deg,rgba(229,179,79,.09),rgba(13,8,7,.5))" }}>
                <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "#d98350", marginBottom: 10 }}>Caminho recomendado</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  {path.map((p) => (
                    <span key={p.l} style={{ display: "contents" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 11px 6px 6px", borderRadius: 11, border: `1px solid ${p.tone}44`, background: `${p.tone}12` }}>
                        <span style={{ width: 32, height: 32, ...bgIcon(sprite(p.n)), imageRendering: "pixelated" }} />
                        <span style={{ display: "grid", gap: 1, lineHeight: 1.2 }}>
                          <b style={{ fontSize: 11.5, color: "#f7eee7" }}>{p.nome}</b>
                          <small className="mono" style={{ fontSize: 9.5, color: p.tone }}>Nv {p.l} · {p.x}</small>
                        </span>
                      </span>
                      {p.arrow && <span style={{ color: "#7d6d64", fontSize: 13 }}>{p.arrow}</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---- Bands ---- */}
        {bands.map((b) => (
          <section key={b.l} style={{ ...panel, border: `1px solid ${b.isCurrent ? "rgba(226,75,53,.42)" : "rgba(216,138,74,.16)"}`, padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ display: "grid", placeItems: "center", width: 52, height: 52, borderRadius: 14, border: `1px solid ${b.isCurrent ? "rgba(226,75,53,.42)" : "rgba(216,138,74,.16)"}`, background: b.isCurrent ? "linear-gradient(160deg,rgba(226,75,53,.28),rgba(13,8,7,.6))" : "rgba(0,0,0,.3)", fontFamily: "Cinzel,serif", fontSize: 17, fontWeight: 800, color: b.isCurrent ? "#ff8f7d" : "#e5b34f" }}>{b.l}</span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                    <h2 style={{ fontFamily: "Cinzel,serif", fontSize: 19, margin: 0 }}>Faixa nível {b.l}</h2>
                    {b.isCurrent && <span style={{ padding: "3px 9px", borderRadius: 99, border: "1px solid rgba(226,75,53,.45)", background: "rgba(226,75,53,.16)", fontSize: 9, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#ff8f7d" }}>Você está aqui</span>}
                    {b.isPast && <span style={{ padding: "3px 9px", borderRadius: 99, border: "1px solid rgba(216,138,74,.2)", background: "rgba(255,255,255,.03)", fontSize: 9, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#7d6d64" }}>Já passou</span>}
                  </div>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: "#b5a196" }}>{b.keep.length
                    ? `${b.keep.length} ${b.keep.length === 1 ? "alvo vale a pena" : "alvos valem a pena"} · ${b.drop.length} descartado${b.drop.length === 1 ? "" : "s"}${b.top ? ` · melhor: ${b.top.target.displayName}` : ""}`
                    : `Nenhum alvo bom aqui com ${meSpecies.m} — pule esta faixa ou libere cobertura`}</p>
                </div>
              </div>
              {(b.drop.length > 0 || b.keep.length > b.shown.length) && (
                <span data-hover="x" onClick={() => setOpen((o) => ({ ...o, [b.l]: !o[b.l] }))} style={{ padding: "8px 13px", borderRadius: 10, border: "1px solid rgba(216,138,74,.2)", background: "rgba(255,255,255,.03)", fontSize: 11.5, fontWeight: 700, color: "#b5a196", cursor: "pointer" }}>{b.isOpen ? "Esconder descartados" : `Mostrar todos (${b.all.length})`}</span>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(322px,1fr))", gap: 11 }}>
              {b.shown.map((a, idx) => (
                <RouteCard key={a.target.routeKey} a={a} idx={idx} isPast={b.isPast} cover={cover} />
              ))}
            </div>
          </section>
        ))}

        <p style={{ margin: 0, color: "#7d6d64", fontSize: 11, lineHeight: 1.6, maxWidth: 880 }}>Hunts, níveis, tipos e golpes vêm do catálogo do próprio VPLab (data.js · Poképedia oficial com os spawns conferidos no mapa do jogo em 17/07/2026), então só aparece o que existe de verdade. Lendários ficam fora da rota por não serem hunt repetível, mas continuam selecionáveis como o seu Pokémon. Na hunt a vantagem é amplificada: ×2 vira ×2,5 e ×4 vira ×5,5; resistência divide por 1,5. O dano recebido usa o melhor golpe disponível do alvo, considerando nível, poder, STAB e stats.</p>
      </div>
    </main>
  );
}

function RouteCard({ a, idx, isPast, cover }: { a: Analysis; idx: number; isPast: boolean; cover: string[] }) {
  const tone = a.verdict.tone;
  const edge = a.verdict.keep ? tone + "55" : "rgba(255,107,85,.28)";
  const glow = tone + "26";
  const isTop = idx === 0 && a.verdict.keep && !isPast;

  const badges: Array<{ key: string; label: string; icon: string; color: string; edge: string; bg: string }> = [];
  if (a.worst.m === 0) badges.push({ key: "safe", label: "Imune ao moveset", icon: AI("imunidade"), color: "#4fd8b0", edge: "rgba(79,216,176,.35)", bg: "rgba(79,216,176,.09)" });
  if (a.best.m >= 5) badges.push({ key: "dbl", label: "Fraqueza dupla", icon: AI("dano-super"), color: "#4fc47a", edge: "rgba(79,196,122,.32)", bg: "rgba(79,196,122,.07)" });
  if (a.worst.m >= 2.5) badges.push({ key: "dgr", label: "Ele bate super em você", icon: AI("recebe-muito"), color: "#ff6b55", edge: "rgba(255,107,85,.32)", bg: "rgba(255,107,85,.07)" });
  if (cover.includes(a.best.type)) badges.push({ key: "cov", label: `Precisa de ${T[a.best.type]}`, icon: TI(a.best.type), color: "#e5b34f", edge: "rgba(229,179,79,.32)", bg: "rgba(229,179,79,.07)" });

  const rows = [
    { key: "d", title: "Você causa", tier: a.dealt.tier, color: a.dealt.color, x: fx(a.best.m), pct: clamp(a.best.m / 5.5 * 100, 3, 100), icon: a.dealt.icon, typeIcon: TI(a.best.type), detail: `${T[a.best.type]} · ${cover.includes(a.best.type) ? "golpe de cobertura" : "tipo dele"}` },
    { key: "t", title: "Você recebe", tier: a.taken.tier, color: a.taken.color, x: fx(a.worst.m), pct: clamp(a.worst.m / 5.5 * 100, 3, 100), icon: a.taken.icon, typeIcon: TI(a.worst.type), detail: `${a.worst.name} · ${T[a.worst.type]}` },
  ];

  return (
    <article style={{ position: "relative", overflow: "hidden", border: `1px solid ${edge}`, borderRadius: 16, background: "linear-gradient(160deg,rgba(255,255,255,.03),rgba(0,0,0,.3)),#100b09", opacity: a.verdict.keep ? 1 : .58 }}>
      <span style={{ position: "absolute", inset: "0 0 auto", height: 2, background: `linear-gradient(90deg,${tone},transparent)` }} />
      <div style={{ display: "flex", gap: 12, padding: "13px 13px 10px" }}>
        <div style={{ position: "relative", width: 78, height: 78, flex: "0 0 78px", borderRadius: 14, border: `1px solid ${edge}`, background: `radial-gradient(70% 70% at 50% 32%,${glow},rgba(0,0,0,.55))` }}>
          <span style={{ position: "absolute", inset: 4, ...bgIcon(sprite(a.target.n)), imageRendering: "pixelated", filter: "drop-shadow(0 5px 9px rgba(0,0,0,.65))" }} />
          <span className="mono" style={{ position: "absolute", bottom: -7, left: "50%", transform: "translateX(-50%)", padding: "1px 7px", borderRadius: 99, border: "1px solid rgba(216,138,74,.2)", background: "#0d0908", fontSize: 9, fontWeight: 700, color: "#7d6d64" }}>#{String(a.target.n).padStart(3, "0")}</span>
        </div>
        <div style={{ display: "grid", gap: 6, alignContent: "start", minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <b style={{ fontFamily: "Cinzel,serif", fontSize: 16.5, color: "#f7eee7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.target.displayName}</b>
            {isTop && <span style={{ flex: "0 0 auto", padding: "2px 8px", borderRadius: 99, border: "1px solid rgba(229,179,79,.45)", background: "rgba(229,179,79,.12)", fontSize: 8.5, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#e5b34f" }}>Melhor daqui</span>}
          </div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {a.target.t.map((t) => (
              <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 9px 2px 3px", borderRadius: 99, border: "1px solid rgba(216,138,74,.18)", background: "rgba(0,0,0,.4)", fontSize: 9, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "#d9c9bf" }}>
                <span style={{ width: 17, height: 17, ...bgIcon(TI(t)) }} />{T[t]}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 26, height: 26, flex: "0 0 26px", ...bgIcon(a.verdict.icon) }} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: tone }}>{a.verdict.label}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 9, padding: "10px 13px 12px", margin: "0 10px", borderTop: "1px solid rgba(216,138,74,.1)" }}>
        {rows.map((r) => (
          <div key={r.key} style={{ display: "grid", gridTemplateColumns: "28px minmax(0,1fr) auto", gap: 9, alignItems: "center" }}>
            <span style={{ width: 28, height: 28, ...bgIcon(r.icon) }} />
            <span style={{ display: "grid", gap: 4, minWidth: 0 }}>
              <span style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                <span style={sectionCap}>{r.title}</span>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: r.color }}>{r.tier}</span>
              </span>
              <span style={{ display: "block", height: 5, borderRadius: 99, background: "rgba(255,255,255,.07)", overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", borderRadius: "inherit", width: `${r.pct}%`, background: `linear-gradient(90deg,${r.color},${r.color}88)` }} />
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                <span style={{ width: 15, height: 15, flex: "0 0 15px", ...bgIcon(r.typeIcon) }} />
                <small style={{ fontSize: 10.5, color: "#b5a196", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.detail}</small>
              </span>
            </span>
            <b className="mono" style={{ fontSize: 15, color: r.color, alignSelf: "start" }}>{r.x}</b>
          </div>
        ))}
      </div>

      {badges.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "0 13px 13px" }}>
          {badges.map((bd) => (
            <span key={bd.key} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 10px 4px 4px", borderRadius: 99, border: `1px solid ${bd.edge}`, background: bd.bg }}>
              <span style={{ width: 22, height: 22, ...bgIcon(bd.icon) }} />
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: bd.color }}>{bd.label}</span>
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
