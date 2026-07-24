const query = process.argv[2] || "nextTask";
const targets = await fetch("http://127.0.0.1:9223/json").then((response) => response.json());
const page = targets.find((target) => target.type === "page" && target.url.includes("poke.idleworld.online"));
if (!page) throw new Error("A aba do jogo não está aberta");

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

const expression = `(async () => {
  const needle = ${JSON.stringify(query)}.toLowerCase();
  const urls = [...new Set(performance.getEntriesByType("resource").map((entry) => entry.name).filter((url) => /\\/_next\\/static\\/chunks\\/.+\\.js/.test(url)))];
  const matches = [];
  for (const url of urls) {
    const source = await fetch(url).then((response) => response.text());
    const lower = source.toLowerCase();
    let index = lower.indexOf(needle);
    while (index >= 0 && matches.length < 80) {
      matches.push({ url, snippet: source.slice(Math.max(0, index - 500), index + needle.length + 1200) });
      index = lower.indexOf(needle, index + needle.length);
    }
  }
  return JSON.stringify(matches);
})()`;

const result = await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error("Tempo esgotado")), 30000);
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id !== 1) return;
    clearTimeout(timer);
    resolve(message);
  });
  socket.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression, awaitPromise: true, returnByValue: true } }));
});
socket.close();
console.log(JSON.stringify(JSON.parse(result.result.result.value || "[]"), null, 2));
