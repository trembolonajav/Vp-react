const DEBUG_URL = "http://127.0.0.1:9222/json/list";
const targets = await fetch(DEBUG_URL).then((response) => response.json());
const page = targets.find((target) => target.type === "page" && target.url.includes("pokewg.com"));
if (!page) throw new Error("A aba do PokeWG não está disponível na porta 9222.");

const socket = new WebSocket(page.webSocketDebuggerUrl);
let sequence = 0;
const pending = new Map();
socket.addEventListener("message", ({ data }) => {
  const message = JSON.parse(data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error || message.result?.exceptionDetails) reject(new Error(JSON.stringify(message.error || message.result.exceptionDetails)));
  else resolve(message.result);
});
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

function command(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
async function evaluate(expression) {
  const result = await command("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  return result.result.value;
}
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

if ((process.argv[2] || "").toLowerCase() === "sources") {
  const matches = await evaluate(`(async () => {
    const urls = [...new Set([
      ...[...document.scripts].map((script) => script.src),
      ...performance.getEntriesByType('resource').map((entry) => entry.name).filter((url) => url.includes('.js')),
    ].filter(Boolean))];
    const found = [];
    for (const url of urls) {
      let text;
      try { text = await fetch(url).then((response) => response.text()); }
      catch { continue; }
      for (const needle of ['Nightmare', 'Treecko', 'Hoenn']) {
        const index = text.indexOf(needle);
        if (index >= 0) found.push({ url, needle, snippet: text.slice(Math.max(0, index - 600), index + 1800) });
      }
    }
    return found;
  })()`);
  console.log(JSON.stringify(matches, null, 2));
  socket.close();
  process.exit(0);
}

await evaluate(`(async () => {
  if (document.body.innerText.includes('🌍 MAPA ·')) return;
  const opener = [...document.querySelectorAll('*')]
    .filter((element) => element.innerText?.trim() === 'MAPA')
    .sort((a, b) => a.children.length - b.children.length)[0];
  opener?.click();
  await new Promise((resolve) => setTimeout(resolve, 600));
})()`);

async function selectRegion(region) {
  const clicked = await evaluate(`(() => {
    const candidates = [...document.querySelectorAll('button,[role="tab"],a,div,span')]
      .filter((element) => element.innerText?.trim().split('\\n')[0] === ${JSON.stringify(region)});
    const target = candidates.sort((a, b) => a.children.length - b.children.length)[0];
    if (!target) return false;
    target.disabled = false;
    target.click();
    return true;
  })()`);
  if (!clicked) throw new Error(`Região não encontrada: ${region}`);
  await wait(800);
  return evaluate(`document.body.innerText.match(/🌍 MAPA · ([^\\n]+)/)?.[1] || null`);
}

async function scrapeRegion(region) {
  const activeRegion = await selectRegion(region);
  if (activeRegion?.toLocaleLowerCase("pt-BR") !== region.toLocaleLowerCase("pt-BR")) {
    return { region, available: false, reason: "Região desabilitada no mapa PWG", entries: [] };
  }
  return evaluate(`(() => {
    const cardPattern = /^(.+?)\\nNv\\s*(\\d+)$/;
    const labels = [...document.querySelectorAll('*')].filter((element) => {
      if (!cardPattern.test(element.innerText?.trim() || '')) return false;
      return ![...element.children].some((child) => cardPattern.test(child.innerText?.trim() || ''));
    });
    const entries = labels.map((label) => {
      const card = label.closest('button');
      if (!card || getComputedStyle(card).position !== 'absolute') return null;
      const [, name, level] = label.innerText.trim().match(cardPattern);
      const styled = [...card.querySelectorAll('[style*="background-image"]')][0];
      const image = card.querySelector('img');
      const background = styled ? getComputedStyle(styled).backgroundImage.match(/url\\(["']?(.*?)["']?\\)/)?.[1] : null;
      return {
        name,
        level: Number(level),
        sprite: image?.currentSrc || image?.src || background || null,
        spritePosition: styled ? getComputedStyle(styled).backgroundPosition : null,
        spriteSize: styled ? getComputedStyle(styled).backgroundSize : null,
        x: Number.parseFloat(card.style.left),
        y: Number.parseFloat(card.style.top),
      };
    }).filter(Boolean);
    return { region: ${JSON.stringify(region)}, available: true, entries };
  })()`);
}

const requested = process.argv[2] || "Kanto";
const regions = requested.toLowerCase() === "all"
  ? ["Kanto", "Outland", "Johto", "Hoenn", "Nightmare"]
  : [requested];
const snapshots = [];
for (const region of regions) snapshots.push(await scrapeRegion(region));
const result = snapshots.length === 1 ? snapshots[0] : {
  title: "ROTA DE CAÇA PWG",
  source: "https://pokewg.com/play · mapa do jogo",
  extractedAt: new Date().toISOString(),
  regions: snapshots,
};
const json = JSON.stringify(result, null, 2) + "\n";
const output = process.argv[3];
if (output) {
  await mkdir(new URL("../frontend/public/vplab-data/", import.meta.url), { recursive: true });
  await writeFile(output, json, "utf8");
  console.log(`Dados salvos em ${output}: ${snapshots.map(({ region, entries }) => `${region}=${entries.length}`).join(', ')}`);
} else {
  console.log(json);
}
socket.close();
import { mkdir, writeFile } from "node:fs/promises";
