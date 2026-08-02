import { useEffect, useState, type CSSProperties } from "react";
import { loadPokemonCatalog, type PokemonDexEntry } from "../services/ivCalculator";
import { PokemonPicker } from "../components/PokemonPicker";

const AI = (k: string) => `/assets/vplab/route/alerts/${k}.png`;
const sprite = (n: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${n}.png`;

const RULES = { unlock: 60, maxDiff: 0.15, kills: 3000, cap: 6, wildCap: 1.8, instantHatchDD: 2, slotDD: 30, slotsStart: 2, slotsMax: 6, ivChance: 0.05 };
const QTIERS: Array<[number, string]> = [[.8, "Fraca"], [1, "Comum"], [1.1, "Incomum"], [1.3, "Rara"], [1.5, "Épica"], [1.7, "Lendária"], [2, "Mítica"], [3, "Anciã"], [4, "Divina"]];
const tierName = (q: number) => ([...QTIERS].reverse().find(([m]) => q >= m - 1e-9) || QTIERS[0])[1];
const GAINS = {
  free: { title: "Caminho gratuito", tone: "#b5a196", copy: "Ganho pequeno por ovo. A linhagem avança aos poucos, repetindo breeds e incubações.", dist: [[0.005, 50], [0.010, 35], [0.020, 12], [0.040, 3]] as Array<[number, number]> },
  pheromone: { title: "Com Strange Pheromone", tone: "#e5b34f", copy: "Amplia as faixas de ganho e reduz muito o número de gerações — mas consome um feromônio por ovo.", dist: [[0.15, 50], [0.20, 30], [0.25, 15], [0.30, 5]] as Array<[number, number]> },
};
type RouteKey = keyof typeof GAINS;
const PHEROMONE_VALUE = 1000000;

const num = (n: number) => Math.round(n || 0).toLocaleString("pt-BR");
const q3 = (n: number) => Number(n || 0).toFixed(3).replace(".", ",");
const q2 = (n: number) => Number(n || 0).toFixed(2).replace(".", ",");
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const expected = (key: RouteKey) => GAINS[key].dist.reduce((s, [g, p]) => s + g * p / 100, 0);

const panel: CSSProperties = {
  background: "linear-gradient(160deg,rgba(30,18,16,.95),rgba(13,8,7,.95))",
  border: "1px solid rgba(216,138,74,.18)", borderRadius: 22, boxShadow: "0 10px 30px rgba(0,0,0,.35)",
};
const bgIcon = (url: string): CSSProperties => ({ backgroundImage: `url(${url})`, backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center" });
const uLabel: CSSProperties = { fontSize: 10, letterSpacing: ".09em", textTransform: "uppercase", color: "#b5a196", fontWeight: 700 };
const eyebrow: CSSProperties = { display: "block", color: "#d98350", textTransform: "uppercase", letterSpacing: ".22em", fontSize: 11, fontWeight: 800, marginBottom: 8 };
const sectionCap: CSSProperties = { fontSize: 10, fontWeight: 800, letterSpacing: ".13em", textTransform: "uppercase", color: "#7d6d64" };

const SCOPED_CSS = `
.breedv2 .mono{font-variant-numeric:tabular-nums;font-family:ui-monospace,"Cascadia Code",Consolas,monospace}
.breedv2 input,.breedv2 select{font:inherit;color:#f7eee7;width:100%;min-width:0;padding:11px 13px;border:1px solid rgba(216,138,74,.18);border-radius:10px;background:#0b0706;transition:border-color .15s,box-shadow .15s}
.breedv2 input:focus,.breedv2 select:focus{outline:none;border-color:#e5b34f;box-shadow:0 0 0 3px rgba(229,179,79,.09)}
`;

export function BreedingPage() {
  const [catalog, setCatalog] = useState<PokemonDexEntry[]>([]);
  const [slug, setSlug] = useState("charizard");
  const [qa, setQa] = useState<string | number>(1.12);
  const [qb, setQb] = useState<string | number>(1.20);
  const [iva, setIva] = useState<string | number>(118);
  const [ivb, setIvb] = useState<string | number>(132);
  const [stones, setStones] = useState(true);
  const [pheromone, setPheromone] = useState(false);
  const [target, setTarget] = useState<string | number>(1.5);

  useEffect(() => { loadPokemonCatalog().then(setCatalog).catch(() => setCatalog([])); }, []);

  const sp = catalog.find((d) => d.s === slug);
  const dexNo = sp ? sp.n : 6;
  const nqa = +qa || 0, nqb = +qb || 0;
  const niva = Math.max(0, +iva || 0), nivb = Math.max(0, +ivb || 0);
  const bestIsA = nqa >= nqb;
  const bestQ = Math.max(nqa, nqb), lowQ = Math.min(nqa, nqb);
  const diff = Math.round((bestQ - lowQ) * 1000) / 1000;
  const inheritedIv = bestIsA ? niva : nivb;
  const routeKey: RouteKey = pheromone ? "pheromone" : "free";
  const ok = diff <= RULES.maxDiff + 1e-9;

  const targetValue = () => { const n = parseFloat(String(target ?? "").replace(",", ".")); return Number.isFinite(n) && n > 0 ? n : 0.8; };
  const tgt = clamp(targetValue(), 0.8, RULES.cap);

  const plan = (key: RouteKey, from: number) => {
    const gain = expected(key);
    const missing = Math.max(0, tgt - from);
    const eggs = missing === 0 ? 0 : Math.ceil(+(missing / gain).toFixed(6));
    const best = GAINS[key].dist[GAINS[key].dist.length - 1][0];
    return { key, gain, eggs, target: tgt, bestCase: missing === 0 ? 0 : Math.ceil(+(missing / best).toFixed(6)), kills: eggs * RULES.kills, parents: eggs + 1, hatchDD: eggs * RULES.instantHatchDD, pheromones: key === "pheromone" ? eggs : 0 };
  };

  const compat = ok
    ? { label: "Par compatível", icon: AI("par-compativel"), color: "#4fc47a", edge: "rgba(79,196,122,.34)", bg: "rgba(79,196,122,.08)", detail: `Diferença dentro do limite de ${q2(RULES.maxDiff)}. O filhote herda os IVs do pai de maior Quality (${bestIsA ? "pai A" : "pai B"}).`, diff: q3(diff) }
    : { label: "Par rejeitado pelo jogo", icon: AI("par-rejeitado"), color: "#ff6b55", edge: "rgba(255,107,85,.34)", bg: "rgba(255,107,85,.08)", detail: `No breed normal a diferença máxima é ${q2(RULES.maxDiff)}. Aproxime as Qualities — precisa reduzir ${q3(diff - RULES.maxDiff)}.`, diff: q3(diff) };

  const dist = GAINS[routeKey].dist;
  const outcomes = dist.map(([g, p]) => {
    const result = Math.min(RULES.cap, bestQ + g);
    const capped = bestQ + g > RULES.cap;
    return { key: g, gain: "+" + q3(g), chance: p + "%", pct: Math.max(4, p), result: q3(result) + (capped ? " (teto)" : ""), color: p >= 40 ? "#b5a196" : p >= 25 ? "#4fc47a" : p >= 10 ? "#e5b34f" : "#ff8f7d" };
  });
  const expGain = expected(routeKey);
  const expQuality = Math.min(RULES.cap, bestQ + expGain);

  const plans = [plan("free", bestQ), plan("pheromone", bestQ)];
  const fastest = plans.reduce((a, b) => a.eggs <= b.eggs ? a : b);

  const ladderPlan = plan(routeKey, bestQ);
  const totalGens = Math.max(1, ladderPlan.eggs);
  const ladderSteps = Math.min(8, totalGens);
  const ovos = (n: number) => num(n) + (n === 1 ? " ovo" : " ovos");
  const ladder: Array<{ key: string; label: string; quality: string; kills: string; color: string; edge: string; bg: string }> = Array.from({ length: ladderSteps }, (_, i) => {
    const q = Math.min(RULES.cap, bestQ + expGain * (i + 1));
    const done = q >= tgt - 1e-9;
    return { key: String(i), label: "Gen " + (i + 1), quality: q3(q), kills: num((i + 1) * RULES.kills) + " abates", color: done ? "#4fc47a" : "#f7eee7", edge: done ? "rgba(79,196,122,.4)" : "rgba(216,138,74,.16)", bg: done ? "rgba(79,196,122,.08)" : "rgba(0,0,0,.26)" };
  });
  const hiddenGens = totalGens - ladderSteps;
  if (hiddenGens > 0) ladder.push({ key: "rest", label: "+" + hiddenGens + " gera" + (hiddenGens === 1 ? "ção" : "ções"), quality: q3(tgt), kills: num(totalGens * RULES.kills) + " no total", color: "#e5b34f", edge: "rgba(229,179,79,.4)", bg: "rgba(229,179,79,.09)" });

  const roster = [...catalog].filter((d) => !d.boss).sort((a, b) => a.m.localeCompare(b.m));
  const overCap = targetValue() > RULES.cap + 1e-9;

  const parents = [
    { key: "a", label: "Pai A", quality: qa, iv: iva, setQuality: setQa, setIv: setIva, role: bestIsA ? "maior Quality — herda os IVs" : "menor Quality", tone: bestIsA ? "#4fc47a" : "#7d6d64", edge: bestIsA ? "rgba(79,196,122,.34)" : "rgba(216,138,74,.16)", bg: bestIsA ? "rgba(79,196,122,.06)" : "rgba(0,0,0,.26)" },
    { key: "b", label: "Pai B", quality: qb, iv: ivb, setQuality: setQb, setIv: setIvb, role: !bestIsA ? "maior Quality — herda os IVs" : "menor Quality", tone: !bestIsA ? "#4fc47a" : "#7d6d64", edge: !bestIsA ? "rgba(79,196,122,.34)" : "rgba(216,138,74,.16)", bg: !bestIsA ? "rgba(79,196,122,.06)" : "rgba(0,0,0,.26)" },
  ] as const;

  const options = [
    { key: "ph", label: "Usar Strange Pheromone", sub: "Salto de +0,15 a +0,30 na Quality. Não melhora IV.", on: pheromone, toggle: () => setPheromone((v) => !v), color: "#e5b34f" },
    { key: "st", label: "Dobrar as Stones", sub: "Dobra as pedras exigidas e dá 5% de chance de +1 IV em um status aleatório.", on: stones, toggle: () => setStones((v) => !v), color: "#4fc47a" },
  ];

  const childCards = [
    { label: "Quality esperada", value: q3(expQuality), note: `média de +${q3(expGain)} por ovo`, color: "#e5b34f", edge: "rgba(229,179,79,.3)", bg: "linear-gradient(160deg,rgba(229,179,79,.1),rgba(13,8,7,.5))" },
    { label: "Melhor caso", value: q3(Math.min(RULES.cap, bestQ + dist[dist.length - 1][0])), note: `${dist[dist.length - 1][1]}% de chance`, color: "#4fc47a", edge: "rgba(79,196,122,.28)", bg: "rgba(79,196,122,.06)" },
    { label: "IV herdado", value: num(inheritedIv) + " / 192", note: `vem do ${bestIsA ? "pai A" : "pai B"}, o de maior Quality`, color: "#f7eee7", edge: "rgba(216,138,74,.16)", bg: "rgba(0,0,0,.26)" },
    { label: "IV com Stones", value: stones ? num(Math.min(192, inheritedIv + 1)) + " em 5%" : "—", note: stones ? "5% de chance de +1 IV em UM status aleatório; nos outros 95% o filhote nasce com o IV herdado" : "ative dobrar Stones", color: stones ? "#4fc47a" : "#7d6d64", edge: "rgba(216,138,74,.16)", bg: "rgba(0,0,0,.26)" },
  ];

  const routes = plans.map((p) => {
    const g = GAINS[p.key];
    return {
      key: p.key, title: g.title, copy: g.copy, tone: g.tone, isBest: p === fastest && p.eggs > 0,
      edge: p === fastest ? "rgba(229,179,79,.4)" : "rgba(216,138,74,.16)",
      bg: p === fastest ? "linear-gradient(160deg,rgba(229,179,79,.08),rgba(13,8,7,.6))" : "rgba(0,0,0,.26)",
      rows: [
        { key: 1, label: "Ovos até a meta", value: p.eggs === 0 ? "já chegou" : ovos(p.eggs), color: "#e5b34f", bg: "rgba(255,255,255,.03)" },
        { key: 2, label: "Abates para chocar", value: num(p.kills), color: "#f7eee7", bg: "rgba(0,0,0,.28)" },
        { key: 3, label: "Pokémon consumidos", value: num(p.parents), color: "#ff8f7d", bg: "rgba(255,255,255,.03)" },
        { key: 4, label: "Ganho médio por ovo", value: "+" + q3(p.gain), color: "#b5a196", bg: "rgba(0,0,0,.28)" },
        { key: 5, label: p.key === "pheromone" ? "Feromônios" : "Itens extras", value: p.key === "pheromone" ? num(p.pheromones) : "nenhum", color: p.key === "pheromone" ? "#e5b34f" : "#7d6d64", bg: "rgba(255,255,255,.03)" },
      ],
      chips: [
        `melhor caso: ${p.bestCase === 0 ? "nenhum ovo" : ovos(p.bestCase)}`,
        `eclosão instantânea: ${num(p.hatchDD)} DD`,
        ...(p.key === "pheromone" ? [`feromônio: valor de catálogo $${num(PHEROMONE_VALUE)} cada`] : []),
      ],
    };
  });

  const rules = [
    { value: "Nv " + RULES.unlock, label: "Desbloqueio", note: "o Centro de Breeding abre nesse nível." },
    { value: "Mesma espécie", label: "Par obrigatório", note: "os dois pais precisam ser da mesma espécie." },
    { value: "Até " + q2(RULES.maxDiff), label: "Diferença de Quality", note: "acima disso o jogo rejeita o breed normal." },
    { value: "1,80 → 4,0+", label: "Teto de Quality", note: "1,80 é o limite da captura selvagem; só breeding e shiny alcançam Mítica, Anciã e Divina." },
    { value: num(RULES.kills), label: "Abates para chocar", note: "cada abate válido na hunt soma ao contador do ovo." },
    { value: "2 pais", label: "Consumidos no breed", note: "não voltam depois que o ovo é criado." },
    { value: "5%", label: "Chance de +1 IV", note: "com Stones dobradas, em um status aleatório — não em todos." },
    { value: RULES.slotsStart + "→" + RULES.slotsMax, label: "Slots de incubadora", note: `próximo slot por ${RULES.slotDD} diamonds; eclosão instantânea por ${RULES.instantHatchDD}.` },
  ];

  const ladderNote = hiddenGens > 0 ? `mostrando Gen 1–8 de ${totalGens} · a meta ${q2(tgt)} chega na Gen ${totalGens}` : "valor esperado por ovo";

  return (
    <main className="breedv2" style={{ padding: "26px 0 90px" }}>
      <style>{SCOPED_CSS}</style>
      <div style={{ width: "min(1200px,calc(100% - 44px))", marginInline: "auto", display: "grid", gap: 16 }}>

        {/* ---- Calculadora ---- */}
        <section style={{ ...panel, padding: 24 }}>
          <span style={eyebrow}>Centro de Breeding · calculadora</span>
          <h2 style={{ fontFamily: "Cinzel,serif", fontSize: 21, margin: "0 0 4px" }}>Simule o ovo antes de gastar os pais</h2>
          <p style={{ color: "#b5a196", fontSize: 13, margin: "0 0 18px", maxWidth: 790 }}>Coloque a Quality e o IV dos dois pais. O VPLab valida o par, mostra a <b style={{ color: "#f7eee7" }}>distribuição real de ganho</b>, o IV provável do filhote e quantas gerações, abates e diamonds faltam até a sua meta — comparando <b style={{ color: "#f7eee7" }}>grátis × feromônio</b> com números.</p>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.15fr)", gap: 16, alignItems: "start" }}>
            {/* Left */}
            <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
                <span style={uLabel}>Espécie do par</span>
                <PokemonPicker ariaLabel="Buscar espécie do par" options={roster.map((d) => ({ slug: d.s, name: d.m, dexNo: d.n }))} value={slug} onSelect={setSlug} />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 11 }}>
                {parents.map((p) => (
                  <div key={p.key} style={{ padding: 13, border: `1px solid ${p.edge}`, borderRadius: 15, background: p.bg, display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <span style={{ width: 48, height: 48, flex: "0 0 48px", borderRadius: 12, border: `1px solid ${p.edge}`, backgroundColor: "rgba(0,0,0,.35)", backgroundImage: `url(${sprite(dexNo)})`, backgroundSize: "78%", backgroundRepeat: "no-repeat", backgroundPosition: "center", imageRendering: "pixelated" }} />
                      <span style={{ display: "grid", gap: 2, minWidth: 0 }}>
                        <b style={{ fontSize: 12, color: "#f7eee7" }}>{p.label}</b>
                        <small style={{ fontSize: 10, color: p.tone, fontWeight: 700 }}>{p.role}</small>
                      </span>
                    </div>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                      <span style={{ fontSize: 9.5, letterSpacing: ".09em", textTransform: "uppercase", color: "#b5a196", fontWeight: 700 }}>Quality</span>
                      <input className="mono" type="number" step="0.001" min="0.8" max="1.8" value={p.quality} onChange={(e) => p.setQuality(e.target.value)} style={{ textAlign: "center" }} />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                      <span style={{ fontSize: 9.5, letterSpacing: ".09em", textTransform: "uppercase", color: "#b5a196", fontWeight: 700 }}>IV total</span>
                      <input className="mono" type="number" min="0" max="192" value={p.iv} onChange={(e) => p.setIv(e.target.value)} style={{ textAlign: "center" }} />
                    </label>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gap: 7 }}>
                <span style={uLabel}>Adicionais deste breed</span>
                <div style={{ display: "grid", gap: 7 }}>
                  {options.map((o) => (
                    <span key={o.key} onClick={o.toggle} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 13px", border: `1px solid ${o.on ? (o.key === "ph" ? "rgba(229,179,79,.4)" : "rgba(79,196,122,.34)") : "rgba(216,138,74,.16)"}`, borderRadius: 12, background: o.on ? (o.key === "ph" ? "rgba(229,179,79,.08)" : "rgba(79,196,122,.06)") : "rgba(0,0,0,.26)", cursor: "pointer" }}>
                      <span style={{ display: "grid", placeItems: "center", width: 20, height: 20, flex: "0 0 20px", borderRadius: 6, border: `1.5px solid ${o.on ? o.color : "rgba(216,138,74,.3)"}`, background: o.on ? o.color : "transparent", fontSize: 12, fontWeight: 800, color: "#0a0605" }}>{o.on ? "✓" : ""}</span>
                      <span style={{ display: "grid", gap: 2, minWidth: 0, flex: 1 }}>
                        <b style={{ fontSize: 12, color: o.on ? o.color : "#f7eee7" }}>{o.label}</b>
                        <small style={{ fontSize: 10.5, color: "#b5a196", lineHeight: 1.4 }}>{o.sub}</small>
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
                <span style={uLabel}>Meta de Quality</span>
                <input className="mono" type="number" step="0.05" min="0.8" max="6" value={target} onChange={(e) => setTarget(e.target.value)} style={{ textAlign: "center", borderColor: "rgba(229,179,79,.3)", color: "#e5b34f", fontWeight: 700 }} />
                <small style={{ fontSize: 10.5, color: "#7d6d64", lineHeight: 1.4 }}>1,80 = teto selvagem · acima disso só com breeding</small>
                {overCap && <small style={{ fontSize: 10.5, color: "#e0a93c", lineHeight: 1.4 }}>Meta de {q2(targetValue())} está acima da faixa Divina coberta pela calculadora ({q2(RULES.cap)}). Os números abaixo usam {q2(RULES.cap)}.</small>}
              </label>
            </div>

            {/* Right */}
            <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "13px 15px", border: `1px solid ${compat.edge}`, borderRadius: 15, background: compat.bg }}>
                <span style={{ width: 40, height: 40, flex: "0 0 40px", ...bgIcon(compat.icon) }} />
                <div style={{ display: "grid", gap: 3, minWidth: 0, flex: 1 }}>
                  <b style={{ fontFamily: "Cinzel,serif", fontSize: 17, color: compat.color }}>{compat.label}</b>
                  <small style={{ fontSize: 11.5, color: "#b5a196", lineHeight: 1.4 }}>{compat.detail}</small>
                </div>
                <span className="mono" style={{ padding: "5px 11px", borderRadius: 99, border: `1px solid ${compat.color}55`, background: `${compat.color}14`, fontSize: 11.5, fontWeight: 700, color: compat.color }}>Δ {compat.diff}</span>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 9 }}>
                  <span style={sectionCap}>Filhote — distribuição de Quality</span>
                  <span className="mono" style={{ fontSize: 11, color: "#b5a196" }}>base {q3(bestQ)}</span>
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  {outcomes.map((o) => (
                    <div key={o.key} style={{ display: "grid", gridTemplateColumns: "64px minmax(0,1fr) 88px", gap: 10, alignItems: "center" }}>
                      <span className="mono" style={{ fontSize: 11.5, fontWeight: 700, color: o.color }}>{o.gain}</span>
                      <span style={{ display: "block", height: 9, borderRadius: 99, background: "rgba(255,255,255,.06)", overflow: "hidden", border: "1px solid rgba(216,138,74,.12)" }}>
                        <span style={{ display: "block", height: "100%", borderRadius: "inherit", width: `${o.pct}%`, background: `linear-gradient(90deg,${o.color},${o.color}88)` }} />
                      </span>
                      <span className="mono" style={{ fontSize: 11.5, color: "#f7eee7", textAlign: "right" }}>{o.result} <small style={{ color: "#7d6d64" }}>{o.chance}</small></span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(138px,1fr))", gap: 9 }}>
                {childCards.map((c) => (
                  <div key={c.label} style={{ padding: "12px 13px", border: `1px solid ${c.edge}`, borderRadius: 13, background: c.bg }}>
                    <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".11em", textTransform: "uppercase", color: "#7d6d64" }}>{c.label}</div>
                    <div className="mono" style={{ marginTop: 5, fontSize: 18, fontWeight: 700, color: c.color }}>{c.value}</div>
                    <div style={{ marginTop: 3, fontSize: 10.5, color: "#b5a196", lineHeight: 1.35 }}>{c.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---- Grátis × feromônio ---- */}
        <section style={{ ...panel, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 15 }}>
            <div>
              <span style={eyebrow}>Grátis × feromônio</span>
              <h2 style={{ fontFamily: "Cinzel,serif", fontSize: 20, margin: "0 0 4px" }}>Quanto custa chegar em {q2(tgt)} ({tierName(tgt)})</h2>
              <p style={{ color: "#b5a196", fontSize: 13, margin: 0, maxWidth: 640 }}>Partindo de {q3(bestQ)} ({tierName(bestQ)}), com o ganho médio de cada caminho. 1,80 é o teto de <b style={{ color: "#f7eee7" }}>captura selvagem</b> — breeding é o único jeito de alcançar Mítica, Anciã e Divina. Cada ovo consome os dois pais e precisa de 3.000 abates para chocar.</p>
              <p className="mono" style={{ margin: "6px 0 0", fontSize: 11, color: "#7d6d64" }}>ovos = arredonda para cima de ({q2(tgt)} − {q3(bestQ)}) ÷ ganho médio do caminho</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12 }}>
            {routes.map((r) => (
              <article key={r.key} style={{ position: "relative", overflow: "hidden", padding: 18, border: `1px solid ${r.edge}`, borderRadius: 18, background: r.bg }}>
                <span style={{ position: "absolute", inset: "0 0 auto", height: 2, background: `linear-gradient(90deg,${r.tone},transparent)` }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 13 }}>
                  <div>
                    <b style={{ fontFamily: "Cinzel,serif", fontSize: 18, color: r.tone }}>{r.title}</b>
                    <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "#b5a196", lineHeight: 1.45, maxWidth: 280 }}>{r.copy}</p>
                  </div>
                  {r.isBest && <span style={{ flex: "0 0 auto", padding: "3px 9px", borderRadius: 99, border: "1px solid rgba(229,179,79,.45)", background: "rgba(229,179,79,.12)", fontSize: 8.5, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#e5b34f" }}>Mais rápido</span>}
                </div>
                <div style={{ display: "grid", gap: 7 }}>
                  {r.rows.map((row) => (
                    <div key={row.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, padding: "8px 11px", borderRadius: 10, background: row.bg }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "#7d6d64" }}>{row.label}</span>
                      <b className="mono" style={{ fontSize: 13.5, color: row.color }}>{row.value}</b>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {r.chips.map((c, i) => (
                    <span key={i} className="mono" style={{ padding: "4px 9px", borderRadius: 8, border: "1px solid rgba(216,138,74,.18)", background: "rgba(0,0,0,.3)", fontSize: 10, color: "#b5a196" }}>{c}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 9 }}>
              <span style={sectionCap}>Linhagem geração por geração — {GAINS[routeKey].title.toLowerCase()}</span>
              <span style={{ fontSize: 11, color: "#7d6d64" }}>{ladderNote}</span>
            </div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {ladder.map((g) => (
                <span key={g.key} style={{ display: "grid", gap: 2, justifyItems: "center", padding: "9px 13px", border: `1px solid ${g.edge}`, borderRadius: 12, background: g.bg, minWidth: 88 }}>
                  <small style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#7d6d64" }}>{g.label}</small>
                  <b className="mono" style={{ fontSize: 14, color: g.color }}>{g.quality}</b>
                  <small className="mono" style={{ fontSize: 9, color: "#7d6d64" }}>{g.kills}</small>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ---- Regras do sistema ---- */}
        <section style={{ ...panel, padding: 24 }}>
          <span style={eyebrow}>Regras do sistema</span>
          <h2 style={{ fontFamily: "Cinzel,serif", fontSize: 20, margin: "0 0 14px" }}>O que o jogo exige e o que ele consome</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(196px,1fr))", gap: 9 }}>
            {rules.map((r, i) => (
              <div key={i} style={{ padding: 13, border: "1px solid rgba(216,138,74,.16)", borderRadius: 13, background: "rgba(0,0,0,.26)" }}>
                <b className="mono" style={{ display: "block", fontSize: 16, color: "#e5b34f" }}>{r.value}</b>
                <b style={{ display: "block", marginTop: 3, fontSize: 11.5, color: "#f7eee7" }}>{r.label}</b>
                <small style={{ display: "block", marginTop: 3, fontSize: 10.5, color: "#b5a196", lineHeight: 1.4 }}>{r.note}</small>
              </div>
            ))}
          </div>
        </section>

        <p style={{ margin: 0, color: "#7d6d64", fontSize: 11, lineHeight: 1.6, maxWidth: 880 }}>Regras e probabilidades conforme o guia de Breeding do próprio VPLab (<span className="mono">breeding-ui.js</span>) e a estrutura confirmada na API do jogo: ganhos de Quality, limite de 0,15, teto 1,80, 3.000 abates por ovo e 5% de +1 IV em um status aleatório com Stones dobradas. Custos de gold e Stones variam por par; confira a análise no jogo antes de confirmar.</p>
      </div>
    </main>
  );
}
