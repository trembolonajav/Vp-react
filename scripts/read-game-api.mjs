const endpoint = process.argv[2];
if (!endpoint?.startsWith("/api/game/")) throw new Error("Endpoint inválido");

const targets = await fetch("http://127.0.0.1:9223/json").then((response) => response.json());
const page = targets.find((target) => target.type === "page" && target.url.includes("poke.idleworld.online"));
if (!page) throw new Error("A aba do jogo não está aberta");

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

const expression = `(async () => {
  const findToken = (value) => {
    if (!value) return "";
    if (typeof value === "string") {
      try { return findToken(JSON.parse(value)); } catch { return value.startsWith("eyJ") ? value : ""; }
    }
    if (typeof value !== "object") return "";
    for (const [key, item] of Object.entries(value)) {
      if (/^(accessToken|authToken|token)$/i.test(key) && typeof item === "string") return item;
      const nested = findToken(item);
      if (nested) return nested;
    }
    return "";
  };
  const token = findToken({
    local: Object.fromEntries(Object.entries(localStorage)),
    session: Object.fromEntries(Object.entries(sessionStorage))
  });
  const response = await fetch(${JSON.stringify(endpoint)}, {
    credentials: "include",
    headers: token ? { Authorization: "Bearer " + token } : {}
  });
  return JSON.stringify({ status: response.status, body: await response.json() });
})()`;

const result = await new Promise((resolve, reject) => {
  const id = 1;
  const timer = setTimeout(() => reject(new Error("Tempo esgotado")), 10000);
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id !== id) return;
    clearTimeout(timer);
    resolve(message);
  });
  socket.send(JSON.stringify({ id, method: "Runtime.evaluate", params: { expression, awaitPromise: true, returnByValue: true } }));
});

socket.close();
const value = result.result?.result?.value;
if (!value) throw new Error(result.result?.exceptionDetails?.text || "Resposta vazia");
console.log(JSON.stringify(JSON.parse(value), null, 2));
