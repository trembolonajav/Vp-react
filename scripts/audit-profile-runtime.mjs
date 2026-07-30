const [port, token, username] = process.argv.slice(2);
const emulateMobile = process.argv.includes("--mobile");
if (!port || !token || !username) {
  throw new Error("Uso: node scripts/audit-profile-runtime.mjs <porta-cdp> <token> <usuario> [--mobile]");
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
await command("Page.enable");
if (emulateMobile) {
  await command("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
}

await evaluate(`localStorage.setItem("vp-bazaar-token", ${JSON.stringify(token)}); location.href="/bazaar/perfil"`);
await wait(1400);
const ownBefore = await evaluate(`({
  path: location.pathname,
  heading: document.querySelector(".bz-account-title h1")?.textContent,
  username: document.querySelector('input[disabled]')?.value,
  avatarOptions: document.querySelectorAll(".bz-avatar-picker button").length,
  overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  viewport: { width: innerWidth, height: innerHeight }
})`);

const ownAfter = await evaluate(`(async () => {
  const textarea = document.querySelector(".bz-account-form textarea");
  const input = document.querySelector('.bz-account-form input:not([disabled])');
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(textarea, "Perfil salvo pelo navegador");
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, "@browser");
  input.dispatchEvent(new Event("input", { bubbles: true }));
  document.querySelector('.bz-avatar-picker button[aria-pressed="false"]')?.click();
  document.querySelector(".bz-account-form").requestSubmit();
  await new Promise(resolve => setTimeout(resolve, 900));
  return {
    success: document.querySelector('[role="status"]')?.textContent,
    publicLink: document.querySelector('a[href^="/bazaar/perfil/"]')?.getAttribute("href")
  };
})()`);

await evaluate(`localStorage.removeItem("vp-bazaar-token"); location.href=${JSON.stringify(`/bazaar/perfil/${username}`)}`);
await wait(1200);
const publicProfile = await evaluate(`({
  path: location.pathname,
  heading: document.querySelector(".bz-profile-hero h1")?.textContent,
  bio: document.querySelector(".bz-profile-hero p")?.textContent,
  memberSince: document.querySelector(".bz-profile-hero small")?.textContent,
  reactProfile: Boolean(document.querySelector(".bz-profile-hero")),
  legacyScript: Boolean(document.querySelector('script[src$="perfil.js"]')),
  overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth
})`);

await evaluate(`location.href="/bazaar/perfil/usuario-que-nao-existe"`);
await wait(900);
const missing = await evaluate(`({
  path: location.pathname,
  error: document.querySelector('[role="alert"] strong')?.textContent
})`);

socket.close();
console.log(JSON.stringify({ ownBefore, ownAfter, publicProfile, missing, consoleErrors }, null, 2));
