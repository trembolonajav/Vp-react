import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type DragEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { findSpecies, loadPokemonCatalog, type PokemonDexEntry } from "../services/ivCalculator";
import { scanPokeIdleImage } from "../services/paddleIvScanner";
import { PokemonPicker } from "../components/PokemonPicker";

const T: Record<string, string> = {
  normal: "Normal", fire: "Fogo", water: "Água", electric: "Elétrico", grass: "Planta", ice: "Gelo",
  fighting: "Lutador", poison: "Veneno", ground: "Terra", flying: "Voador", psychic: "Psíquico", bug: "Inseto",
  rock: "Pedra", ghost: "Fantasma", dragon: "Dragão", dark: "Sombrio", steel: "Aço", fairy: "Fada",
};
const TI = (k: string) => `/assets/vplab/route/types-v2/${k}.png`;
const EXP = [0.95, 0.80, 0.80, 0.80, 0.80, 0.95];
const STAT = ["HP", "Ataque", "Defesa", "Atq. Esp.", "Def. Esp.", "Velocid."];
const SHORT = ["HP", "ATK", "DEF", "SPA", "SPD", "VEL"];
const WILD_CAP = 1.8;
const TIERS = [
  { min: .8, max: 1, nome: "Fraca", cor: "#8d8d9c", origem: "captura selvagem" },
  { min: 1, max: 1.1, nome: "Comum", cor: "#b5a196", origem: "captura selvagem" },
  { min: 1.1, max: 1.3, nome: "Incomum", cor: "#4fc47a", origem: "captura selvagem" },
  { min: 1.3, max: 1.5, nome: "Rara", cor: "#5b9bd8", origem: "captura selvagem" },
  { min: 1.5, max: 1.7, nome: "Épica", cor: "#a86fd8", origem: "captura selvagem" },
  { min: 1.7, max: 1.81, nome: "Lendária", cor: "#e5b34f", origem: "teto da captura selvagem" },
  { min: 1.81, max: 2, nome: "Acima do selvagem", cor: "#ffb347", origem: "só shiny ou breeding" },
  { min: 2, max: 3, nome: "Mítica", cor: "#ff8f7d", origem: "só shiny ou breeding" },
  { min: 3, max: 4, nome: "Anciã", cor: "#83b9ff", origem: "breeding de alta geração" },
  { min: 4, max: 99, nome: "Divina", cor: "#4fd8b0", origem: "breeding de altíssima geração" },
];

const num = (n: number) => Math.round(n || 0).toLocaleString("pt-BR");
const dec = (n: number, d = 1) => Number(n || 0).toFixed(d).replace(".", ",");
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const sprite = (n: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${n}.png`;
const statAt = (base: number, iv: number, lvl: number, q: number, i: number) => Math.round((base + 2 * iv) * (lvl / 100) * Math.pow(q, EXP[i]));
const powerOf = (bs: number[], lvl: number, q: number, ivs: number[] | number) => Math.round(bs.reduce((s, b, i) => s + statAt(b, Array.isArray(ivs) ? ivs[i] : ivs, lvl, q, i), 0) * q);
const tierOf = (q: number) => TIERS.find((t) => q >= t.min && q < t.max) || TIERS[TIERS.length - 1];
const ivColor = (iv: number) => iv >= 27 ? "#4fc47a" : iv >= 18 ? "#e5b34f" : iv >= 12 ? "#e0a93c" : "#ff6b55";
const EXAMPLE_IVS = [28, 31, 24, 17, 26, 22];
const verdictOf = (p: number) => p > 100 ? { label: "Acima do teto selvagem", color: "#4fd8b0" }
  : p >= 80 ? { label: "Exemplar excepcional", color: "#4fc47a" }
    : p >= 62 ? { label: "Muito bom", color: "#4fc47a" }
      : p >= 45 ? { label: "Bom", color: "#e5b34f" }
        : p >= 28 ? { label: "Mediano", color: "#e0a93c" }
          : { label: "Fraco", color: "#ff6b55" };

interface Card { slug: string; mode: "manual" | "image"; level: string; quality: string; ivTotal: string; power: string; stats: string[]; preview: string; scan: string }
const emptyCard = (slug = "scizor"): Card => ({ slug, mode: "manual", level: "", quality: "", ivTotal: "", power: "", stats: ["", "", "", "", "", ""], preview: "", scan: "" });

interface Analysis { sp: PokemonDexEntry; lvl: number; q: number; stats: number[]; mid: number[]; ivs: number[]; potential: number; confidence: number; impossible: boolean; saturated: number; total: { min: number; likely: number; max: number }; power: number }
function analyse(card: Card, catalog: PokemonDexEntry[]): Analysis | null {
  const sp = catalog.find((d) => d.s === card.slug) || catalog[0];
  if (!sp) return null;
  const lvl = +card.level, q = +String(card.quality).replace(",", ".");
  const stats = card.stats.map((v) => +v);
  if (!lvl || !(q >= 0.8 && q <= 12) || stats.some((v) => !v)) return null;
  const rawIv = (shown: number, i: number) => (shown / ((lvl / 100) * Math.pow(q, EXP[i])) - sp.bs[i]) / 2;
  const ivOf = (shown: number, i: number) => clamp(rawIv(shown, i), 0, 32);
  const mid = stats.map((v, i) => ivOf(v, i));
  const rawMid = stats.map((v, i) => rawIv(v, i));
  const rawLow = stats.map((v, i) => rawIv(v - 0.5, i));
  const rawHigh = stats.map((v, i) => rawIv(v + 0.5, i));
  const low = stats.map((v, i) => ivOf(v - 0.5, i));
  const high = stats.map((v, i) => ivOf(v + 0.5, i));
  const ivs = mid.map(Math.round);
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const spread = sum(rawHigh) - sum(rawLow);
  const impossible = rawMid.some((v) => v < -0.35 || v > 32.35);
  const saturated = rawMid.filter((v) => v >= 31.9).length;
  let confidence = clamp(100 - spread * 2.2, 35, 99);
  if (saturated >= 3) confidence = Math.min(confidence, 62);
  if (impossible) confidence = Math.min(confidence, 40);
  const physical = Math.pow(Math.max(0, sp.bs[1]), 4), special = Math.pow(Math.max(0, sp.bs[3]), 4);
  const offTotal = Math.max(1, physical + special);
  const w = [.11, .695 * (physical / offTotal), .09, .695 * (special / offTotal), .09, .015];
  const potential = clamp(w.reduce((acc, ww, i) => acc + ww * clamp(mid[i] / 32, 0, 1), 0) * Math.pow(q / WILD_CAP, 1.15) * 100, 0, 400);
  return { sp, lvl, q, stats, mid, ivs, potential, confidence, impossible, saturated, total: { min: Math.floor(sum(low)), likely: Math.round(sum(mid)), max: Math.ceil(sum(high)) }, power: Math.round(sum(stats) * q) };
}

const loadSprite = (n: number) => new Promise<HTMLImageElement | null>((res) => { const img = new Image(); img.crossOrigin = "anonymous"; img.onload = () => res(img); img.onerror = () => res(null); img.src = sprite(n); });

function cardCanvas(a: Analysis, img: HTMLImageElement | null) {
  const W = 1000, H = 580, cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d")!;
  g.fillStyle = "#0d0807"; g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(210, 160, 20, 210, 160, 640);
  glow.addColorStop(0, "rgba(194,54,41,.32)"); glow.addColorStop(1, "rgba(194,54,41,0)");
  g.fillStyle = glow; g.fillRect(0, 0, W, H);
  const sheen = g.createLinearGradient(0, 0, W, H);
  sheen.addColorStop(0, "rgba(255,255,255,.05)"); sheen.addColorStop(.55, "rgba(255,255,255,0)");
  g.fillStyle = sheen; g.fillRect(0, 0, W, H);
  const band = g.createLinearGradient(0, 0, W, 0);
  band.addColorStop(0, "#170807"); band.addColorStop(.5, "#a3231a"); band.addColorStop(1, "#170807");
  g.fillStyle = band; g.fillRect(0, 0, W, 56);
  g.fillStyle = "#f6dca8"; g.font = "800 18px Cinzel, Georgia, serif";
  g.fillText("V P L A B", 34, 36);
  g.fillStyle = "rgba(246,220,168,.72)"; g.font = "700 12px Inter, sans-serif";
  g.fillText("AVALIAÇÃO DE IV", 152, 35);
  g.textAlign = "right"; g.fillStyle = "rgba(246,220,168,.62)"; g.fillText("twitch.tv/vpertsz", W - 34, 35); g.textAlign = "left";
  const frame = (inset: number, color: string, width: number) => {
    const c = 22, x = inset, y = inset, w = W - inset * 2, h = H - inset * 2;
    g.strokeStyle = color; g.lineWidth = width; g.beginPath();
    g.moveTo(x + c, y); g.lineTo(x + w - c, y); g.lineTo(x + w, y + c); g.lineTo(x + w, y + h - c);
    g.lineTo(x + w - c, y + h); g.lineTo(x + c, y + h); g.lineTo(x, y + h - c); g.lineTo(x, y + c);
    g.closePath(); g.stroke();
  };
  frame(11, "rgba(229,179,79,.78)", 2.5); frame(17, "rgba(226,75,53,.32)", 1);
  const cx = 178, cy = 212;
  const medal = g.createRadialGradient(cx, cy - 24, 10, cx, cy, 106);
  medal.addColorStop(0, "rgba(229,179,79,.24)"); medal.addColorStop(1, "rgba(0,0,0,.5)");
  g.fillStyle = medal; g.beginPath(); g.arc(cx, cy, 94, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "rgba(229,179,79,.8)"; g.lineWidth = 2.5; g.beginPath(); g.arc(cx, cy, 94, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = "rgba(226,75,53,.5)"; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, 86, 0, Math.PI * 2); g.stroke();
  if (img) g.drawImage(img, cx - 76, cy - 80, 152, 152);
  g.textAlign = "center";
  g.fillStyle = "#f7eee7"; g.font = "800 30px Cinzel, Georgia, serif"; g.fillText(a.sp.m.toUpperCase(), cx, 352);
  g.strokeStyle = "rgba(229,179,79,.42)"; g.lineWidth = 1; g.beginPath(); g.moveTo(cx - 94, 368); g.lineTo(cx + 94, 368); g.stroke();
  g.fillStyle = "#e5b34f"; g.font = "700 15px Inter, sans-serif"; g.fillText("Nível " + num(a.lvl) + "  ·  Power " + num(a.power), cx, 392);
  a.sp.t.forEach((t, i) => {
    const tw = 92, total = a.sp.t.length * tw + (a.sp.t.length - 1) * 10;
    const x = cx - total / 2 + i * (tw + 10);
    g.fillStyle = "rgba(226,75,53,.15)"; g.fillRect(x, 414, tw, 30);
    g.strokeStyle = "rgba(229,179,79,.5)"; g.lineWidth = 1.2; g.strokeRect(x, 414, tw, 30);
    g.fillStyle = "#e8c9a8"; g.font = "800 12px Inter, sans-serif"; g.fillText((T[t] || t).toUpperCase(), x + tw / 2, 433);
  });
  g.textAlign = "left";
  const divg = g.createLinearGradient(0, 90, 0, H - 70);
  divg.addColorStop(0, "rgba(229,179,79,0)"); divg.addColorStop(.5, "rgba(229,179,79,.45)"); divg.addColorStop(1, "rgba(229,179,79,0)");
  g.strokeStyle = divg; g.lineWidth = 1.5; g.beginPath(); g.moveTo(348, 90); g.lineTo(348, H - 70); g.stroke();
  const L = 392;
  g.fillStyle = "#d98350"; g.font = "800 13px Inter, sans-serif"; g.fillText("POTENCIAL DO EXEMPLAR", L, 106);
  const grad = g.createLinearGradient(L, 112, L, 178);
  grad.addColorStop(0, "#ffe6a8"); grad.addColorStop(1, "#d98a1e");
  g.fillStyle = grad; g.font = "800 66px Cinzel, Georgia, serif";
  g.fillText(dec(a.potential, 0).replace(",0", "") + "%", L, 172);
  const verdict = a.potential > 100 ? "ACIMA DO SELVAGEM" : a.potential >= 80 ? "EXCEPCIONAL" : a.potential >= 62 ? "MUITO BOM" : a.potential >= 45 ? "BOM" : a.potential >= 28 ? "MEDIANO" : "FRACO";
  g.font = "800 24px Cinzel, Georgia, serif";
  const vw = g.measureText(verdict).width + 34;
  g.fillStyle = "rgba(226,75,53,.2)"; g.fillRect(W - 60 - vw, 128, vw, 46);
  g.strokeStyle = "rgba(226,75,53,.6)"; g.lineWidth = 1.5; g.strokeRect(W - 60 - vw, 128, vw, 46);
  g.fillStyle = "#ffd9cf"; g.textAlign = "center"; g.fillText(verdict, W - 60 - vw / 2, 160); g.textAlign = "left";
  ([["QUALIDADE", dec(a.q, 2) + " · " + tierOf(a.q).nome, L], ["IV TOTAL", a.total.likely + " / 192", L + 268]] as Array<[string, string, number]>).forEach(([label, value, x]) => {
    g.fillStyle = "#b5a196"; g.font = "700 12px Inter, sans-serif"; g.fillText(label, x, 214);
    g.fillStyle = "#f7eee7"; g.font = "700 24px ui-monospace, monospace"; g.fillText(value, x, 244);
    g.strokeStyle = "rgba(226,75,53,.65)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 254); g.lineTo(x + 42, 254); g.stroke();
  });
  STAT.forEach((label, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = L + col * 268, y = 302 + row * 66;
    g.fillStyle = "#b5a196"; g.font = "700 11px Inter, sans-serif"; g.fillText(label.toUpperCase(), x, y);
    g.fillStyle = ivColor(a.mid[i]); g.font = "700 15px ui-monospace, monospace"; g.textAlign = "right";
    g.fillText(dec(a.mid[i], 1) + "/32", x + 226, y); g.textAlign = "left";
    g.fillStyle = "rgba(255,255,255,.07)"; g.fillRect(x, y + 10, 226, 9);
    const bar = g.createLinearGradient(x, 0, x + 226, 0);
    bar.addColorStop(0, "#e24b35"); bar.addColorStop(1, ivColor(a.mid[i]));
    g.fillStyle = bar; g.fillRect(x, y + 10, Math.max(4, 226 * a.mid[i] / 32), 9);
    g.strokeStyle = "rgba(229,179,79,.3)"; g.lineWidth = 1; g.strokeRect(x, y + 10, 226, 9);
  });
  g.fillStyle = "rgba(0,0,0,.45)"; g.fillRect(17, H - 58, W - 34, 41);
  g.fillStyle = "#7d6d64"; g.font = "500 12px Inter, sans-serif"; g.fillText(dec(a.confidence, 0).replace(",0", "") + "% de confiança na estimativa", 40, H - 32);
  g.textAlign = "right"; g.fillStyle = "#e5b34f"; g.font = "800 13px Cinzel, Georgia, serif"; g.fillText("VP STORE · FERRAMENTA OFICIAL", W - 40, H - 32); g.textAlign = "left";
  return cv;
}

function compareCanvas(A: Analysis, B: Analysis) {
  const W = 1100, H = 620, cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d")!;
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#1e1210"); bg.addColorStop(1, "#0a0605");
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(229,179,79,.5)"; g.lineWidth = 3; g.strokeRect(8, 8, W - 16, H - 16);
  g.fillStyle = "#d98350"; g.font = "800 15px Inter, sans-serif"; g.fillText("VPLAB · COMPARAÇÃO", 44, 54);
  g.fillStyle = "#f7eee7"; g.font = "800 34px Cinzel, Georgia, serif"; g.fillText(`${A.sp.m} vs ${B.sp.m}`, 44, 98);
  ([[A, 470], [B, 700]] as Array<[Analysis, number]>).forEach(([side, x]) => {
    g.fillStyle = "#e5b34f"; g.font = "800 14px Inter, sans-serif"; g.textAlign = "right";
    g.fillText(side.sp.m + " Nv " + num(side.lvl), x + 100, 140); g.textAlign = "left";
  });
  const rows: Array<[string, number, number, number | null, number | null]> = [...STAT.map((label, i) => [label, A.stats[i], B.stats[i], A.mid[i], B.mid[i]] as [string, number, number, number, number]), ["Power", A.power, B.power, null, null]];
  rows.forEach(([label, va, vb, ia, ib], r) => {
    const y = 190 + r * 58;
    g.fillStyle = r % 2 ? "rgba(255,255,255,.02)" : "transparent"; g.fillRect(40, y - 28, W - 80, 50);
    g.fillStyle = "#f7eee7"; g.font = "700 16px Inter, sans-serif"; g.fillText(label, 56, y);
    g.textAlign = "right"; g.font = "700 20px ui-monospace, monospace";
    g.fillStyle = va >= vb ? "#e5b34f" : "#f7eee7"; g.fillText(num(va), 570, y);
    g.fillStyle = vb >= va ? "#e5b34f" : "#f7eee7"; g.fillText(num(vb), 800, y);
    const d = vb - va;
    g.fillStyle = d > 0 ? "#4fc47a" : d < 0 ? "#ff6b55" : "#7d6d64"; g.font = "700 17px ui-monospace, monospace";
    g.fillText((d > 0 ? "+" : "") + num(d), 950, y);
    g.fillText(va ? (d >= 0 ? "+" : "") + dec(d / va * 100, 1) + "%" : "—", 1050, y);
    if (ia !== null && ib !== null) {
      g.fillStyle = "#7d6d64"; g.font = "500 11px ui-monospace, monospace";
      g.fillText("IV " + dec(ia, 1), 570, y + 16); g.fillText("IV " + dec(ib, 1), 800, y + 16);
    }
    g.textAlign = "left";
  });
  g.fillStyle = "#7d6d64"; g.font = "500 12px Inter, sans-serif"; g.fillText("Estimativa do VPLab · vpertsz", 44, H - 26);
  return cv;
}

const panel: CSSProperties = {
  background: "linear-gradient(160deg,rgba(30,18,16,.95),rgba(13,8,7,.95))",
  border: "1px solid rgba(216,138,74,.18)", borderRadius: 20, boxShadow: "0 10px 30px rgba(0,0,0,.35)",
};
const bgIcon = (url: string): CSSProperties => ({ backgroundImage: `url(${url})`, backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center" });
const secCap: CSSProperties = { fontSize: 9.5, fontWeight: 800, letterSpacing: ".13em", textTransform: "uppercase", color: "#7d6d64" };
const eyebrow: CSSProperties = { display: "block", color: "#d98350", textTransform: "uppercase", letterSpacing: ".22em", fontSize: 11, fontWeight: 800, marginBottom: 8 };

const SCOPED_CSS = `
.ivv4 .mono{font-variant-numeric:tabular-nums;font-family:ui-monospace,"Cascadia Code",Consolas,monospace}
.ivv4 input,.ivv4 select{font:inherit;color:#f7eee7;width:100%;min-width:0;padding:11px 13px;border:1px solid rgba(216,138,74,.18);border-radius:10px;background:#0b0706;transition:border-color .15s,box-shadow .15s}
.ivv4 input:focus,.ivv4 select:focus{outline:none;border-color:#e5b34f;box-shadow:0 0 0 3px rgba(229,179,79,.09)}
.ivv4 [data-hover=x]:hover{color:#fff;filter:brightness(1.1)}
`;

const HELP_STEPS = [
  "Abra o card completo do Pokémon no jogo. Se precisar, aumente o zoom para os números ficarem nítidos.",
  "Tire um print sem cortes mostrando nome, nível, qualidade, Power, IV total e os seis stats.",
  "Clique em Selecionar print, arraste o arquivo ou simplesmente cole com Ctrl + V. PNG, JPG e WebP funcionam.",
  "Confira os valores antes de considerar o resultado — se algum número sair errado, corrija o campo na mão.",
];
const HELP_TIPS = [
  "Use imagem nítida, sem compressão forte ou partes cobertas.",
  "Evite prints muito pequenos, borrados ou com o card cortado.",
  "Nível baixo deixa a estimativa de IV imprecisa: quanto maior o nível, mais apertada a faixa.",
];
const HELP_CHIPS = [
  { label: "Inseto", color: "#d9e88f", edge: "rgba(188,212,79,.4)", bg: "rgba(188,212,79,.12)" },
  { label: "Aço", color: "#d7e2ea", edge: "rgba(200,212,221,.35)", bg: "rgba(200,212,221,.1)" },
  { label: "Lendária ×1,78", color: "#e5b34f", edge: "rgba(229,179,79,.45)", bg: "rgba(229,179,79,.12)" },
];
const HELP_STATS: Array<[string, number]> = [["HP", 575], ["Atk", 766], ["Def", 747], ["SpA", 560], ["SpD", 556], ["Vel", 538]];

export function IvScannerPage() {
  const [params] = useSearchParams();
  const [catalog, setCatalog] = useState<PokemonDexEntry[]>([]);
  const [cards, setCards] = useState<{ a: Card; b: Card }>({ a: emptyCard(), b: emptyCard() });
  const [target, setTarget] = useState<string | number>(300);
  const [helpOpen, setHelpOpen] = useState(false);
  const [note, setNote] = useState<{ a: string; b: string }>({ a: "", b: "" });
  const [busy, setBusy] = useState<{ a: boolean; b: boolean }>({ a: false, b: false });
  const lastSlot = useRef<"a" | "b">("a");

  const patch = (key: "a" | "b", changes: Partial<Card>) => setCards((c) => ({ ...c, [key]: { ...c[key], ...changes } }));

  const fillExample = (entries: PokemonDexEntry[]) => {
    const sp = entries.find((d) => d.s === "scizor") || entries[0];
    if (!sp) return;
    const mk = (lvl: number, q: number, ivs: number[]): Partial<Card> => ({
      slug: sp.s, mode: "manual", scan: "", preview: "",
      level: String(lvl), quality: String(q), ivTotal: String(ivs.reduce((x, y) => x + y, 0)),
      power: String(Math.round(sp.bs.reduce((s, b, i) => s + statAt(b, ivs[i], lvl, q, i), 0) * q)),
      stats: sp.bs.map((b, i) => String(statAt(b, ivs[i], lvl, q, i))),
    });
    setCards({ a: { ...emptyCard(), ...mk(302, 1.245, EXAMPLE_IVS) }, b: { ...emptyCard(), ...mk(302, 1.78, [22, 26, 19, 14, 21, 18]) } });
  };

  useEffect(() => {
    void loadPokemonCatalog().then((entries) => {
      setCatalog(entries);
      const requested = entries.find((x) => x.s === params.get("p"));
      if (requested) setCards((c) => ({ ...c, a: { ...c.a, slug: requested.s } }));
      else fillExample(entries);
    }).catch(() => setCatalog([]));
  }, [params]);

  const runOcr = async (key: "a" | "b", file: File) => {
    const url = URL.createObjectURL(file);
    lastSlot.current = key;
    patch(key, { preview: url, mode: "image" });
    setBusy((x) => ({ ...x, [key]: true }));
    setNote((n) => ({ ...n, [key]: "" }));
    patch(key, { scan: "Lendo imagem com PP-OCRv6…" });
    try {
      const r = await scanPokeIdleImage(file);
      const sp = findSpecies(catalog, r.fields.species);
      patch(key, {
        slug: sp ? sp.s : cards[key].slug, level: r.fields.level, quality: r.fields.quality,
        ivTotal: r.fields.ivTotal, power: r.fields.power, stats: [...r.fields.stats],
        scan: `${Math.round(r.confidence * 100)}% de confiança · confira os campos`,
      });
    } catch (e) {
      patch(key, { scan: e instanceof Error ? e.message : "Não foi possível ler a imagem." });
    } finally {
      setBusy((x) => ({ ...x, [key]: false }));
    }
  };

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = [...(e.clipboardData?.items ?? [])].find((i) => i.type.startsWith("image/"));
      const file = item?.getAsFile();
      if (file) void runOcr(lastSlot.current, file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog, cards]);

  const shareCard = async (key: "a" | "b", download: boolean) => {
    const a = analyse(cards[key], catalog);
    if (!a) return;
    const img = await loadSprite(a.sp.n);
    const cv = cardCanvas(a, img);
    if (download) {
      const link = document.createElement("a"); link.download = `vplab-${a.sp.s}.png`; link.href = cv.toDataURL("image/png"); link.click();
      setNote((n) => ({ ...n, [key]: "Imagem baixada." }));
      return;
    }
    cv.toBlob((blob) => {
      if (blob && navigator.clipboard && "ClipboardItem" in window) {
        navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
          .then(() => setNote((n) => ({ ...n, [key]: "Card copiado — use Ctrl + V no Discord." })))
          .catch(() => setNote((n) => ({ ...n, [key]: "Não deu para copiar; use Baixar imagem." })));
      } else setNote((n) => ({ ...n, [key]: "Seu navegador não copia imagem; use Baixar imagem." }));
    });
  };

  const A = analyse(cards.a, catalog), B = analyse(cards.b, catalog);
  const both = Boolean(A && B);
  const solo = !both && (A || B) ? (A || B)! : null;
  const tgt = Math.max(1, Math.floor(+target || 1));
  const roster = [...catalog].sort((a, b) => a.m.localeCompare(b.m));

  const shareCompare = async () => {
    if (!A || !B) return;
    const cv = compareCanvas(A, B);
    const link = document.createElement("a"); link.download = "vplab-comparacao.png"; link.href = cv.toDataURL("image/png"); link.click();
  };

  const reset = () => { setCards({ a: emptyCard(cards.a.slug), b: emptyCard(cards.b.slug) }); setNote({ a: "", b: "" }); };

  return (
    <main className="ivv4" style={{ padding: "24px 0 90px" }}>
      <style>{SCOPED_CSS}</style>
      <div style={{ width: "min(1280px,calc(100% - 44px))", marginInline: "auto", display: "grid", gap: 16 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
          <div>
            <span style={eyebrow}>Avaliar IV</span>
            <h1 style={{ fontFamily: "Cinzel,serif", fontSize: 27, margin: "0 0 5px" }}>Esse Pokémon é bom — e é melhor que o outro?</h1>
            <p style={{ color: "#b5a196", fontSize: 13, margin: 0, maxWidth: 720 }}>Preencha manualmente ou solte o print do card. O VPLab estima <b style={{ color: "#f7eee7" }}>cada IV individual</b>, dá a faixa provável do IV total com nível de confiança, <b style={{ color: "#f7eee7" }}>compara dois Pokémon stat por stat</b> e gera um card para você mandar no Discord.</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span data-hover="x" onClick={() => setHelpOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 15px", borderRadius: 11, border: "1px solid rgba(216,138,74,.24)", background: "rgba(255,255,255,.03)", color: "#e8c9a8", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>? Como usar</span>
            <span data-hover="x" onClick={() => fillExample(catalog)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 15px", borderRadius: 11, border: "1px solid rgba(229,179,79,.3)", background: "rgba(229,179,79,.08)", color: "#e5b34f", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>↻ Preencher exemplo</span>
            <span data-hover="x" onClick={reset} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 15px", borderRadius: 11, border: "1px solid rgba(216,138,74,.2)", background: "rgba(255,255,255,.03)", color: "#b5a196", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>× Resetar dados</span>
          </div>
        </div>

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 14, alignItems: "start" }}>
          {(["a", "b"] as const).map((key) => (
            <SlotCard key={key} card={cards[key]} analysis={analyse(cards[key], catalog)}
              title={key === "a" ? "Pokémon A" : "Pokémon B"} tone={key === "a" ? "#5b9bd8" : "#4fc47a"}
              frame={key === "a" ? "rgba(91,155,216,.3)" : "rgba(79,196,122,.3)"}
              roster={roster} note={note[key]} busy={busy[key]}
              patch={(ch) => patch(key, ch)} onPick={() => { lastSlot.current = key; }}
              onFile={(f) => void runOcr(key, f)} onShare={() => void shareCard(key, false)} onDownload={() => void shareCard(key, true)} />
          ))}
        </div>

        {/* Previsão / Projetar */}
        {solo && (
          <section style={{ ...panel, padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
              <div>
                <span style={eyebrow}>Previsão</span>
                <h2 style={{ fontFamily: "Cinzel,serif", fontSize: 20, margin: "0 0 4px" }}>Como esse {solo.sp.m} fica mais na frente</h2>
                <p style={{ color: "#b5a196", fontSize: 13, margin: 0, maxWidth: 620 }}>Growth e qualidade não mudam com o nível: com os IVs estimados, dá para ver os stats e o Power em qualquer nível futuro.</p>
              </div>
              <label style={{ display: "flex", flexDirection: "column", gap: 5, width: 160, minWidth: 0 }}>
                <span style={{ fontSize: 10, letterSpacing: ".09em", textTransform: "uppercase", color: "#b5a196", fontWeight: 700 }}>Projetar no nível</span>
                <input className="mono" type="number" min={1} max={999} value={target} onChange={(e) => setTarget(e.target.value)} style={{ textAlign: "center", borderColor: "rgba(229,179,79,.3)", color: "#e5b34f", fontWeight: 700 }} />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(176px,1fr))", gap: 10, marginBottom: 13 }}>
              {[
                { label: `Power no nível ${num(tgt)}`, value: num(powerOf(solo.sp.bs, tgt, solo.q, solo.ivs)), note: `hoje, no nível ${num(solo.lvl)}: ${num(solo.power)}`, color: "#e5b34f", edge: "rgba(229,179,79,.32)", bg: "linear-gradient(160deg,rgba(229,179,79,.1),rgba(13,8,7,.5))" },
                { label: "Se o IV fosse 32", value: num(powerOf(solo.sp.bs, tgt, solo.q, 32)), note: `+${dec((powerOf(solo.sp.bs, tgt, solo.q, 32) / powerOf(solo.sp.bs, tgt, solo.q, solo.ivs) - 1) * 100, 1)}% — o que o IV está custando`, color: "#f7eee7", edge: "rgba(216,138,74,.16)", bg: "rgba(0,0,0,.26)" },
                { label: solo.q >= WILD_CAP ? "Se a qualidade fosse 3,00 (Anciã)" : "Se a qualidade fosse 1,80", value: num(powerOf(solo.sp.bs, tgt, solo.q >= WILD_CAP ? 3 : WILD_CAP, solo.ivs)), note: `+${dec((powerOf(solo.sp.bs, tgt, solo.q >= WILD_CAP ? 3 : WILD_CAP, solo.ivs) / powerOf(solo.sp.bs, tgt, solo.q, solo.ivs) - 1) * 100, 1)}% — peso da qualidade`, color: "#f7eee7", edge: "rgba(216,138,74,.16)", bg: "rgba(0,0,0,.26)" },
                { label: "Teto de captura selvagem", value: num(powerOf(solo.sp.bs, tgt, WILD_CAP, 32)), note: `IV 32 com qualidade 1,80 — você está em ${dec(powerOf(solo.sp.bs, tgt, solo.q, solo.ivs) / powerOf(solo.sp.bs, tgt, WILD_CAP, 32) * 100, 1)}%. Breeding passa desse teto.`, color: "#ff8f7d", edge: "rgba(226,75,53,.32)", bg: "linear-gradient(160deg,rgba(194,54,41,.12),rgba(13,8,7,.5))" },
              ].map((p, i) => (
                <div key={i} style={{ padding: "13px 14px", border: `1px solid ${p.edge}`, borderRadius: 14, background: p.bg }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#7d6d64" }}>{p.label}</div>
                  <div className="mono" style={{ marginTop: 6, fontSize: 21, fontWeight: 700, color: p.color }}>{p.value}</div>
                  <div style={{ marginTop: 4, fontSize: 10.5, color: "#b5a196", lineHeight: 1.4 }}>{p.note}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(152px,1fr))", gap: 9 }}>
              {solo.sp.bs.map((b, i) => {
                const now = solo.stats[i];
                const future = statAt(b, solo.ivs[i], tgt, solo.q, i);
                const capV = statAt(b, 32, tgt, Math.max(WILD_CAP, solo.q), i);
                const d = future - now;
                return (
                  <div key={i} style={{ padding: "11px 13px", border: "1px solid rgba(216,138,74,.14)", borderRadius: 13, background: "rgba(0,0,0,.26)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "#b5a196" }}>{SHORT[i]}</span>
                      <span className="mono" style={{ fontSize: 9.5, color: "#7d6d64" }}>IV {solo.ivs[i]}/32</span>
                    </div>
                    <div style={{ marginTop: 5, display: "flex", alignItems: "baseline", gap: 7 }}>
                      <b className="mono" style={{ fontSize: 18, fontWeight: 700, color: "#f7eee7" }}>{num(future)}</b>
                      <small style={{ fontSize: 11, color: d >= 0 ? "#4fc47a" : "#ff6b55", fontWeight: 700 }}>{(d >= 0 ? "+" : "−") + num(Math.abs(d))}</small>
                    </div>
                    <div style={{ marginTop: 7, height: 5, borderRadius: 99, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
                      <span style={{ display: "block", height: "100%", borderRadius: "inherit", width: `${clamp(future / capV * 100, 3, 100)}%`, background: "linear-gradient(90deg,#e24b35,#e5b34f)" }} />
                    </div>
                    <div style={{ marginTop: 5, fontSize: 10, color: "#7d6d64" }}>hoje {num(now)} · teto {num(capV)}</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Comparação */}
        {both && A && B && <CompareSection A={A} B={B} onShare={() => void shareCompare()} />}

        <p style={{ margin: 0, color: "#7d6d64", fontSize: 11, lineHeight: 1.6, maxWidth: 880 }}>Fórmulas oficiais: stat = arredondar((base + 2×IV) × nível/100 × Qualidade^exp) e Power = arredondar(soma dos stats × Qualidade). A faixa de IV vem do arredondamento do jogo: um stat exibido representa um intervalo real, e em níveis baixos esse intervalo é largo — por isso a confiança cai. Catálogo de espécies do próprio VPLab.</p>
      </div>

      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </main>
  );
}

function SlotCard({ card, analysis, title, tone, frame, roster, note, busy, patch, onPick, onFile, onShare, onDownload }: {
  card: Card; analysis: Analysis | null; title: string; tone: string; frame: string;
  roster: PokemonDexEntry[]; note: string; busy: boolean; patch: (ch: Partial<Card>) => void; onPick: () => void;
  onFile: (f: File) => void; onShare: () => void; onDownload: () => void;
}) {
  const a = analysis;
  const sp = roster.find((d) => d.s === card.slug) || roster[0];
  const tier = a ? tierOf(a.q) : null;
  const verdict = a ? verdictOf(a.potential) : null;
  const onDrop = (e: DragEvent<HTMLLabelElement>) => { e.preventDefault(); const f = [...e.dataTransfer.files].find((x) => x.type.startsWith("image/")); if (f) onFile(f); };
  const onInput = (e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) onFile(f); };
  const cardFields: Array<[string, keyof Card, string, string]> = [["Nível", "level", "302", "1"], ["Qualidade", "quality", "1.78", "0.001"], ["IV total", "ivTotal", "opcional", "1"], ["Power", "power", "opcional", "1"]];

  return (
    <section style={{ ...panel, border: `1px solid ${frame}`, padding: 18, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 13 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: tone }} />
          <b style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: tone }}>{title}</b>
        </span>
        <span style={{ display: "flex", gap: 4, padding: 3, borderRadius: 10, background: "rgba(0,0,0,.34)", border: "1px solid rgba(216,138,74,.14)" }}>
          {(["manual", "image"] as const).map((m) => {
            const on = card.mode === m;
            return <span key={m} onClick={() => { onPick(); patch({ mode: m }); }} style={{ padding: "6px 11px", borderRadius: 8, background: on ? "rgba(226,75,53,.24)" : "transparent", color: on ? "#fff" : "#b5a196", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>{m === "manual" ? "Manual" : "Usar imagem"}</span>;
          })}
        </span>
      </div>

      {card.mode === "image" && (
        <div style={{ marginBottom: 13, padding: 14, border: "1px dashed rgba(226,75,53,.3)", borderRadius: 14, background: "linear-gradient(160deg,rgba(194,54,41,.09),rgba(13,8,7,.5))" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ width: 64, height: 64, flex: "0 0 64px", borderRadius: 12, border: "1px solid rgba(229,179,79,.26)", backgroundColor: "rgba(0,0,0,.4)", backgroundImage: card.preview ? `url(${card.preview})` : "none", backgroundSize: "cover", backgroundPosition: "center" }} />
            <div style={{ display: "grid", gap: 5, minWidth: 0, flex: 1 }}>
              <b style={{ fontSize: 12.5, color: "#f7eee7" }}>Preencher por print</b>
              <small style={{ fontSize: 11, color: "#b5a196", lineHeight: 1.45 }}>Card completo, sem cortes, com nome, nível, qualidade, IV total, Power e os 6 stats visíveis.</small>
              <label onDragOver={(e) => e.preventDefault()} onDrop={onDrop} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 12px", borderRadius: 9, border: "1px solid rgba(229,179,79,.3)", background: "rgba(229,179,79,.08)", color: "#e5b34f", fontSize: 11.5, fontWeight: 800, cursor: "pointer", justifySelf: "start" }}>
                {busy ? "Lendo imagem…" : "Selecionar print"}
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onInput} style={{ display: "none" }} />
              </label>
              <small style={{ fontSize: 10.5, color: "#7d6d64" }}>Ou tire o print e pressione <b style={{ color: "#e8c9a8" }}>Ctrl + V</b> aqui.</small>
              <small style={{ fontSize: 10.5, color: card.scan ? "#e0a93c" : "#7d6d64", fontWeight: 700, lineHeight: 1.4 }}>{card.scan || "Nenhuma imagem carregada."}</small>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "88px minmax(0,1fr)", gap: 12, alignItems: "center", marginBottom: 11 }}>
        <div style={{ position: "relative", width: 88, height: 88, borderRadius: 15, border: "1px solid rgba(229,179,79,.26)", background: "radial-gradient(70% 70% at 50% 35%,rgba(194,54,41,.2),rgba(0,0,0,.55))" }}>
          {sp && <span style={{ position: "absolute", inset: 5, ...bgIcon(sprite(sp.n)), imageRendering: "pixelated", filter: "drop-shadow(0 6px 11px rgba(0,0,0,.6))" }} />}
        </div>
        <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
            <span style={{ fontSize: 9.5, letterSpacing: ".09em", textTransform: "uppercase", color: "#b5a196", fontWeight: 700 }}>Pokémon</span>
            <PokemonPicker ariaLabel="Buscar Pokémon" options={roster.map((r) => ({ slug: r.s, name: r.m, dexNo: r.n }))} value={card.slug} onSelect={(sl) => patch({ slug: sl })} />
          </label>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {sp?.t.map((t) => (
              <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px 3px 3px", borderRadius: 99, border: "1px solid rgba(216,138,74,.2)", background: "rgba(0,0,0,.4)", fontSize: 9, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: "#e8c9a8" }}>
                <span style={{ width: 17, height: 17, ...bgIcon(TI(t)) }} />{T[t]}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 7, marginBottom: 9 }}>
        {cardFields.map(([label, field, ph, step]) => (
          <label key={field} style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
            <span style={{ fontSize: 9, letterSpacing: ".08em", textTransform: "uppercase", color: "#b5a196", fontWeight: 700 }}>{label}</span>
            <input className="mono" type="number" step={step} value={card[field] as string} onChange={(e) => patch({ [field]: e.target.value })} placeholder={ph} style={{ padding: "10px 5px", textAlign: "center" }} />
          </label>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,minmax(0,1fr))", gap: 6, marginBottom: 12 }}>
        {SHORT.map((label, i) => (
          <label key={i} style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
            <span style={{ fontSize: 9, letterSpacing: ".05em", textTransform: "uppercase", color: "#b5a196", fontWeight: 700, textAlign: "center" }}>{label}</span>
            <input className="mono" type="number" value={card.stats[i]} onChange={(e) => { const stats = [...card.stats]; stats[i] = e.target.value; patch({ stats }); }} placeholder="—" style={{ padding: "10px 3px", textAlign: "center", borderColor: card.stats[i] ? "rgba(216,138,74,.18)" : "rgba(226,75,53,.3)" }} />
          </label>
        ))}
      </div>

      {a && verdict && tier ? (
        <div style={{ display: "grid", gap: 11 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, flexWrap: "wrap", padding: "12px 13px", border: `1px solid ${verdict.color}55`, borderRadius: 14, background: `${verdict.color}12` }}>
            <span className="mono" style={{ fontSize: 26, fontWeight: 700, color: verdict.color, lineHeight: 1 }}>{dec(a.potential, 1)}%</span>
            <div style={{ display: "grid", gap: 2, minWidth: 0, flex: 1 }}>
              <b style={{ fontFamily: "Cinzel,serif", fontSize: 15, color: verdict.color }}>{verdict.label}</b>
              <small style={{ fontSize: 10.5, color: "#b5a196" }}>Qualidade {dec(a.q, 3)} · {tier.nome} ({tier.origem}) · Power calculado {num(a.power)}</small>
            </div>
          </div>

          <div>
            <div style={{ ...secCap, marginBottom: 7 }}>IVs individuais estimados</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 6 }}>
              {a.mid.map((v, i) => (
                <div key={i} style={{ padding: "8px 9px", border: "1px solid rgba(216,138,74,.14)", borderRadius: 10, background: "rgba(0,0,0,.28)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: "#b5a196" }}>{STAT[i]}</span>
                    <b className="mono" style={{ fontSize: 11, color: ivColor(v) }}>{dec(v, 1)}/32</b>
                  </div>
                  <span style={{ display: "block", marginTop: 5, height: 6, borderRadius: 99, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
                    <span style={{ display: "block", height: "100%", borderRadius: "inherit", width: `${clamp(v / 32 * 100, 2, 100)}%`, background: `linear-gradient(90deg,${ivColor(v)},${ivColor(v)}88)` }} />
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ ...secCap, marginBottom: 7 }}>Faixa estimada de IV total</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 6 }}>
              <RangeBox label="Mínimo" value={num(a.total.min)} size={15} color="#b5a196" edge="rgba(216,138,74,.14)" bg="rgba(0,0,0,.28)" />
              <RangeBox label="Mais provável" value={num(a.total.likely)} size={22} color="#e5b34f" edge="rgba(229,179,79,.4)" bg="rgba(229,179,79,.09)"
                tag={`${dec(a.confidence, 0).replace(",0", "")}% · ${a.confidence >= 85 ? "alta" : a.confidence >= 65 ? "média" : "baixa"} confiança`}
                tagColor={a.confidence >= 85 ? "#4fc47a" : a.confidence >= 65 ? "#e5b34f" : "#ff8f7d"} />
              <RangeBox label="Máximo" value={num(a.total.max)} size={15} color="#b5a196" edge="rgba(216,138,74,.14)" bg="rgba(0,0,0,.28)" />
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 10.5, color: "#b5a196", lineHeight: 1.45 }}>{rangeNote(a, card.ivTotal)}</p>
            {(a.impossible || a.saturated >= 3) && (
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", border: `1px solid ${a.impossible ? "#ff6b55" : "#e0a93c"}55`, borderRadius: 10, background: `${a.impossible ? "#ff6b55" : "#e0a93c"}14` }}>
                <span style={{ width: 22, height: 22, flex: "0 0 22px", ...bgIcon("/assets/vplab/route/alerts/recebe-atencao.png") }} />
                <b style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: a.impossible ? "#ff6b55" : "#e0a93c" }}>{a.impossible ? "Dados inconsistentes" : "Estimativa saturada no teto"}</b>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            <span data-hover="x" onClick={onShare} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 14px", borderRadius: 11, border: "1px solid rgba(226,75,53,.4)", background: "linear-gradient(180deg,rgba(226,75,53,.2),rgba(142,29,25,.28))", color: "#ffd9cf", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>⧉ Gerar e copiar card</span>
            <span data-hover="x" onClick={onDownload} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 14px", borderRadius: 11, border: "1px solid rgba(229,179,79,.3)", background: "rgba(229,179,79,.08)", color: "#e5b34f", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>↓ Baixar imagem</span>
            <span style={{ alignSelf: "center", fontSize: 10.5, color: "#7d6d64" }}>{note}</span>
          </div>
        </div>
      ) : (
        <div style={{ padding: "22px 16px", border: "1px dashed rgba(216,138,74,.2)", borderRadius: 14, textAlign: "center", color: "#7d6d64", fontSize: 12, lineHeight: 1.6 }}>
          Preencha <b style={{ color: "#b5a196" }}>nível</b>, <b style={{ color: "#b5a196" }}>qualidade</b> e os <b style={{ color: "#b5a196" }}>6 stats</b> deste card.
        </div>
      )}
    </section>
  );
}

function RangeBox({ label, value, size, color, edge, bg, tag, tagColor }: { label: string; value: string; size: number; color: string; edge: string; bg: string; tag?: string; tagColor?: string }) {
  return (
    <div style={{ padding: 10, border: `1px solid ${edge}`, borderRadius: 11, background: bg, textAlign: "center" }}>
      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#7d6d64" }}>{label}</div>
      <div className="mono" style={{ marginTop: 4, fontSize: size, fontWeight: 700, color }}>{value}</div>
      {tag && <div style={{ marginTop: 5, padding: "2px 7px", borderRadius: 99, border: `1px solid ${tagColor}66`, background: `${tagColor}1a`, fontSize: 8.5, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: tagColor }}>{tag}</div>}
    </div>
  );
}

function rangeNote(a: Analysis, ivTotalStr: string) {
  const ivTotal = +ivTotalStr;
  if (a.impossible) return `Estes números não fecham: com nível ${num(a.lvl)} e qualidade ${dec(a.q, 3)}, os stats informados exigiriam IV fora da faixa 0–32. Confira principalmente o nível — é o campo que mais distorce a leitura.`;
  if (a.saturated >= 3) return `${a.saturated} status bateram no teto de 32. Quando isso acontece não dá para saber o quanto sobrou, então a estimativa perde confiança: revise o nível e a qualidade.`;
  if (ivTotal > 0) return (a.total.likely >= ivTotal - 2 && a.total.likely <= ivTotal + 2)
    ? `Confere com o IV total ${num(ivTotal)} que você informou.`
    : `Você informou ${num(ivTotal)}, a estimativa deu ${a.total.likely}. Revise nível, qualidade e stats — equips e bônus de clã distorcem.`;
  return "Em níveis baixos o arredondamento do jogo alarga a faixa. Suba de nível e recalcule para apertar a estimativa.";
}

function CompareSection({ A, B, onShare }: { A: Analysis; B: Analysis; onShare: () => void }) {
  const cell = (v: number, other: number, sub: string) => ({ value: num(v), sub, color: v >= other ? "#e5b34f" : "#f7eee7", bg: v >= other ? "rgba(229,179,79,.06)" : "transparent" });
  const rows = [
    ...STAT.map((label, i) => {
      const va = A.stats[i], vb = B.stats[i], d = vb - va;
      return { label, bg: i % 2 ? "rgba(255,255,255,.015)" : "transparent", cells: [cell(va, vb, "IV " + dec(A.mid[i], 1)), cell(vb, va, "IV " + dec(B.mid[i], 1))], diff: (d > 0 ? "+" : "") + num(d), pct: va ? (d >= 0 ? "+" : "") + dec(d / va * 100, 2) + "%" : "—", diffColor: d > 0 ? "#4fc47a" : d < 0 ? "#ff6b55" : "#7d6d64" };
    }),
    (() => { const d = B.power - A.power; return { label: "Power", bg: "rgba(229,179,79,.05)", cells: [cell(A.power, B.power, "IV total ~" + A.total.likely), cell(B.power, A.power, "IV total ~" + B.total.likely)], diff: (d > 0 ? "+" : "") + num(d), pct: A.power ? (d >= 0 ? "+" : "") + dec(d / A.power * 100, 2) + "%" : "—", diffColor: d > 0 ? "#4fc47a" : d < 0 ? "#ff6b55" : "#7d6d64" }; })(),
  ];
  const better = A.potential >= B.potential ? A : B;
  const worse = better === A ? B : A;
  const heads = [
    { nome: A.sp.m, n: A.sp.n, level: num(A.lvl), quality: dec(A.q, 3), color: "#8fc4ea", bg: "rgba(91,155,216,.06)" },
    { nome: B.sp.m, n: B.sp.n, level: num(B.lvl), quality: dec(B.q, 3), color: "#8fd48a", bg: "rgba(79,196,122,.06)" },
  ];
  const th: CSSProperties = { padding: "12px 14px", borderBottom: "1px solid rgba(216,138,74,.14)", fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#7d6d64" };
  const bl = "1px solid rgba(216,138,74,.09)";

  return (
    <section style={{ ...panel, padding: 22 }}>
      <span style={eyebrow}>Comparação</span>
      <h2 style={{ fontFamily: "Cinzel,serif", fontSize: 20, margin: "0 0 14px" }}>Stat por stat — {A.sp.m} Nv {num(A.lvl)} × {B.sp.m} Nv {num(B.lvl)}</h2>

      <div style={{ overflow: "auto", border: "1px solid rgba(216,138,74,.16)", borderRadius: 15, background: "rgba(0,0,0,.24)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "150px minmax(120px,1fr) minmax(120px,1fr) 104px 92px", minWidth: 660 }}>
          <div style={th}>Stat</div>
          {heads.map((h) => (
            <div key={h.nome + h.level} style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 14px", borderBottom: "1px solid rgba(216,138,74,.14)", borderLeft: bl, background: h.bg }}>
              <span style={{ width: 34, height: 34, flex: "0 0 34px", ...bgIcon(sprite(h.n)), imageRendering: "pixelated" }} />
              <span style={{ display: "grid", gap: 1, minWidth: 0 }}>
                <b style={{ fontSize: 12.5, color: h.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.nome}</b>
                <small className="mono" style={{ fontSize: 9.5, color: "#7d6d64" }}>Nv {h.level} · Q {h.quality}</small>
              </span>
            </div>
          ))}
          <div style={{ ...th, borderLeft: bl, textAlign: "right" }}>Diferença</div>
          <div style={{ ...th, borderLeft: bl, textAlign: "right" }}>%</div>

          {rows.map((row) => (
            <div key={row.label} style={{ display: "contents" }}>
              <div style={{ display: "flex", alignItems: "center", padding: "11px 14px", borderBottom: "1px solid rgba(216,138,74,.07)", background: row.bg, fontSize: 12, fontWeight: 700, color: "#f7eee7" }}>{row.label}</div>
              {row.cells.map((c, i) => (
                <div key={i} style={{ display: "grid", gap: 2, justifyItems: "end", padding: "11px 14px", borderBottom: "1px solid rgba(216,138,74,.07)", borderLeft: bl, background: c.bg }}>
                  <b className="mono" style={{ fontSize: 13.5, color: c.color }}>{c.value}</b>
                  <small className="mono" style={{ fontSize: 9, color: "#7d6d64" }}>{c.sub}</small>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "11px 14px", borderBottom: "1px solid rgba(216,138,74,.07)", borderLeft: bl, background: row.bg }}>
                <b className="mono" style={{ fontSize: 12.5, color: row.diffColor }}>{row.diff}</b>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "11px 14px", borderBottom: "1px solid rgba(216,138,74,.07)", borderLeft: bl, background: row.bg }}>
                <b className="mono" style={{ fontSize: 12.5, color: row.diffColor }}>{row.pct}</b>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 13, padding: "13px 15px", border: "1px solid rgba(229,179,79,.3)", borderRadius: 14, background: "linear-gradient(160deg,rgba(229,179,79,.09),rgba(13,8,7,.5))" }}>
        <span style={{ width: 40, height: 40, flex: "0 0 40px", ...bgIcon(sprite(better.sp.n)), imageRendering: "pixelated" }} />
        <div style={{ display: "grid", gap: 2, minWidth: 0, flex: 1 }}>
          <b style={{ fontFamily: "Cinzel,serif", fontSize: 16, color: "#e5b34f" }}>{better.sp.m} tem mais potencial ({dec(better.potential, 1)}% contra {dec(worse.potential, 1)}%)</b>
          <small style={{ fontSize: 11, color: "#b5a196", lineHeight: 1.4 }}>Qualidade {dec(better.q, 3)} contra {dec(worse.q, 3)} · IV total estimado {better.total.likely} contra {worse.total.likely}. Entre os dois, a Qualidade pesa quase o dobro do IV no resultado final.</small>
        </div>
        <span data-hover="x" onClick={onShare} style={{ padding: "10px 14px", borderRadius: 11, border: "1px solid rgba(229,179,79,.32)", background: "rgba(229,179,79,.1)", color: "#e5b34f", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>↓ Baixar comparação</span>
      </div>
    </section>
  );
}

function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90, display: "grid", placeItems: "center", padding: 24, background: "rgba(6,3,3,.78)", backdropFilter: "blur(4px)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(980px,100%)", maxHeight: "88vh", overflow: "auto", padding: 26, border: "1px solid rgba(229,179,79,.3)", borderRadius: 22, background: "linear-gradient(160deg,rgba(30,18,16,.99),rgba(13,8,7,.99))", boxShadow: "0 30px 70px -30px #000" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
          <div>
            <span style={{ display: "block", color: "#d98350", textTransform: "uppercase", letterSpacing: ".22em", fontSize: 10.5, fontWeight: 800, marginBottom: 7 }}>Guia rápido</span>
            <h2 style={{ fontFamily: "Cinzel,serif", fontSize: 24, margin: "0 0 5px" }}>Como avaliar seu Pokémon</h2>
            <p style={{ margin: 0, color: "#b5a196", fontSize: 12.5 }}>Preencha os dados manualmente ou deixe o VPLab ler um print do card.</p>
          </div>
          <span onClick={onClose} style={{ display: "grid", placeItems: "center", width: 34, height: 34, flex: "0 0 34px", border: "1px solid rgba(216,138,74,.24)", borderRadius: 10, background: "rgba(0,0,0,.4)", color: "#b5a196", fontSize: 16, cursor: "pointer" }}>×</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 18, alignItems: "start" }}>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <b style={{ display: "block", fontFamily: "Cinzel,serif", fontSize: 14, color: "#e5b34f", marginBottom: 8 }}>Preencher por imagem</b>
              <div style={{ display: "grid", gap: 8 }}>
                {HELP_STEPS.map((text, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span className="mono" style={{ display: "grid", placeItems: "center", width: 20, height: 20, flex: "0 0 20px", borderRadius: 6, border: "1px solid rgba(229,179,79,.3)", background: "rgba(229,179,79,.1)", fontSize: 10, fontWeight: 700, color: "#e5b34f" }}>{i + 1}</span>
                    <span style={{ fontSize: 12, color: "#d9c9bf", lineHeight: 1.5 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: "12px 14px", border: "1px solid rgba(79,196,122,.28)", borderRadius: 12, background: "rgba(79,196,122,.07)", fontSize: 11.5, color: "#cfe9d8", lineHeight: 1.5 }}>
              <b style={{ color: "#fff" }}>Privacidade:</b> a imagem é lida no seu navegador e não é enviada nem armazenada pelo VPLab.
            </div>
            <div>
              <b style={{ display: "block", fontFamily: "Cinzel,serif", fontSize: 14, color: "#e5b34f", marginBottom: 8 }}>Para uma leitura melhor</b>
              <div style={{ display: "grid", gap: 6 }}>
                {HELP_TIPS.map((t, i) => (
                  <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 11.5, color: "#b5a196", lineHeight: 1.5 }}>
                    <span style={{ color: "#ff8f7d", fontWeight: 800 }}>•</span>{t}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ padding: 14, border: "1px solid rgba(216,138,74,.2)", borderRadius: 15, background: "rgba(0,0,0,.3)" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 11 }}>
                <span style={{ width: 62, height: 62, flex: "0 0 62px", borderRadius: 12, border: "1px solid rgba(79,196,122,.4)", backgroundColor: "rgba(0,0,0,.4)", backgroundImage: `url(${sprite(212)})`, backgroundSize: "78%", backgroundRepeat: "no-repeat", backgroundPosition: "center", imageRendering: "pixelated" }} />
                <div style={{ display: "grid", gap: 3 }}>
                  <b style={{ fontFamily: "Cinzel,serif", fontSize: 17, color: "#f7eee7" }}>Scizor</b>
                  <small className="mono" style={{ fontSize: 10.5, color: "#b5a196" }}>Nível 302 · 6.661 Poder</small>
                  <span style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {HELP_CHIPS.map((c) => <span key={c.label} style={{ padding: "2px 8px", borderRadius: 6, border: `1px solid ${c.edge}`, background: c.bg, fontSize: 8.5, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: c.color }}>{c.label}</span>)}
                  </span>
                </div>
              </div>
              <div style={{ display: "grid", gap: 5 }}>
                {HELP_STATS.map(([label, value]) => (
                  <div key={label} style={{ display: "grid", gridTemplateColumns: "34px minmax(0,1fr) 46px", gap: 8, alignItems: "center" }}>
                    <span className="mono" style={{ fontSize: 9.5, color: "#7d6d64" }}>{label}</span>
                    <span style={{ display: "block", height: 7, borderRadius: 99, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
                      <span style={{ display: "block", height: "100%", borderRadius: "inherit", width: `${clamp(value / 800 * 100, 5, 100)}%`, background: "linear-gradient(90deg,#4fc47a,#2f8a4a)" }} />
                    </span>
                    <b className="mono" style={{ fontSize: 10.5, color: "#f7eee7", textAlign: "right" }}>{num(value)}</b>
                  </div>
                ))}
              </div>
              <p style={{ margin: "10px 0 0", fontSize: 10.5, color: "#4fc47a", lineHeight: 1.45 }}><b>Exemplo válido:</b> card completo, texto nítido e todos os seis stats visíveis.</p>
            </div>
            <span onClick={onClose} style={{ justifySelf: "end", padding: "11px 17px", borderRadius: 11, border: "1px solid rgba(226,75,53,.4)", background: "linear-gradient(180deg,rgba(226,75,53,.24),rgba(142,29,25,.3))", color: "#ffd9cf", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>Entendi, vamos avaliar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
