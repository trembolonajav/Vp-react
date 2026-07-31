/* ============================================================
   VPLAB — lógica
   Fórmulas conferidas na Pokepedia oficial (systems/power,
   systems/quality, systems/combat, systems/clans):
     stat  = round((base + 2×growth) × nível/100 × Qualidade^exp)
     Power = round(soma dos 6 stats × Qualidade)
     Hunt: ×2→×2.5, ×4→×5.5, resistências ÷1.5
     Clã:  +6% por rank em Atk/SpA/Def/SpD (Rank 5 = +30%)
   ============================================================ */

/* Troque quando a loja estiver publicada na Vercel: */
const STORE_URL = "/";

function normalizeRarity(value) {
  const rarity = String(value || "");
  if (rarity.startsWith("Lend")) return "Lendário";
  if (rarity.endsWith("pico")) return "Épico";
  if (rarity.endsWith("tico")) return "Mítico";
  return rarity;
}
const ALL_DEX = window.VPLAB_DEX.map((pokemon) => ({
  ...pokemon,
  raridade: normalizeRarity(pokemon.raridade)
}));
/* A busca, a Pokédex e a rota usam o catálogo completo de espécies caçáveis.
   A antiga whitelist deixava de fora Eevee, suas evoluções e várias hunts válidas. */
const DEX = ALL_DEX.filter((p) => !p.boss);
/* Espécies confirmadas nas hunts do mapa atual: a rota fica restrita
   a estas 194 entradas; Pokédex e demais ferramentas usam DEX completo. */
const ROUTE_DEX_NUMBERS = new Set([
  1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,114,115,120,121,122,123,124,125,126,127,128,130,131,138,139,140,141,142,143,147,148,149,152,153,154,155,156,157,158,159,160,164,169,170,171,172,173,174,177,178,179,180,181,182,183,184,186,192,195,200,202,203,204,205,207,208,209,210,212,214,216,217,218,219,220,221,226,227,228,229,230,231,232,236,237,238,239,240,241,246,247,248
]);
const ROUTE_DEX = ALL_DEX.filter((p) => ROUTE_DEX_NUMBERS.has(p.dexNo) && !p.boss);
const CHART = window.VPLAB_TYPE_CHART;
const EXP = [0.95, 0.80, 0.80, 0.80, 0.80, 0.95];
const STAT_NAMES = ["HP", "Ataque", "Defesa", "Atq. Esp.", "Def. Esp.", "Velocid."];

const TYPE_LABEL = {
  normal:"Normal", fire:"Fogo", water:"Água", electric:"Elétrico", grass:"Planta",
  ice:"Gelo", fighting:"Lutador", poison:"Veneno", ground:"Terra", flying:"Voador",
  psychic:"Psíquico", bug:"Inseto", rock:"Pedra", ghost:"Fantasma", dragon:"Dragão",
  dark:"Sombrio", steel:"Aço", fairy:"Fada"
};
const TYPE_COLOR = {
  normal:"#9a9a7c", fire:"#e0742f", water:"#5680d8", electric:"#d8b220", grass:"#6da33e",
  ice:"#7fc4c4", fighting:"#a5342a", poison:"#8f3f8f", ground:"#c9a952", flying:"#8d7fd8",
  psychic:"#dd4f7f", bug:"#93a021", rock:"#a89232", ghost:"#5f5390", dragon:"#5f3cc9",
  dark:"#584538", steel:"#8a8aa0", fairy:"#c96f9e"
};
const ALL_TYPES = Object.keys(TYPE_LABEL);

const QUALITY_TIERS = [
  { min:0.8,  max:1.0,   nome:"Fraca",    cor:"#8d8d9c" },
  { min:1.0,  max:1.1,   nome:"Comum",    cor:"#b5a196" },
  { min:1.1,  max:1.3,   nome:"Incomum",  cor:"#4fc47a" },
  { min:1.3,  max:1.5,   nome:"Rara",     cor:"#5b9bd8" },
  { min:1.5,  max:1.7,   nome:"Épica",    cor:"#a86fd8" },
  { min:1.7,  max:1.81,  nome:"Lendária", cor:"#e5b34f" }
];
const QUALITY_BANDS = [
  ["0,80 – 0,90", "5%"], ["0,90 – 1,00", "5%"], ["1,00 – 1,10", "34,03846%"],
  ["1,10 – 1,20", "20%"], ["1,20 – 1,30", "10%"], ["1,30 – 1,40", "10%"],
  ["1,40 – 1,50", "10%"], ["1,50 – 1,60", "5%"], ["1,60 – 1,70", "0%"],
  ["1,70 – 1,799", "0,67308%"], ["1,800 exato (perfeita)", "0,28846%"]
];
const RARITY_COLOR = {
  "Comum":"#9a8d84", "Incomum":"#4fc47a", "Raro":"#5b9bd8",
  "Épico":"#a86fd8", "Lendário":"#e5b34f", "Mítico":"#ff6b8d"
};

/* ---------------------------------------------- helpers */
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
window.addEventListener("message", (event) => {
  if (event.origin !== location.origin || event.data?.type !== "vplab-prototype-height") return;
  const frame = document.querySelector(`.vplab-prototype-frame[data-prototype="${event.data.page}"]`);
  if (frame && Number.isFinite(event.data.height)) frame.style.height = `${Math.max(760, event.data.height)}px`;
});
const esc = (s) => String(s ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const num = (v) => { const n = parseFloat(v); return isFinite(n) ? n : 0; };
const clamp = (x,a,b) => Math.max(a, Math.min(b, x));
const pad3 = (n) => String(n).padStart(3, "0");
const fmt = (n) => (n ?? 0).toLocaleString("pt-BR");
const fmtQuality = (n) => Number(n).toLocaleString("pt-BR", { minimumFractionDigits:2, maximumFractionDigits:3 });
const spriteUrl = (dexNo) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dexNo}.png`;
const SPRITE_PLACEHOLDER = "assets/pokemon-placeholder.webp";

const tb = (t) => `<span class="tb" style="background:${TYPE_COLOR[t]||"#777"}"><img src="assets/route/types-v2/${t}.png" alt="" aria-hidden="true">${TYPE_LABEL[t]||t}</span>`;
const tbs = (arr) => arr.map(tb).join(" ");

function rarTag(r){
  const c = RARITY_COLOR[r] || "#999";
  return `<span class="rar" style="color:${c};border-color:${c}55;background:${c}18">${esc(r)}</span>`;
}

/* fórmulas do jogo */
const statAt = (base, iv, lvl, q, i) => Math.round((base + 2*iv) * (lvl/100) * Math.pow(q, EXP[i]));
const powerOf = (p, lvl, q, iv=32) => {
  let s = 0;
  for (let i = 0; i < 6; i++) s += statAt(p.baseStats[i], iv, lvl, q, i);
  return Math.round(s * q);
};
function inferIvData(p, stats, lvl, q){
  const raw = stats.map((value, i) => {
    const scale = (lvl/100) * Math.pow(q, EXP[i]);
    return clamp((value/scale-p.baseStats[i])/2, 0, 32);
  });
  return {
    raw,
    rounded:raw.map(Math.round),
    total:{
      min:raw.reduce((sum,iv) => sum+Math.floor(iv), 0),
      likely:Math.floor(raw.reduce((sum,iv) => sum+iv, 0)),
      max:raw.reduce((sum,iv) => sum+Math.ceil(iv), 0)
    }
  };
}
function potentialOf(p, rawIvs, q){
  const physical = Math.max(0,p.baseStats[1]) ** 4;
  const special = Math.max(0,p.baseStats[3]) ** 4;
  const offensiveTotal = Math.max(1,physical+special);
  const weights = [.11,.695*(physical/offensiveTotal),.09,.695*(special/offensiveTotal),.09,.015];
  const ivScore = weights.reduce((sum,w,i) => sum+w*clamp(rawIvs[i]/32,0,1),0);
  return clamp(ivScore*Math.pow(clamp(q/1.8,0,1),1.15)*100,0,100);
}
function effVs(atkType, defTypes){
  const row = CHART[atkType.toUpperCase()] || {};
  let m = 1;
  defTypes.forEach((d) => { const v = row[d.toUpperCase()]; if (v !== undefined) m *= v; });
  return m;
}
function bestStabMatchup(attacker, defender){
  return attacker.tipos
    .map((type) => ({ type, multiplier:effVs(type, defender.tipos) }))
    .sort((a,b) => b.multiplier-a.multiplier)[0];
}
const huntAmp = (m) => m === 0 ? 0 : m > 1 ? 1 + (m-1)*1.5 : m < 1 ? m/1.5 : 1;
const fmtX = (m) => "×" + (Math.round(m*100)/100).toString().replace(".", ",");
function multColor(m){
  if (m === 0) return "var(--imm)";
  if (m >= 2.5) return "var(--good)";
  if (m > 1) return "#7fb069";
  if (m === 1) return "var(--faint)";
  if (m >= 0.5) return "var(--mid)";
  return "var(--bad)";
}
function qualityTier(q){
  return QUALITY_TIERS.find((t) => q >= t.min && q < t.max) || QUALITY_TIERS[QUALITY_TIERS.length-1];
}
function bestMove(p, cat){
  const list = p.golpes.filter((g) => g.categoria === cat);
  return list.length ? list.reduce((a,b) => b.poder > a.poder ? b : a) : null;
}
/* melhor arma: compara físico×Atk vs especial×SpA */
function attacker(p){
  const bp = bestMove(p, "fisico"), bs = bestMove(p, "especial");
  const ps = bp ? bp.poder * p.baseStats[1] : 0;
  const ss = bs ? bs.poder * p.baseStats[3] : 0;
  return { bp, bs, rec: ss >= ps ? "especial" : "fisico" };
}
const regionOf = () => "kanto";

const OUTLAND_SPECS = [
  ["Taekwondo Hitmonlee","hitmonlee"],["Taekwondo Hitmontop","hitmontop"],["Taekwondo Hitmonchan","hitmonchan"],
  ["Brave Steelix","steelix"],["Ancient Pupitar","pupitar"],["Brute Rhydon","rhydon"],
  ["Brave Nidoqueen","nidoqueen"],["Brave Nidoking","nidoking"],["Banshee Misdreavus","misdreavus"],["Trickmaster Gengar","gengar"],
  ["Dark Crobat","crobat"],["Furious Skarmory","skarmory"],["Furious Pidgeot","pidgeot"],["Brave Noctowl","noctowl"],
  ["Furious Wigglytuff","wigglytuff"],["Ancient Granbull","granbull"],["Hard Golem","golem"],["Brave Clefable","clefable"],
  ["War Heracross","heracross"],["Furious Scyther","scyther"],["Brave Arcanine","arcanine"],["Furious Magmar","magmar"],
  ["Brave Charizard","charizard"],["Enraged Typhlosion","typhlosion"],["Ancient Marowak","marowak"],["Roll Donphan","donphan"],
  ["Furious Sandslash","sandslash"],["Milch-Miltank","miltank"],["Charged Raichu","raichu"],["Magnetic Electabuzz","electabuzz"],
  ["Furious Ampharos","ampharos"],["Enigmatic Girafarig","girafarig"],["Ancient Hypno","hypno"],["Ancient Xatu","xatu"],
  ["Brave Alakazam","alakazam"],["Ancient Pinsir","pinsir"],["Ancient Meganium","meganium"],["Tribal Feraligatr","feraligatr"],
  ["Furious Gyarados","gyarados"],["Brave Blastoise","blastoise"],["Brave Mantine","mantine"],["Brave Venusaur","venusaur"],
  ["Heavy Piloswine","piloswine"],["Freezing Dewgong","dewgong"],["Ancient Dragonair","dragonair"],["Psy Jynx","jynx"],["Evil Cloyster","cloyster"]
];
const OUTLAND = OUTLAND_SPECS.map(([nome, slug], i) => {
  const base = window.VPLAB_DEX.find((p) => p.slug === slug);
  return base ? { ...base, nome, baseSlug:slug, slug:`outland-${slug}-${i}`, huntLevel:150, region:"outland" } : null;
}).filter(Boolean);
/* A rota apresenta no mesmo fluxo as hunts do mapa-base e os mobs adicionais.
   A região é apenas um dado interno: visualmente todos são alvos da mesma rota. */
const HUNTABLE = [...ROUTE_DEX, ...OUTLAND];
window.VPLAB_CLAN_CONTENT = {
  /* Clãs e rota avaliam todo o catálogo utilizável, incluindo evoluções. */
  availableIds:ALL_DEX.map((pokemon) => pokemon.dexNo),
  outlandHunts:OUTLAND.map((enemy) => ({
    id:enemy.slug,name:enemy.nome,region:"outland",requiredLevel:enemy.huntLevel,
    enemies:[window.VPLAB_DEX.find((pokemon) => pokemon.slug === enemy.baseSlug)]
  }))
};

/* ---------------------------------------------- estado */
let cur = null;
let activeTab = "avaliar";
let rotaRegion = "kanto", rotaManual = false, routePokemonSelected = false;
const routeCoverage = new Set();

function routeTypeChip(type){
  return `<span class="route-v3-type"><img src="assets/route/types-v2/${type}.png" alt="">${TYPE_LABEL[type]}</span>`;
}
function renderRouteCoverage(){
  const box = $("#route-coverage-types");
  if (!box || !cur) return;
  box.innerHTML = ALL_TYPES.filter((type) => !cur.tipos.includes(type)).map((type) => `<button type="button" data-type="${type}" aria-pressed="${routeCoverage.has(type)}" title="${TYPE_LABEL[type]}"><img src="assets/route/types-v2/${type}.png" alt=""><span>${TYPE_LABEL[type]}</span></button>`).join("");
  box.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
    routeCoverage.has(button.dataset.type) ? routeCoverage.delete(button.dataset.type) : routeCoverage.add(button.dataset.type);
    renderRouteCoverage(); renderRota();
  }));
}
let routeOpenBands = new Set();let pokedexSelected = null;

function syncUrl(){
  const u = new URL(location.href);
  u.searchParams.set("p", cur.slug);
  u.searchParams.set("tab", activeTab);
  /* "clan" é exclusivo da aba de Clãs — quem escreve é o clan-ui.js.
     Sair da aba limpa o parâmetro para ele não vazar nas URLs das outras. */
  if (activeTab !== "clas") u.searchParams.delete("clan");
  history.replaceState(null, "", u);
}

/* ---------------------------------------------- montagem inicial */
(function initSelects(){
  const speciesOptions = DEX.map((p) =>
    `<option value="${p.slug}">#${pad3(p.dexNo)} ${esc(p.nome)}${p.boss ? " (boss)" : ""}</option>`).join("");
  $("#x-species").innerHTML = speciesOptions;
  $("#pokedex-type").insertAdjacentHTML("beforeend", ALL_TYPES.map((type) => `<option value="${type}">${TYPE_LABEL[type]}</option>`).join(""));
  const rarityOrder = ["Comum", "Incomum", "Raro", "Épico", "Lendário", "Mítico"];
  [...new Set(ALL_DEX.map((pokemon) => pokemon.raridade))]
    .sort((a, b) => rarityOrder.indexOf(a) - rarityOrder.indexOf(b))
    .forEach((rarity) => $("#pokedex-rarity").insertAdjacentHTML("beforeend", `<option value="${esc(rarity)}">${esc(rarity)}</option>`));
  if (window.PokeFipe) window.PokeFipe.POKEMON.forEach(({ slug, name }) => {
    $("#lab-fipe-pokemon").insertAdjacentHTML("beforeend", `<option value="${slug}">${esc(name)}</option>`);
  });
  $("#x-obs").innerHTML = STAT_NAMES.map((n, i) =>
    `<label class="field"><span class="lbl" style="text-align:center">${n}</span><input class="mono" id="o${i}" type="number" min="1" placeholder="—" style="text-align:center"></label>`).join("");
  $("#x-qtable").innerHTML = QUALITY_BANDS.map(([range, chance]) => {
    const first = Number(range.match(/[0-9]+(?:[.,][0-9]+)?/)?.[0].replace(",", ".") || 1.8);
    const tier = qualityTier(first === 1.8 ? 1.8 : first + .00001);
    return `<tr><td><span class="qtag" style="color:${tier.cor};border-color:${tier.cor}66;background:${tier.cor}14">${tier.nome}</span></td><td class="mono">${range}</td><td class="mono">${chance}</td></tr>`;
  }).join("");
})();

function renderAvaliar(){
  const p = cur;
  const hasSpecies = Boolean($("#x-species").value);
  const lvl = num($("#x-level").value);
  const q = num($("#x-qual").value);
  const ivTotalGiven = num($("#x-ivtotal").value);
  const powerGiven = num($("#x-power").value);
  const obs = STAT_NAMES.map((_, i) => num($("#o" + i).value));
  const filled = obs.filter((v) => v > 0).length;
  const box = $("#x-result");

  if (!hasSpecies || !lvl || q < 0.8 || filled < 6) {
    ivQuote = null;
    box.innerHTML = `<p class="note">Escolha o <b>Pokémon</b> e preencha o <b>nível</b>, a <b>qualidade</b> e os <b>6 stats</b> do card para gerar o raio-X.<br><br>O Power e o IV Total são opcionais.</p>`;
    return;
  }

  const inferred = inferIvData(p,obs,lvl,q);
  const ivs = inferred.rounded;
  const soma = inferred.total.likely;
  const media = inferred.raw.reduce((a,b) => a+b,0)/6;
  const tier = qualityTier(q);
  const calculatedPower = Math.round(obs.reduce((a,b) => a+b,0)*q);
  const potential = potentialOf(p,inferred.raw,q);
  const maxPower = powerOf(p,lvl,1.8,32);

  const ivColor = (iv) => iv >= 27 ? "var(--good)" : iv >= 18 ? "var(--gold)" : iv >= 12 ? "var(--mid)" : "var(--bad)";
  const rowsHtml = ivs.map((iv, i) => `
    <div class="ivrow">
      <span class="nm">${STAT_NAMES[i]}</span>
      <div class="sttrack"><div class="ivfill" style="width:${iv/32*100}%;background:${ivColor(iv)}"></div></div>
      <span class="num mono" style="color:${ivColor(iv)}">${iv} / 32</span>
    </div>`).join("");

  let check = "";
  if (ivTotalGiven > 0) {
    const diff = Math.abs(soma - ivTotalGiven);
    check = diff <= 2
      ? `<p class="note" style="color:var(--good)">✔ A soma estimada (<b class="mono">${soma}</b>) bate com o IV Total do jogo (<b class="mono">${ivTotalGiven}</b>).</p>`
      : `<p class="note" style="color:var(--bad)">✖ Soma estimada <b class="mono">${soma}</b> ≠ IV Total <b class="mono">${ivTotalGiven}</b> — confira se nível, qualidade e stats foram copiados certinho (equips e bônus de clã distorcem os números).</p>`;
  }
  const powerCheck = powerGiven > 0
    ? Math.abs(calculatedPower-powerGiven) <= 2
      ? `<p class="note" style="color:var(--good)">✔ Power conferido: <b class="mono">${fmt(calculatedPower)}</b>, igual ao card.</p>`
      : `<p class="note" style="color:var(--bad)">✖ Power calculado <b class="mono">${fmt(calculatedPower)}</b> ≠ card <b class="mono">${fmt(powerGiven)}</b>. Revise nível, qualidade ou stats.</p>`
    : `<p class="note">Power calculado pelos stats: <b class="mono">${fmt(calculatedPower)}</b>.</p>`;

  /* veredito combina média de IV e etiqueta de qualidade */
  const ivNota = media >= 29 ? ["Excepcional", "var(--good)"] :
    media >= 24 ? ["Ótimo", "var(--good)"] :
    media >= 18 ? ["Bom", "var(--gold)"] :
    media >= 12 ? ["Mediano", "var(--mid)"] : ["Fraco", "var(--bad)"];

  const atk = attacker(p);
  const atkIdx = atk.rec === "fisico" ? 1 : 3;
  const atkNome = atk.rec === "fisico" ? "Ataque" : "Atq. Especial";
  const atkIv = ivs[atkIdx];
  const dica = atkIv >= 27
    ? `O IV de <b>${atkNome}</b> (${atkIv}/32) — o stat que importa pro dano do ${esc(p.nome)} — está excelente.`
    : atkIv >= 20
      ? `O IV de <b>${atkNome}</b> (${atkIv}/32) está bom; é o stat que mais importa pro dano do ${esc(p.nome)}.`
      : `O IV de <b>${atkNome}</b> (${atkIv}/32) é o que mais pesa no dano do ${esc(p.nome)} — abaixo de 20, vale caçar outro.`;

  box.innerHTML = rowsHtml + powerCheck + check + `
    <div class="verdict">
      <span class="qtag" style="color:${tier.cor};border-color:${tier.cor}66;background:${tier.cor}14">Qualidade ${tier.nome} (${fmtQuality(q)})</span>
      <div class="big" style="color:${ivNota[1]}">IV ${ivNota[0]} — potencial ${potential.toFixed(1).replace(".", ",")}%</div>
      <div class="analysis-metrics">
        <span><b>${inferred.total.min}–${inferred.total.max}</b> intervalo de IV</span>
        <span><b>${inferred.total.likely}</b> total mais provável</span>
        <span><b>${media.toFixed(1).replace(".", ",")}/32</b> média bruta</span>
        <span><b>${fmt(maxPower)}</b> Power máximo (Q 1,8)</span>
      </div>
      <p class="sub">${dica}<br>Lembre: entre dois ${esc(p.nome)}, a <b>Qualidade</b> pesa quase o dobro do IV.</p>
      <button class="fipe-quote-button" id="iv-fipe-button" type="button" aria-haspopup="dialog" aria-controls="fipe-quote-modal">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7V6a5 5 0 0 1 10 0v1h2.2a1 1 0 0 1 1 .93l.95 12A1.5 1.5 0 0 1 19.66 22H4.34a1.5 1.5 0 0 1-1.5-2.07l.96-12a1 1 0 0 1 1-.93zm2 0h6V6a3 3 0 0 0-6 0zm-2 4a1 1 0 1 0 2 0V9H7zm8 0a1 1 0 1 0 2 0V9h-2z"/></svg>
        Quanto pedir por esse ${esc(p.nome)}?
      </button>
    </div>`;
  ivQuote = { slug:p.slug, name:p.nome, level:lvl, quality:q, ivTotal: ivTotalGiven > 0 ? ivTotalGiven : soma };
}

/* ---------------------------------------------- leitura do print do card */
const cleanOcr = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
function reconcileCardFields(p, stats, read){
  if (!p?.baseStats) return read;
  if (stats.some((v) => !Number.isFinite(+v) || +v <= 0)) return read;
  const sumStats = stats.reduce((sum,v) => sum+(+v),0);
  let power = +read.power || 0;
  let quality = +read.quality || 0;
  let level = +read.level || 0;
  const sources = { ...(read.sources || {}), stats:[...(read.sources?.stats || [])] };

  /* Power e soma dos stats revelam a qualidade mesmo quando ×1.78 falha no OCR. */
  if (power > 0) {
    const derivedQ = power/sumStats;
    if (level >= 20 && derivedQ >= .8 && derivedQ <= 1.8 && !quality) {
      quality = Math.round(derivedQ*1000)/1000;
      sources.quality = "derived";
    }
  } else if (quality >= .8 && quality <= 1.8) {
    power = Math.round(sumStats*quality);
    sources.power = "derived";
  }

  /* Procura o level cujos seis IVs não arredondados ficam em 0..32 e perto de inteiros.
     Também corrige trocas de dígito do OCR (ex.: 336 lido como 338) quando o ajuste
     matemático aponta outro nível com folga decisiva. */
  if (quality >= .8 && quality <= 1.8) {
    let best = null, readFit = null;
    for (let candidate=1; candidate<=999; candidate++) {
      const raw = stats.map((value,i) => ((+value)/((candidate/100)*Math.pow(quality,EXP[i]))-p.baseStats[i])/2);
      const outside = raw.reduce((s,iv) => s+(iv<0 ? -iv : iv>32 ? iv-32 : 0),0);
      const integerFit = raw.reduce((s,iv) => s+Math.abs(iv-Math.round(iv)),0);
      const readDistance = level ? Math.min(Math.abs(candidate-level),100)*.002 : 0;
      const fit = outside*100 + integerFit;
      const score = fit + readDistance;
      if (candidate === level) readFit = fit;
      if (!best || score < best.score) best = { level:candidate,score,fit,outside };
    }
    if (best && best.outside < .05) {
      if (!level) { level = best.level; sources.level = "derived"; }
      else if (best.level !== level && readFit !== null && readFit - best.fit > .6) {
        level = best.level;
        sources.level = "derived";
      }
    }
  }
  return {
    ...read,
    level:level || "",
    quality:quality || "",
    power:power || "",
    sources
  };
}
function findSpeciesInOcr(text){
  const normalized = cleanOcr(text).replace(/[^a-z0-9♀♂]+/g, " ");
  return ALL_DEX.slice().sort((a,b) => b.nome.length-a.nome.length).find((p) =>
    normalized.includes(cleanOcr(p.nome).replace(/[^a-z0-9♀♂]+/g, " "))
  );
}
const IV_FIELD_IDS = ["x-level", "x-qual", "x-power", "x-ivtotal", ...STAT_NAMES.map((_, i) => `o${i}`)];
const IV_FIELD_LABELS = {
  "x-level":"Nível", "x-qual":"Qualidade", "x-power":"Power", "x-ivtotal":"IV Total",
  o0:"HP", o1:"Atk", o2:"Def", o3:"SpA", o4:"SpD", o5:"Vel"
};
/* URLs absolutas: o worker do Tesseract nasce de um blob e não resolve caminho relativo. */
const OCR_PATHS = {
  workerPath: new URL("/vplab/vendor/worker.min.js", location.href).href,
  corePath: new URL("/vplab/vendor/tesseract-core", location.href).href,
  langPath: new URL("/vplab/vendor/lang-data", location.href).href
};
let ivPreviewUrl = null;

function showIvPreview(file){
  if (ivPreviewUrl) URL.revokeObjectURL(ivPreviewUrl);
  ivPreviewUrl = URL.createObjectURL(file);
  $("#iv-preview").src = ivPreviewUrl;
  $("#iv-preview-wrap").hidden = false;
}
function clearIvHighlights(){
  IV_FIELD_IDS.forEach((id) => $("#"+id).classList.remove("ocr-missing"));
}
/* Serializa leituras: colar outra imagem no meio de um scan não pode
   deixar dois pipelines escrevendo nos mesmos campos. Só o pedido mais
   recente da fila roda; os intermediários são descartados. */
let ivScanTicket = 0;
let ivScanChain = Promise.resolve();
function scanIvImage(file){
  const ticket = ++ivScanTicket;
  ivScanChain = ivScanChain
    .then(() => ticket === ivScanTicket ? runIvScan(file, ticket) : undefined)
    .catch(() => {});
}
async function runIvScan(file, ticket){
  const status = $("#iv-scan-status");
  const picker = $("#iv-image");
  const pickerButton = $("#iv-image-button");
  if (!file) return;
  if (!window.IvScan?.isAcceptedImage(file)) {
    status.innerHTML = '<span class="scan-error">Formato não suportado. Envie um print em PNG, JPG ou WebP.</span>';
    return;
  }
  if (!window.Tesseract) {
    status.innerHTML = '<span class="scan-error">Não foi possível carregar o leitor. Verifique sua conexão e tente novamente.</span>';
    return;
  }
  showIvPreview(file);
  pickerButton.textContent = "Lendo imagem…";
  pickerButton.classList.add("is-reading");
  status.innerHTML = '<span class="scan-loading">Analisando o card do Pokémon… <b>0%</b></span>';
  /* Uma imagem nova nunca herda campos que o OCR não reconheceu da anterior. */
  $("#iv-species-search").value = "";
  clearIvHighlights();
  IV_FIELD_IDS.forEach((id) => { $("#"+id).value = ""; });
  renderAvaliar();
  try {
    const read = await IvScan.readCard(file, {
      paths: OCR_PATHS,
      onProgress: (label, progress) => {
        if (ticket !== ivScanTicket) return;
        status.innerHTML = `<span class="scan-loading">${esc(label)}… <b>${Math.round(progress*100)}%</b></span>`;
      }
    });
    if (ticket !== ivScanTicket) return;
    const found = findSpeciesInOcr(read.searchText);
    if (found) setSpecies(found.slug);
    const values = reconcileCardFields(found, read.fields.stats, { ...read.fields, sources:read.sources });
    /* Stat que implica IV impossível para a espécie no nível/qualidade lidos é lixo
       de OCR: melhor deixar vazio que preencher errado. (Só a partir do Nv 20 —
       abaixo disso o arredondamento do jogo distorce demais a conta.) */
    if (found && +values.level >= 20) {
      const qRead = +values.quality;
      const hasQ = qRead >= .8 && qRead <= 1.8;
      const qLo = hasQ ? qRead : .8, qHi = hasQ ? qRead : 1.8;
      values.stats = values.stats.map((v, i) => {
        if (!v) return v;
        const ivAt = (q) => ((+v)/((+values.level/100)*Math.pow(q, EXP[i])) - found.baseStats[i]) / 2;
        /* IV cai com a qualidade: ivAt(qLo) é o teto e ivAt(qHi) o piso possíveis. */
        return ivAt(qLo) >= -3 && ivAt(qHi) <= 35 ? v : "";
      });
    }
    const level = +values.level, quality = +values.quality, total = +values.total;
    if (level >= 1 && level <= 999) $("#x-level").value = level;
    else values.level = "";
    if (quality >= .8 && quality <= 1.8) $("#x-qual").value = quality;
    else values.quality = "";
    if (+values.power > 0) $("#x-power").value = Math.round(+values.power);
    else values.power = "";
    if (total >= 6 && total <= 192) $("#x-ivtotal").value = total;
    else values.total = "";
    values.stats.forEach((v,i) => { if (v) $("#o"+i).value = v; });
    renderAvaliar();

    /* Power e IV Total são opcionais no card grande; só cobra o essencial. */
    const requiredIds = read.layout === "compact" ? IV_FIELD_IDS : ["x-level", "x-qual", "x-power", ...STAT_NAMES.map((_, i) => `o${i}`)];
    const fieldValues = {
      "x-level":values.level, "x-qual":values.quality, "x-power":values.power, "x-ivtotal":values.total,
      ...Object.fromEntries(values.stats.map((v, i) => [`o${i}`, v]))
    };
    const missing = requiredIds.filter((id) => !fieldValues[id]);
    missing.forEach((id) => $("#"+id).classList.add("ocr-missing"));
    if (read.inconsistent) {
      status.innerHTML = '<span class="scan-error">Alguns dígitos ficaram inconsistentes com o Poder. Revise os campos destacados.</span>';
    } else if (missing.length) {
      const names = missing.map((id) => IV_FIELD_LABELS[id]).join(", ");
      status.innerHTML = `<span class="scan-warn">Não foi possível identificar: <b>${names}</b>.</span>`;
    } else {
      status.innerHTML = '<span class="scan-ok">✓ Leitura concluída.</span>';
    }
  } catch (err) {
    if (ticket !== ivScanTicket) return;
    status.innerHTML = '<span class="scan-error">Não consegui ler este print. Tente uma imagem nítida, sem corte e com o card visível — ou preencha os campos manualmente.</span>';
  } finally {
    if (ticket !== ivScanTicket) return;
    /* Limpar permite escolher imediatamente o mesmo arquivo outra vez. */
    picker.value = "";
    pickerButton.textContent = "Selecionar outra imagem";
    pickerButton.classList.remove("is-reading");
  }
}

/* ---------------------------------------------- render: rota */
function renderRota(){
  const p = cur;
  const level = Math.max(1, Math.floor(num($("#rota-level").value) || 1));
  if (!p || !ROUTE_DEX_NUMBERS.has(p.dexNo)) cur = ROUTE_DEX.find((x) => x.slug === "charizard") || ROUTE_DEX[0];
  const me = cur;
  const attackTypes = [...new Set([...me.tipos, ...routeCoverage])];
  const analyse = (target) => {
    const attacks = attackTypes.map((type) => ({type,m:huntAmp(effVs(type,target.tipos))})).sort((a,b)=>b.m-a.m);
    const incoming = target.tipos.map((type) => ({type,m:huntAmp(effVs(type,me.tipos))})).sort((a,b)=>b.m-a.m);
    const best=attacks[0]||{type:me.tipos[0],m:0}, worst=incoming[0]||{type:target.tipos[0],m:1};
    const immune=incoming.filter((x)=>x.m===0).map((x)=>x.type);
    const dealt=best.m>=5?["dano-super","#4fc47a","dano brutal"]:best.m>=2.5?["dano-super","#4fc47a","super eficaz"]:best.m>1?["dano-vantagem","#8fd48a","acima do normal"]:best.m===1?["dano-neutro","#b5a196","sem vantagem"]:best.m>0?["dano-resistido","#e0a93c","ele resiste"]:["dano-nulo","#ff6b55","não acerta"];
    const taken=worst.m===0?["hunt-segura","#4fd8b0","nada te acerta"]:worst.m>=2.5?["recebe-muito","#ff6b55","leva muito dano"]:worst.m>1?["recebe-atencao","#e0a93c","dano acima do normal"]:worst.m===1?["dano-neutro","#b5a196","troca equilibrada"]:["recebe-resiste","#4fc47a","você resiste"];
    let v;
    if(best.m===0)v=["Não caçar","alvo-evitar","#ff6b55",-100,false,"seu golpe não acerta"];
    else if(worst.m>=2.5&&best.m<2.5)v=["Não caçar","alvo-evitar","#ff6b55",-50,false,"ele bate super e você não"];
    else if(worst.m>=2.5)v=["Troca perigosa","recebe-muito","#ff8f7d",20,true,"você bate forte, mas ele também"];
    else if(worst.m===0&&best.m>=2.5)v=["Alvo perfeito","alvo-ideal","#e5b34f",100,true,"bate super e é intocável"];
    else if(worst.m===0)v=["Hunt segura","hunt-segura","#4fd8b0",70,true,"ele não consegue te acertar"];
    else if(best.m>=2.5&&worst.m<=1)v=["Alvo ideal","alvo-ideal","#e5b34f",80,true,"bate super sem tomar dano extra"];
    else if(best.m>=2.5)v=["Bom alvo","dano-super","#4fc47a",60,true,"dano super eficaz"];
    else if(best.m<1)v=["Hunt lenta","hunt-lenta","#e8d9a8",worst.m<=1?10:-20,worst.m<=1,"custa tempo, ele resiste"];
    else v=["Alvo neutro","dano-neutro","#b5a196",35,false,"troca sem vantagem"];
    const offensive=best.m>=2.5;
    const safeHunt=worst.m===0&&best.m>0;
    const featured=offensive||safeHunt;
    return {target,best,worst,immune,dealt,taken,v,offensive,safeHunt,featured,score:v[3]*10+best.m*4-worst.m*2};
  };
  const analysed=HUNTABLE.map(analyse);
  const levels=[...new Set(HUNTABLE.map((x)=>x.huntLevel))].sort((a,b)=>a-b);
  const current=levels.filter((lv)=>lv<=level).pop()??levels[0];
  const groups=levels.map((lv)=>({lv,items:analysed.filter((a)=>a.target.huntLevel===lv).sort((a,b)=>
    Number(b.offensive)-Number(a.offensive)
    || b.best.m-a.best.m
    || Number(b.safeHunt)-Number(a.safeHunt)
    || a.worst.m-b.worst.m
    || b.score-a.score
  )}));
  const future=groups.filter((g)=>g.lv>=current);
  const good=analysed.filter((a)=>a.featured).length;
  const safe=analysed.filter((a)=>a.worst.m===0&&a.best.m>0).length;
  const ideal=analysed.filter((a)=>a.best.m>=2.5&&a.worst.m<=1).length;
  const discarded=analysed.filter((a)=>!a.featured).length;

  $("#route-v3-species-search").value=me.nome;
  $("#route-v3-me-sprite").src=spriteUrl(me.dexNo);
  $("#route-v3-me-sprite").alt=me.nome;
  $("#route-v3-me-types").innerHTML=me.tipos.map(routeTypeChip).join("");
  const huntSpeciesCount=new Set(HUNTABLE.map((target)=>target.dexNo)).size;
  $("#route-v3-summary-note").textContent=`${HUNTABLE.length} hunts no catálogo · ${huntSpeciesCount} espécies · faixa ${current}`;
  const stats=[
    ["Valem a pena",good,"alvos que compensam com ele","#4fc47a","rgba(79,196,122,.28)","rgba(79,196,122,.07)"],
    ["Hunts seguras",safe,"não conseguem te acertar","#4fd8b0","rgba(79,216,176,.3)","rgba(79,216,176,.07)"],
    ["Vantagem forte",ideal,"super eficaz sem risco extra","#e5b34f","rgba(229,179,79,.3)","rgba(229,179,79,.07)"],
    ["Descartados",discarded,"perde tempo ou morre","#ff6b55","rgba(255,107,85,.28)","rgba(255,107,85,.06)"]
  ];
  $("#route-v3-stats").innerHTML=stats.map((s)=>`<div style="--tone:${s[3]};--edge:${s[4]};--fill:${s[5]}"><span>${s[0]}</span><b class="mono">${s[1]}</b><small>${s[2]}</small></div>`).join("");
  const path=future.map((g)=>({lv:g.lv,a:g.items.find((a)=>a.featured)})).filter((x)=>x.a);
  $("#route-v3-path").innerHTML=path.map((x,i)=>`<span class="route-v3-path-card"><img src="${spriteUrl(x.a.target.dexNo)}" alt=""><span><b>${esc(x.a.target.nome)}</b><small class="mono" style="color:${x.a.v[2]}">Nv ${x.lv} · ${fmtX(x.a.best.m)}</small></span></span>${i<path.length-1?'<i>→</i>':''}`).join("");

  const row=(title,entry,meta,detail)=>`<div class="route-v3-row"><img src="assets/route/alerts/${meta[0]}.png" alt=""><span><span><em>${title}</em><b style="color:${meta[1]}">${meta[2]}</b></span><i><u style="width:${clamp(entry.m/5.5*100,3,100)}%;background:linear-gradient(90deg,${meta[1]},${meta[1]}88)"></u></i><small><img src="assets/route/types-v2/${entry.type}.png" alt="">${detail}</small></span><strong class="mono" style="color:${meta[1]}">${fmtX(entry.m)}</strong></div>`;
  const card=(a,index,isPast)=>{
    const t=a.target, badges=[];
    a.immune.forEach((type)=>badges.push([`assets/route/types-v2/${type}.png`,`Imune a ${TYPE_LABEL[type]}`,"#83b9ff","rgba(131,185,255,.35)","rgba(131,185,255,.09)"]));
    if(a.worst.m===0)badges.push(["assets/route/alerts/hunt-segura.png","Farm sem risco","#4fd8b0","rgba(79,216,176,.35)","rgba(79,216,176,.09)"]);
    if(a.best.m>=5)badges.push(["assets/route/alerts/dano-super.png","Fraqueza dupla","#4fc47a","rgba(79,196,122,.32)","rgba(79,196,122,.07)"]);
    if(a.worst.m>=2.5)badges.push(["assets/route/alerts/recebe-muito.png","Ele bate super em você","#ff6b55","rgba(255,107,85,.32)","rgba(255,107,85,.07)"]);
    if(routeCoverage.has(a.best.type))badges.push([`assets/route/types-v2/${a.best.type}.png`,`Precisa de ${TYPE_LABEL[a.best.type]}`,"#e5b34f","rgba(229,179,79,.32)","rgba(229,179,79,.07)"]);
    return `<article class="route-v3-card" style="--tone:${a.v[2]};--edge:${a.featured?a.v[2]+"55":"rgba(255,107,85,.28)"};--glow:${a.v[2]}26;opacity:${a.featured?1:.58}"><div class="route-v3-card-head"><div class="route-v3-target"><img src="${spriteUrl(t.dexNo)}" alt="${esc(t.nome)}"><span class="mono">#${pad3(t.dexNo)}</span></div><div><div class="route-v3-title"><b>${esc(t.nome)}</b>${index===0&&a.featured&&!isPast?'<em>Melhor daqui</em>':''}</div><div class="route-v3-types">${t.tipos.map(routeTypeChip).join("")}</div><div class="route-v3-verdict"><img src="assets/route/alerts/${a.v[1]}.png" alt=""><span style="color:${a.v[2]}">${a.v[0]}</span></div></div></div><div class="route-v3-rows">${row("Você causa",a.best,a.dealt,`${TYPE_LABEL[a.best.type]} · ${routeCoverage.has(a.best.type)?"golpe de cobertura":"tipo dele"}`)}${row("Você recebe",a.worst,a.taken,`pior golpe dele é ${TYPE_LABEL[a.worst.type]}`)}</div>${badges.length?`<div class="route-v3-badges">${badges.map((b)=>`<span style="--c:${b[2]};--e:${b[3]};--b:${b[4]}"><img src="${b[0]}" alt="">${b[1]}</span>`).join("")}</div>`:""}</article>`;
  };
  $("#rota-list").innerHTML=future.map((g)=>{
    const keep=g.items.filter((a)=>a.featured), drop=g.items.filter((a)=>!a.featured), open=routeOpenBands.has(g.lv), isPast=g.lv<current;
    const shown=open?[...keep,...drop]:keep;
    const state=g.lv===current?'<em class="is-current">Você está aqui</em>':isPast?'<em>Já passou</em>':'';
    const top=keep[0];
    const note=keep.length?`${keep.length} ${keep.length===1?'alvo vale a pena':'alvos valem a pena'} · ${drop.length} descartado${drop.length===1?'':'s'}${top?` · melhor: ${top.target.nome}`:''}`:`Nenhum alvo bom aqui com ${me.nome} — pule esta faixa ou libere cobertura`;
    const hasSkipped=drop.length>0||keep.length>shown.length;
    return `<section class="route-v3-band ${g.lv===current?'current':''}"><header><span class="route-v3-level">${g.lv}</span><div><div><h2>Faixa nível ${g.lv}</h2>${state}</div><p>${note}</p></div>${hasSkipped?`<button data-route-toggle="${g.lv}">${open?'Esconder descartadas':`Mostrar descartadas (${drop.length})`}</button>`:''}</header><div class="route-v3-grid">${shown.map((a,index)=>card(a,index,isPast)).join("")}</div></section>`;
  }).join("");
  $$('[data-route-toggle]').forEach((button)=>button.addEventListener('click',()=>{const lv=+button.dataset.routeToggle;routeOpenBands.has(lv)?routeOpenBands.delete(lv):routeOpenBands.add(lv);renderRota();}));
}
/* ---------------------------------------------- Pokédex */
function renderPokedex(){
  const box = $("#pokedex-content");
  if (!pokedexSelected) {
    const type = $("#pokedex-type").value;
    const rarity = $("#pokedex-rarity").value;
    const filtered = ALL_DEX.filter((pokemon) => (!type || pokemon.tipos.includes(type)) && (!rarity || pokemon.raridade === rarity));
    box.innerHTML = `<div class="pokedex-count">${filtered.length} espécie${filtered.length === 1 ? "" : "s"}</div>
      <div class="pokedex-grid">${filtered.map((pokemon) => `<button class="pokedex-card" type="button" data-slug="${pokemon.slug}">
        <span class="pokedex-number">#${pad3(pokemon.dexNo)}</span>
        <img loading="lazy" decoding="async" width="76" height="76" src="${spriteUrl(pokemon.dexNo)}" alt="${esc(pokemon.nome)}">
        <b>${esc(pokemon.nome)}</b><span class="pokedex-types">${pokemon.tipos.map(tb).join("")}</span><small>${esc(pokemon.raridade)}</small>
      </button>`).join("")}</div>`;
    $$("#pokedex-content .pokedex-card").forEach((card) => card.addEventListener("click", () => {
      pokedexSelected = ALL_DEX.find((pokemon) => pokemon.slug === card.dataset.slug);
      $("#pokedex-species-search").value = pokedexSelected.nome;
      $("#pokedex-species-search").parentElement.querySelector(".search-clear").hidden = false;
      renderPokedex();
    }));
    return;
  }

  const pokemon = pokedexSelected;
  const totalStats = pokemon.baseStats.reduce((sum, value) => sum + value, 0);
  const effectiveness = ALL_TYPES
    .map((type) => ({ type, multiplier: effVs(type, pokemon.tipos) }))
    .sort((a, b) => b.multiplier - a.multiplier);
  const effectivenessGroup = (label, rows, className = "") => !rows.length ? "" : `<div class="efgroup ${className}">
    <div class="lab">${label}</div><div class="eflist">${rows.map((row) => `<span class="efpill">${tb(row.type)}<span class="x" style="background:${multColor(row.multiplier)}">${fmtX(row.multiplier)}</span></span>`).join("")}</div>
  </div>`;
  const matchupCard = ({ opponent, type, multiplier }) => `<button class="matchup-card" type="button" data-matchup="${opponent.slug}">
    <img loading="lazy" decoding="async" width="46" height="46" src="${spriteUrl(opponent.dexNo)}" alt="">
    <span class="matchup-copy"><b>${esc(opponent.nome)}</b><small>#${pad3(opponent.dexNo)} · STAB ${TYPE_LABEL[type]}</small></span>
    <span class="matchup-values"><strong>${fmtX(multiplier)}</strong><small>hunt ${fmtX(huntAmp(multiplier))}</small></span>
  </button>`;
  const dangerousOpponents = ALL_DEX
    .filter((opponent) => opponent.slug !== pokemon.slug)
    .map((opponent) => ({ opponent, ...bestStabMatchup(opponent, pokemon) }))
    .filter((matchup) => matchup.multiplier > 1)
    .sort((a,b) => b.multiplier-a.multiplier || a.opponent.dexNo-b.opponent.dexNo);
  const favorableTargets = ALL_DEX
    .filter((opponent) => opponent.slug !== pokemon.slug)
    .map((opponent) => ({ opponent, ...bestStabMatchup(pokemon, opponent) }))
    .filter((matchup) => matchup.multiplier > 1)
    .sort((a,b) => b.multiplier-a.multiplier || a.opponent.dexNo-b.opponent.dexNo);
  let root = pokemon;
  for (;;) {
    const previous = ALL_DEX.find((item) => item.evolvesToId === root.dexNo);
    if (!previous) break;
    root = previous;
  }
  const chain = [];
  for (let node = root; node; node = node.evolvesToId ? ALL_DEX.find((item) => item.dexNo === node.evolvesToId) : null) chain.push(node);
  box.innerHTML = `<button class="pokedex-back" id="pokedex-back" type="button">← Voltar ao catálogo</button>
    <div class="pokedex-detail-head">
      <div class="pokedex-art"><img src="${spriteUrl(pokemon.dexNo)}" alt="${esc(pokemon.nome)}" width="132" height="132" decoding="async"></div>
      <div><span class="kicker">#${pad3(pokemon.dexNo)}</span><h2>${esc(pokemon.nome)}</h2><div class="chips">${tbs(pokemon.tipos)} ${rarTag(pokemon.raridade)}</div>
      <div class="pokedex-actions"><button type="button" data-pokedex-action="avaliar">Avaliar IV</button><button type="button" data-pokedex-action="rota">Planejar rota</button></div></div>
    </div>
    <div class="pokedex-facts">
      <span><small>Hunt</small><b>${pokemon.boss ? "Não disponível" : `Nv ${pokemon.huntLevel}`}</b></span>
      <span><small>XP por abate</small><b>${fmt(pokemon.xp)}</b></span><span><small>Loot médio</small><b>$${fmt(pokemon.lootAvg)}</b></span>
      <span><small>Preço NPC</small><b>$${fmt(pokemon.priceNpc)}</b></span><span><small>Venda</small><b>$${fmt(pokemon.sellValue)}</b></span>
    </div>
    <div class="pokedex-section"><div class="workspace-label">Stats base · Total ${totalStats}</div><div class="pokedex-stat-grid">${pokemon.baseStats.map((value, index) => `<span><small>${STAT_NAMES[index]}</small><b>${value}</b><i><em style="width:${clamp(value/255*100,2,100)}%"></em></i></span>`).join("")}</div></div>
    <div class="pokedex-section pokedex-effectiveness"><div class="workspace-label">Fraquezas e resistências</div><p class="note">Multiplicador do dano que este Pokémon recebe no combate padrão. Na hunt, a vantagem elemental é amplificada.</p>
      ${effectivenessGroup("Fraquezas", effectiveness.filter((row) => row.multiplier > 1))}
      ${effectivenessGroup("Resistências", effectiveness.filter((row) => row.multiplier === 0.5))}
      ${effectivenessGroup("Resistências fortes", effectiveness.filter((row) => row.multiplier > 0 && row.multiplier < 0.5))}
      ${effectivenessGroup("Imunidades", effectiveness.filter((row) => row.multiplier === 0), "is-immune")}
    </div>
    <div class="pokedex-section pokedex-matchups"><div class="workspace-label">Confrontos por efetividade</div>
      <p class="note">Comparação entre as tipagens das 251 espécies, usando o melhor ataque com STAB de cada Pokémon. Não considera nível, Power, IV ou os golpes já liberados.</p>
      <div class="matchup-columns">
        <section class="matchup-panel is-danger"><header><div><b>Perigosos contra ${esc(pokemon.nome)}</b><small>Pokémon que acertam esta espécie com vantagem</small></div><span>${dangerousOpponents.length}</span></header><div class="matchup-list">${dangerousOpponents.map(matchupCard).join("") || '<p class="note">Nenhuma ameaça elemental encontrada.</p>'}</div></section>
        <section class="matchup-panel is-favorable"><header><div><b>${esc(pokemon.nome)} é forte contra</b><small>Alvos atingidos com vantagem por uma de suas tipagens</small></div><span>${favorableTargets.length}</span></header><div class="matchup-list">${favorableTargets.map(matchupCard).join("") || '<p class="note">Nenhum alvo com fraqueza elemental encontrado.</p>'}</div></section>
      </div>
      <div class="matchup-legend"><span><b>×2</b> padrão → <b>×2,5</b> na hunt</span><span><b>×4</b> fraqueza dupla → <b>×5,5</b> na hunt</span></div>
    </div>
    <div class="pokedex-section"><div class="workspace-label">Golpes (${pokemon.golpes.length})</div><div class="pokedex-moves">${pokemon.golpes.length ? pokemon.golpes.map((move) => `<span><b>${esc(move.nome)}</b>${tb(move.tipo)}<small>${move.categoria === "fisico" ? "Físico" : "Especial"} · Poder ${move.poder} · Nv ${move.nivel}</small></span>`).join("") : '<p class="note">Nenhum golpe próprio cadastrado.</p>'}</div></div>
    <div class="pokedex-section"><div class="workspace-label">Linha evolutiva</div><div class="pokedex-evolution">${chain.map((item, index) => `<button type="button" data-evo="${item.slug}" class="${item.slug === pokemon.slug ? "is-current" : ""}"><img src="${spriteUrl(item.dexNo)}" alt="" width="34" height="34" loading="lazy" decoding="async"><span>${esc(item.nome)}</span></button>${index < chain.length-1 ? `<i>→ Nv ${item.evolveLevel || "?"} →</i>` : ""}`).join("") || "Sem evolução"}</div></div>
    <div class="pokedex-section"><div class="workspace-label">Drops (${pokemon.loot.length})</div><div class="pokedex-drops">${pokemon.loot.map((drop) => { const chance=drop.c/1000; const chanceText=chance===0?"0%":chance<1?chance.toFixed(2).replace(".",",")+"%":Math.round(chance)+"%"; return `<span><b>${esc(drop.n)}</b><small>×${drop.mn}${drop.mn!==drop.mx?`–${drop.mx}`:""} · ${chanceText} · $${fmt(drop.v)}</small></span>`; }).join("")}</div></div>`;
  $("#pokedex-back").addEventListener("click", () => {
    pokedexSelected = null;
    $("#pokedex-species-search").value = "";
    $("#pokedex-species-search").parentElement.querySelector(".search-clear").hidden = true;
    renderPokedex();
  });
  $$("#pokedex-content [data-evo]").forEach((button) => button.addEventListener("click", () => { pokedexSelected = ALL_DEX.find((item) => item.slug === button.dataset.evo); renderPokedex(); }));
  $$("#pokedex-content [data-matchup]").forEach((button) => button.addEventListener("click", () => {
    pokedexSelected = ALL_DEX.find((item) => item.slug === button.dataset.matchup);
    $("#pokedex-species-search").value = pokedexSelected.nome;
    renderPokedex();
    $("#tab-pokedex").scrollIntoView({ behavior:"smooth", block:"start" });
  }));
  $$("#pokedex-content [data-pokedex-action]").forEach((button) => button.addEventListener("click", () => {
    setSpecies(pokemon.slug);
    if (button.dataset.pokedexAction === "rota") {
      routePokemonSelected = true;
      $("#rota-level").value = 1;
    }
    selectTab(button.dataset.pokedexAction);
  }));
}

/* ---------------------------------------------- PokeFipe */
const fipeBrl = (value) => value.toLocaleString("pt-BR", { style:"currency", currency:"BRL", minimumFractionDigits:2 });
$("#diamond-rate").textContent = fipeBrl(window.PokeFipe.DIAMOND_BRL);
$("#level-rate").textContent = window.PokeFipe.LEVEL_BRL.toLocaleString("pt-BR", { style:"currency", currency:"BRL", minimumFractionDigits:2, maximumFractionDigits:3 });
function renderLabFipe(){
  const form = $("#lab-fipe-form");
  const values = Object.fromEntries(new FormData(form));
  const calculated = window.PokeFipe.calculateFipe(values);
  const selected = window.PokeFipe.POKEMON.find((pokemon) => pokemon.slug === values.pokemon);
  const empty = $("#fipe-empty"), result = $("#fipe-result"), warning = $("#fipe-warning");
  empty.hidden = true;
  result.hidden = true;
  warning.hidden = true;
  if (!calculated.valid || !calculated.inRange) {
    warning.hidden = false;
    warning.querySelector("strong").textContent = calculated.valid
      ? `Pontuação ${fmt(calculated.score)} sem cotação`
      : "Dados incompletos";
    warning.querySelector("span").textContent = calculated.reason;
    warning.querySelector("small").textContent = calculated.valid
      ? `Custo do nível informado: ${fipeBrl(calculated.levelValue)}.`
      : "Use números positivos para calcular a referência.";
    return;
  }
  result.hidden = false;
  $("#result-name").textContent = selected?.name || "Pokémon";
  $("#result-score").textContent = fmt(calculated.score);
  $("#result-diamonds").textContent = `${calculated.diamondsMin} a ${calculated.diamondsMax}`;
  $("#result-pokemon").textContent = `${fipeBrl(calculated.pokemonMin)} a ${fipeBrl(calculated.pokemonMax)}`;
  $("#result-level").textContent = fipeBrl(calculated.levelValue);
  $("#result-total").textContent = `${fipeBrl(calculated.totalMin)} a ${fipeBrl(calculated.totalMax)}`;
}

/* Estimativa rápida a partir do Avaliar IV ("Quanto pedir por esse Pokémon?") */
let ivQuote = null;
const fipeQuoteModal = $("#fipe-quote-modal");
function openFipeQuote(){
  if (!ivQuote) return;
  const { name, level, quality, ivTotal } = ivQuote;
  const calculated = window.PokeFipe.calculateFipe({ pokemon:ivQuote.slug, iv:ivTotal, multiplier:quality, level });
  const qualityText = String(quality).replace(".", ",");
  $("#fipe-quote-title").textContent = `Quanto pedir por esse ${name}?`;
  const meta = `<div class="fipe-quote-meta">
      <span>Nível <b>${fmt(level)}</b></span>
      <span>Qualidade <b>${qualityText}</b></span>
      <span>IV Total <b>${fmt(ivTotal)}</b></span>
      <span>Pontuação <b>${fmt(calculated.score)}</b></span>
    </div>`;
  const body = calculated.inRange
    ? `<div class="fipe-quote-total">
        <span>Soma estimada — Pokémon + nível</span>
        <strong>${fipeBrl(calculated.totalMin)} a ${fipeBrl(calculated.totalMax)}</strong>
      </div>
      <div class="fipe-quote-grid">
        <div class="is-diamond"><span>Faixa em diamantes</span><img src="assets/diamante-pokeidle.webp" alt="" aria-hidden="true"><b>${calculated.diamondsMin} a ${calculated.diamondsMax}</b></div>
        <div><span>Valor do Pokémon</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 0 1 7.75 6H15.9a4 4 0 0 0-7.8 0H4.25A8 8 0 0 1 12 4zm0 10.5A2.5 2.5 0 1 1 12 9.5a2.5 2.5 0 0 1 0 5zM4.25 14h3.85a4 4 0 0 0 7.8 0h3.85A8 8 0 0 1 4.25 14z"/></svg><b>${fipeBrl(calculated.pokemonMin)} a ${fipeBrl(calculated.pokemonMax)}</b></div>
        <div><span>Custo pelo nível</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 3 12h5v9h8v-9h5zm0 2.83L16.17 10H14v9h-4v-9H7.83z"/></svg><b>${fipeBrl(calculated.levelValue)}</b></div>
      </div>`
    : `<div class="fipe-warning fipe-quote-warning">
        <strong>Pontuação ${fmt(calculated.score)} sem cotação</strong>
        <span>${esc(calculated.reason)}</span>
        <small>Custo do nível informado: ${fipeBrl(calculated.levelValue)}.</small>
      </div>`;
  $("#fipe-quote-content").innerHTML = meta + body + `
    <div class="fipe-quote-note">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1 3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5zm0 2.2 7 3.1V11c0 4.4-3 8.7-7 9.9-4-1.2-7-5.5-7-9.9V6.3z"/></svg>
      <span>Referência, não oferta. Condição, procura e negociação podem alterar o preço final.</span>
    </div>
    <button class="fipe-quote-open" id="fipe-quote-open" type="button">Abrir PokeFipe completa ↗</button>`;
  $("#fipe-quote-open").addEventListener("click", () => {
    const form = $("#lab-fipe-form");
    form.elements.iv.value = ivTotal;
    form.elements.multiplier.value = quality;
    form.elements.level.value = level;
    const option = window.PokeFipe.POKEMON.find((pokemon) => pokemon.slug === ivQuote.slug);
    form.elements.pokemon.value = option ? option.slug : "";
    closeFipeQuote();
    selectTab("fipe");
    renderLabFipe();
    $("#tab-fipe").scrollIntoView({ behavior:"smooth", block:"start" });
  });
  fipeQuoteModal.hidden = false;
  document.body.style.overflow = "hidden";
  $("#fipe-quote-close").focus();
}
function closeFipeQuote(){
  fipeQuoteModal.hidden = true;
  document.body.style.overflow = "";
}
$("#fipe-quote-close").addEventListener("click", closeFipeQuote);
fipeQuoteModal.addEventListener("mousedown", (e) => { if (e.target === fipeQuoteModal) closeFipeQuote(); });
$("#x-result").addEventListener("click", (e) => {
  if (e.target.closest("#iv-fipe-button")) openFipeQuote();
});

/* ---------------------------------------------- navegação */
function renderActive(){
  if (activeTab === "pokedex") renderPokedex();
  else if (activeTab === "avaliar") renderAvaliar();
  else if (activeTab === "rota") renderRota();
}

function setSpecies(slug){
  cur = ALL_DEX.find((p) => p.slug === slug) || DEX[0];
  $("#iv-species-search").value = cur.nome;
  $$(".search-input-wrap").forEach((wrap) => { wrap.querySelector(".search-clear").hidden = !wrap.querySelector("input").value; });
  $("#x-species-sprite").src = spriteUrl(cur.dexNo);
  $("#x-species-sprite").alt = cur.nome;
  $("#x-species-sprite").classList.remove("is-placeholder");
  $("#x-species").value = cur.slug;
  syncUrl();
  renderActive();
}

function selectTab(name){
  activeTab = name;
  $$(".main-tab").forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === name ? "true" : "false"));
  $$(".panel").forEach((s) => s.classList.toggle("active", s.id === "tab-" + name));
  syncUrl();
  renderActive();
}

$$(".main-tab").forEach((b) => b.addEventListener("click", () => selectTab(b.dataset.tab)));
$("#home-link").addEventListener("click", (e) => { e.preventDefault(); selectTab("avaliar"); });
function speciesFromSearch(value, pool = DEX){
  const term = cleanOcr(value).replace(/^#/, "").trim();
  if (!term) return null;
  const number = term.match(/^0*(\d+)\b/);
  if (number) {
    const byNumber = pool.find((p) => p.dexNo === +number[1]);
    if (byNumber) return byNumber;
  }
  const exact = pool.find((p) => cleanOcr(p.nome) === term || p.slug === term);
  return exact || pool.find((p) => cleanOcr(p.nome).includes(term));
}
function bindSpeciesSearch(inputId, feedbackId, resultsId, pool = DEX, onChoose = (pokemon) => setSpecies(pokemon.slug)){
  const input = $("#" + inputId), feedback = $("#" + feedbackId), results = $("#" + resultsId);
  const clearButton = input.parentElement.querySelector(".search-clear");
  let matches = [], activeIndex = -1;
  const close = () => {
    results.hidden = true;
    input.setAttribute("aria-expanded", "false");
    activeIndex = -1;
  };
  const choose = (pokemon) => {
    feedback.classList.remove("is-error");
    feedback.textContent = "";
    close();
    input.value = pokemon.nome;
    if (clearButton) clearButton.hidden = false;
    onChoose(pokemon);
  };
  const paintActive = () => {
    [...results.querySelectorAll(".species-option")].forEach((button, index) =>
      button.classList.toggle("is-active", index === activeIndex));
    results.querySelector(".is-active")?.scrollIntoView({ block:"nearest" });
  };
  const open = (value = "") => {
    const term = cleanOcr(value).replace(/^#/, "").trim();
    const dexSearch = /^0*\d+$/.test(term) ? +term : null;
    matches = pool.filter((p) => !term || cleanOcr(p.nome).includes(term) ||
      (dexSearch !== null && p.dexNo === dexSearch));
    results.innerHTML = matches.length
      ? matches.map((p) => `<button class="species-option" type="button" role="option" data-slug="${p.slug}"><span>${esc(p.nome)}</span><span class="dex-number">#${pad3(p.dexNo)}</span></button>`).join("")
      : '<div class="species-empty">Nenhum Pokémon começa com esse texto.</div>';
    results.hidden = false;
    input.setAttribute("aria-expanded", "true");
    activeIndex = -1;
    results.querySelectorAll(".species-option").forEach((button) =>
      button.addEventListener("mousedown", (e) => {
        e.preventDefault();
        choose(pool.find((p) => p.slug === button.dataset.slug));
      }));
  };
  const commit = () => {
    const found = speciesFromSearch(input.value, pool);
    feedback.classList.toggle("is-error", !found);
    if (!found) {
      feedback.textContent = input.value.trim() ? "Pokémon não encontrado. Tente parte do nome ou o número." : "";
      return;
    }
    choose(found);
  };
  input.addEventListener("focus", () => { input.select(); open(); });
  input.addEventListener("click", () => {
    if (results.hidden) { input.select(); open(); }
  });
  input.addEventListener("input", () => {
    if (clearButton) clearButton.hidden = !input.value;
    feedback.textContent = "";
    feedback.classList.remove("is-error");
    open(input.value);
  });
  clearButton?.addEventListener("mousedown", (e) => e.preventDefault());
  clearButton?.addEventListener("click", (e) => {
    e.preventDefault();
    input.value = "";
    clearButton.hidden = true;
    feedback.textContent = "";
    input.focus();
    open();
  });
  input.addEventListener("blur", () => setTimeout(close, 120));
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (results.hidden) open(input.value);
      activeIndex = Math.min(activeIndex + 1, matches.length - 1); paintActive();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0); paintActive();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && matches[activeIndex]) choose(matches[activeIndex]);
      else if (matches.length) choose(matches[0]);
      else commit();
    } else if (e.key === "Escape") close();
  });
}
bindSpeciesSearch("iv-species-search", "iv-species-feedback", "iv-species-results", ALL_DEX);
bindSpeciesSearch("pokedex-species-search", "pokedex-species-feedback", "pokedex-species-results", ALL_DEX, (pokemon) => {
  pokedexSelected = pokemon;
  renderPokedex();
});
bindSpeciesSearch("route-v3-species-search", "route-v3-species-feedback", "route-v3-species-results", ROUTE_DEX, (pokemon) => {
  cur = pokemon;
  routePokemonSelected = true;
  routeCoverage.clear();
  renderRouteCoverage();
  renderRota();
  syncUrl();
});
$("#x-species").addEventListener("change", () => setSpecies($("#x-species").value));
["x-level", "x-qual", "x-power", "x-ivtotal"].forEach((id) => $("#" + id).addEventListener("input", renderAvaliar));
STAT_NAMES.forEach((_, i) => $("#o" + i).addEventListener("input", renderAvaliar));
$("#iv-image").addEventListener("change", (e) => scanIvImage(e.target.files[0]));
IV_FIELD_IDS.forEach((id) => $("#"+id).addEventListener("input", (e) => e.target.classList.remove("ocr-missing")));
document.addEventListener("paste", (event) => {
  const image = [...(event.clipboardData?.items || [])].find((item) => item.type.startsWith("image/"));
  if (image) {
    event.preventDefault();
    /* Colar de qualquer aba leva direto pro avaliador com a imagem. */
    if (activeTab !== "avaliar") selectTab("avaliar");
    const file = image.getAsFile();
    if (file) {
      $("#iv-scan-status").innerHTML = '<span class="scan-loading">Imagem colada. Preparando leitura…</span>';
      scanIvImage(file);
    }
    return;
  }
  /* Ctrl+V sem imagem no avaliador (fora de um campo de texto): orienta o usuário. */
  if (activeTab === "avaliar" && !event.target.closest?.("input, textarea, select, [contenteditable]")) {
    $("#iv-scan-status").innerHTML = '<span class="scan-warn">Não encontrei imagem na área de transferência. Copie um print (Print Screen ou Ferramenta de Captura) e pressione Ctrl+V de novo.</span>';
  }
});
const ivScanCard = $(".scan-card");
["dragenter", "dragover"].forEach((name) => ivScanCard.addEventListener(name, (event) => {
  event.preventDefault();
  ivScanCard.classList.add("is-dragging");
}));
["dragleave", "drop"].forEach((name) => ivScanCard.addEventListener(name, (event) => {
  event.preventDefault();
  ivScanCard.classList.remove("is-dragging");
}));
ivScanCard.addEventListener("drop", (event) => {
  const dropped = [...(event.dataTransfer?.files || [])];
  const image = dropped.find((file) => window.IvScan?.isAcceptedImage(file));
  if (image) scanIvImage(image);
  else if (dropped.length) $("#iv-scan-status").innerHTML = '<span class="scan-error">Formato não suportado. Envie um print em PNG, JPG ou WebP.</span>';
});

const ivHelpModal = $("#iv-help-modal");
function openIvHelp(){
  ivHelpModal.hidden = false;
  document.body.style.overflow = "hidden";
  $("#iv-help-close").focus();
}
function closeIvHelp(){
  ivHelpModal.hidden = true;
  document.body.style.overflow = "";
  $("#iv-help-button").focus();
}
$("#iv-help-button").addEventListener("click", openIvHelp);
$("#iv-help-close").addEventListener("click", closeIvHelp);
ivHelpModal.addEventListener("mousedown", (e) => { if (e.target === ivHelpModal) closeIvHelp(); });
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!ivHelpModal.hidden) closeIvHelp();
  if (!$("#fipe-quote-modal").hidden) closeFipeQuote();
});
$("#iv-help-use-image").addEventListener("click", () => {
  closeIvHelp();
  $("#iv-image").click();
});
$("#iv-example-button").addEventListener("click", () => {
  const lvl = 100, q = 1.35, exampleIvs = [24,29,20,18,25,16];
  if (!$("#x-species").value) setSpecies(cur.slug);
  const stats = exampleIvs.map((iv, i) => statAt(cur.baseStats[i], iv, lvl, q, i));
  $("#x-level").value = lvl;
  $("#x-qual").value = q;
  $("#x-ivtotal").value = exampleIvs.reduce((sum, iv) => sum + iv, 0);
  $("#x-power").value = Math.round(stats.reduce((sum, value) => sum + value, 0) * q);
  stats.forEach((value, i) => { $("#o" + i).value = value; });
  $("#iv-scan-status").textContent = "Exemplo preenchido. Você pode alterar qualquer campo.";
  renderAvaliar();
});
$("#iv-reset-button").addEventListener("click", () => {
  IV_FIELD_IDS.forEach((id) => { $("#" + id).value = ""; });
  clearIvHighlights();
  if (ivPreviewUrl) { URL.revokeObjectURL(ivPreviewUrl); ivPreviewUrl = null; }
  $("#iv-preview").removeAttribute("src");
  $("#iv-preview-wrap").hidden = true;
  $("#x-species").value = "";
  $("#iv-species-search").value = "";
  $("#iv-species-search").parentElement.querySelector(".search-clear").hidden = true;
  $("#x-species-sprite").src = SPRITE_PLACEHOLDER;
  $("#x-species-sprite").alt = "";
  $("#x-species-sprite").classList.add("is-placeholder");
  $("#iv-species-feedback").textContent = "";
  $("#iv-scan-status").textContent = "";
  renderAvaliar();
});

$("#rota-level").addEventListener("input", renderRota);

$("#lab-fipe-form").addEventListener("submit", (event) => { event.preventDefault(); renderLabFipe(); });
$("#lab-fipe-form").addEventListener("reset", () => requestAnimationFrame(() => {
  $("#fipe-result").hidden = true;
  $("#fipe-warning").hidden = true;
  $("#fipe-empty").hidden = false;
}));
$("#lab-fipe-form").addEventListener("input", () => {
  if (!$("#fipe-result").hidden || !$("#fipe-warning").hidden) renderLabFipe();
});
[$("#pokedex-type"), $("#pokedex-rarity")].forEach((control) => control.addEventListener("change", () => { pokedexSelected = null; renderPokedex(); }));
$("#pokedex-species-search").parentElement.querySelector(".search-clear").addEventListener("click", () => { pokedexSelected = null; renderPokedex(); });


/* Publica a altura medida do header em --site-header-height, inclusive quando
   ele ganha uma segunda linha de abas. Aqui só medimos: quem decide se esse
   valor vira deslocamento é o CSS (--site-header-offset), porque no breakpoint
   em que o header deixa de ser sticky o deslocamento precisa ser zero mesmo que
   nenhum evento de resize chegue a disparar. */
(function trackHeaderHeight(){
  const header = $("body > header");
  if (!header) return;
  const apply = () => {
    const height = Math.round(header.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--site-header-height", `${height}px`);
  };
  apply();
  if (typeof ResizeObserver === "function") new ResizeObserver(apply).observe(header);
  window.addEventListener("resize", apply);
})();

/* loja: só linka quando tiver endereço publicado */
(function initStore(){
  const a = $("#store-link");
  if (STORE_URL) a.href = STORE_URL;
  else { a.removeAttribute("target"); a.href = "https://wa.me/5547988930280?text=" + encodeURIComponent("Olá, VP Store! 💎 Vim pelo VPLab e quero negociar diamantes."); }
})();

/* ---------------------------------------------- boot (deep-link) */
(function boot(){
  const u = new URL(location.href);
  const tab = u.searchParams.get("tab");
  const slug = u.searchParams.get("p");
  const routeLevel = Math.max(1, Math.floor(num(u.searchParams.get("level")) || 1));
  cur = DEX.find((p) => p.slug === slug) || DEX.find((p) => p.slug === "scizor") || DEX[0];
  $("#iv-species-search").value = "";
  $("#x-species-sprite").src = SPRITE_PLACEHOLDER;
  $("#x-species-sprite").alt = "";
  $("#x-species-sprite").classList.add("is-placeholder");
  $("#x-species").value = "";
  if (tab && ["pokedex","avaliar","rota","fipe","clas","breeding","profissoes"].includes(tab)) activeTab = tab;
  if (activeTab === "rota" && slug && ROUTE_DEX.some((pokemon) => pokemon.slug === slug)) {
    routePokemonSelected = true;
    $("#rota-level").value = routeLevel;
  } else if (activeTab === "rota" && !ROUTE_DEX_NUMBERS.has(cur.dexNo)) {
    cur = ROUTE_DEX.find((pokemon) => pokemon.slug === "charizard") || ROUTE_DEX[0];
  }
  $$(".main-tab").forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === activeTab ? "true" : "false"));
  $$(".panel").forEach((s) => s.classList.toggle("active", s.id === "tab-" + activeTab));
  renderRouteCoverage();
  renderActive();
})();
