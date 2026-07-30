const [port, username, email, password] = process.argv.slice(2);
const emulateMobile = process.argv.includes("--mobile");
if (!port || !username || !email || !password) {
  throw new Error("Uso: node scripts/audit-auth-runtime.mjs <porta-cdp> <usuario> <email> <senha>");
}

const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const page = tabs.find((tab) => tab.type === "page" && tab.url.includes("/bazaar/login"));
if (!page) throw new Error("Página de login não encontrada no Chrome.");

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
  await command("Page.reload", { ignoreCache: true });
}
await new Promise((resolve) => setTimeout(resolve, 1500));

const login = await evaluate(`(() => ({
  path: location.pathname,
  heading: document.querySelector("#auth-title")?.textContent,
  loginField: Boolean(document.querySelector("#l-login")),
  registerField: Boolean(document.querySelector("#r-user")),
  overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth
}))()`);

await evaluate(`document.querySelector('a[href="/bazaar/cadastro"]')?.click()`);
await new Promise((resolve) => setTimeout(resolve, 800));
const cadastro = await evaluate(`(() => ({
  path: location.pathname,
  heading: document.querySelector("#auth-title")?.textContent,
  usernameField: Boolean(document.querySelector("#r-user")),
  emailField: Boolean(document.querySelector("#r-email")),
  passwordMinLength: document.querySelector("#l-pass")?.minLength,
  overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  viewport: { width: innerWidth, height: innerHeight }
}))()`);

const registration = await evaluate(`(async () => {
  const set = (selector, value) => {
    const input = document.querySelector(selector);
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  };
  set("#r-user", ${JSON.stringify(username)});
  set("#r-email", ${JSON.stringify(email)});
  set("#l-pass", ${JSON.stringify(password)});
  document.querySelector("form").requestSubmit();
  await new Promise(resolve => setTimeout(resolve, 1400));
  return {
    path: location.pathname,
    tokenStored: Boolean(localStorage.getItem("vp-bazaar-token")),
    authenticatedHeader: document.body.textContent.includes(${JSON.stringify(username)}),
  };
})()`);

await command("Page.reload", { ignoreCache: true });
await new Promise((resolve) => setTimeout(resolve, 1400));
const restored = await evaluate(`({
  path: location.pathname,
  tokenStored: Boolean(localStorage.getItem("vp-bazaar-token")),
  authenticatedHeader: document.body.textContent.includes(${JSON.stringify(username)}),
})`);

await evaluate(`(() => {
  localStorage.removeItem("vp-bazaar-token");
  history.pushState({}, "", "/bazaar/login");
  dispatchEvent(new PopStateEvent("popstate"));
})()`);
await new Promise((resolve) => setTimeout(resolve, 600));
const invalid = await evaluate(`(async () => {
  const set = (selector, value) => {
    const input = document.querySelector(selector);
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  };
  set("#l-login", ${JSON.stringify(username)});
  set("#l-pass", "senha-incorreta");
  document.querySelector("form").requestSubmit();
  await new Promise(resolve => setTimeout(resolve, 800));
  return {
    path: location.pathname,
    error: document.querySelector('[role="alert"]')?.textContent,
    tokenStored: Boolean(localStorage.getItem("vp-bazaar-token")),
  };
})()`);

socket.close();
console.log(JSON.stringify({ login, cadastro, registration, restored, invalid, consoleErrors }, null, 2));
