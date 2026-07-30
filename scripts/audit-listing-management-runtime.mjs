const [port, token, listingId] = process.argv.slice(2);
const emulateMobile = process.argv.includes("--mobile");
if (!port || !token || !listingId) {
  throw new Error("Uso: node scripts/audit-listing-management-runtime.mjs <porta-cdp> <token> <anuncio> [--mobile]");
}

const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const page = tabs.find((tab) => tab.type === "page");
if (!page) throw new Error("Página não encontrada no Chrome.");

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let id = 0;
const pending = new Map();
const consoleErrors = [];
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.method === "Runtime.exceptionThrown") {
    consoleErrors.push(message.params.exceptionDetails.text);
  }
  if (message.method === "Log.entryAdded" && message.params.entry.level === "error") {
    consoleErrors.push(message.params.entry.text);
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
const evaluate = async (expression) => {
  const result = await command("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return result.result.value;
};
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

await command("Runtime.enable");
await command("Log.enable");
if (emulateMobile) {
  await command("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
}

await evaluate(`localStorage.setItem("vp-bazaar-token", ${JSON.stringify(token)});
  location.href=${JSON.stringify(`/bazaar/anunciar/${listingId}`)}`);
await wait(1400);
const edit = await evaluate(`({
  path: location.pathname,
  heading: document.querySelector(".bz-form-title")?.textContent,
  level: document.querySelector("#a-nivel")?.value,
  levelMax: document.querySelector("#a-nivel")?.max,
  status: [...document.querySelectorAll("select")].find(el => [...el.options].some(o => o.value === "pausado"))?.value,
  legacyScript: Boolean(document.querySelector('script[src$="anunciar.js"]')),
  overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  viewport: innerWidth
})`);

await evaluate(`location.href="/bazaar/meus-anuncios"`);
await wait(1200);
const mine = await evaluate(`({
  path: location.pathname,
  title: document.querySelector(".mine-info strong")?.textContent,
  status: document.querySelector(".mine-status")?.textContent,
  actions: [...document.querySelectorAll(".mine-actions a, .mine-actions button")].map(el => el.textContent.trim()),
  legacyScript: Boolean(document.querySelector('script[src$="meus-anuncios.js"]')),
  overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth
})`);

socket.close();
console.log(JSON.stringify({ edit, mine, consoleErrors }, null, 2));
