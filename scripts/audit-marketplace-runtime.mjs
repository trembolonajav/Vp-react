const port = process.argv[2];
const emulatedWidth = Number(process.argv[3] || 0);
const emulatedHeight = Number(process.argv[4] || 0);
const testInteractions = process.argv.includes("--interactions");
if (!port) throw new Error("Uso: node scripts/audit-marketplace-runtime.mjs <porta-cdp>");

const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const page = tabs.find((tab) => tab.type === "page" && tab.url.includes("/bazaar"));
if (!page) throw new Error("Marketplace não encontrado no Chrome");

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let id = 0;
const pending = new Map();
const errors = [];
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.method === "Runtime.exceptionThrown") {
    errors.push(message.params.exceptionDetails.text);
  }
  if (message.method === "Log.entryAdded" && message.params.entry.level === "error") {
    errors.push(message.params.entry.text);
  }
  if (!message.id || !pending.has(message.id)) return;
  const task = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) task.reject(new Error(message.error.message));
  else task.resolve(message.result);
});

const command = (method, params = {}) => new Promise((resolve, reject) => {
  const current = ++id;
  pending.set(current, { resolve, reject });
  socket.send(JSON.stringify({ id: current, method, params }));
});

await command("Runtime.enable");
await command("Log.enable");
await command("Page.enable");
if (emulatedWidth > 0 && emulatedHeight > 0) {
  await command("Emulation.setDeviceMetricsOverride", {
    width: emulatedWidth,
    height: emulatedHeight,
    deviceScaleFactor: 1,
    mobile: true,
  });
}
await command("Page.reload", { ignoreCache: true });
await new Promise((resolve) => setTimeout(resolve, 5000));

const expression = `(() => ({
  title: document.title,
  cards: document.querySelectorAll(".bz-card").length,
  total: document.querySelector(".bz-stat b")?.textContent?.trim(),
  count: document.querySelector(".bz-count")?.textContent?.trim(),
  reactMarketplace: Boolean(document.querySelector(".bz-hero") && document.querySelector(".bz-grid")),
  detailLinks: [...document.querySelectorAll(".bz-cta")].map(a => a.getAttribute("href")),
  legacyMarketplaceScript: Boolean(document.querySelector('script[src$="bazaar.js"]')),
  viewport: { width: innerWidth, height: innerHeight },
  overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth
}))()`;
const evaluated = await command("Runtime.evaluate", {
  expression,
  returnByValue: true,
  awaitPromise: true,
});

let interactions;
if (testInteractions) {
  const interactionExpression = `(async () => {
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const search = document.querySelector("#f-q");
    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    valueSetter.call(search, "char");
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(1200);
    const searchCount = document.querySelector(".bz-count")?.textContent?.trim();
    const searchLinks = [...document.querySelectorAll(".bz-cta")].map(a => a.getAttribute("href"));

    document.querySelector(".bz-clear")?.click();
    await wait(1200);
    const firstPageFirstLink = document.querySelector(".bz-cta")?.getAttribute("href");
    const next = [...document.querySelectorAll(".bz-pager button")].at(-1);
    next?.click();
    await wait(1200);
    const secondPageLabel = document.querySelector(".bz-pager span")?.textContent?.trim();
    const secondPageFirstLink = document.querySelector(".bz-cta")?.getAttribute("href");

    const sort = document.querySelector("#f-sort");
    const selectSetter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set;
    selectSetter.call(sort, "titulo");
    sort.dispatchEvent(new Event("change", { bubbles: true }));
    await wait(1200);
    return {
      searchCount,
      searchLinks,
      firstPageFirstLink,
      secondPageLabel,
      secondPageFirstLink,
      sortValue: sort.value,
      sortResetToFirstPage: document.querySelector(".bz-pager span")?.textContent?.includes("Página 1"),
    };
  })()`;
  const interactionResult = await command("Runtime.evaluate", {
    expression: interactionExpression,
    returnByValue: true,
    awaitPromise: true,
  });
  interactions = interactionResult.result.value;
}

socket.close();
console.log(JSON.stringify({ ...evaluated.result.value, interactions, consoleErrors: errors }, null, 2));
