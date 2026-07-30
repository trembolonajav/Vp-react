import path from "node:path";

const port = process.argv[2];
const imagePath = process.argv[3];
if (!port || !imagePath) {
  throw new Error("Uso: node scripts/audit-react-ocr.mjs <porta-cdp> <imagem>");
}

const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const page = tabs.find((tab) => tab.type === "page" &&
  (tab.url.includes("/vplab/avaliar-iv") || tab.url.endsWith("/vplab/")));
if (!page) throw new Error("Página React do Avaliar IV não encontrada");

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let id = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});
const command = (method, params = {}) => new Promise((resolve, reject) => {
  const current = ++id;
  pending.set(current, { resolve, reject });
  socket.send(JSON.stringify({ id: current, method, params }));
});

const { root } = await command("DOM.getDocument");
const { nodeId } = await command("DOM.querySelector", {
  nodeId: root.nodeId,
  selector: '.vplab-drop input[type="file"]',
});
if (!nodeId) throw new Error("Input de imagem não encontrado");
await command("DOM.setFileInputFiles", {
  nodeId,
  files: [path.resolve(imagePath)],
});

const deadline = Date.now() + 120_000;
let snapshot;
while (Date.now() < deadline) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const result = await command("Runtime.evaluate", {
    expression: `JSON.stringify({
      status: document.querySelector(".vplab-status")?.textContent || "",
      values: [...document.querySelectorAll(".vplab-panel input:not([type=file])")].map(input => input.value),
      raw: document.querySelector(".vplab-raw pre")?.textContent || "",
      result: document.querySelector(".vplab-result")?.textContent || ""
    })`,
    returnByValue: true,
  });
  snapshot = JSON.parse(result.result.value);
  if (!/Inicializando|analisando|Lendo imagem/.test(snapshot.status)) break;
}
socket.close();
if (!snapshot || /Inicializando|analisando|Lendo imagem/.test(snapshot.status)) {
  throw new Error("OCR não terminou dentro do limite");
}
console.log(JSON.stringify(snapshot, null, 2));
