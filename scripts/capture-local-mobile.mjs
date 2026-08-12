import { writeFile } from "node:fs/promises";

const targets = await fetch("http://127.0.0.1:9222/json/list").then((response) => response.json());
const page = targets.find((target) => target.type === "page" && target.url.includes("127.0.0.1:5174/vplab"));
if (!page) throw new Error("A página local do VPLab não está aberta.");
const socket = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
socket.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  const handler = pending.get(message.id);
  if (!handler) return;
  pending.delete(message.id);
  message.error ? handler.reject(message.error) : handler.resolve(message.result);
};
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
const command = (method, params = {}) => new Promise((resolve, reject) => {
  const callId = ++id;
  pending.set(callId, { resolve, reject });
  socket.send(JSON.stringify({ id: callId, method, params }));
});
await command("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await command("Runtime.evaluate", { expression: "[...document.querySelectorAll('button')].find(button => button.innerText.includes('ROTA DE CAÇA PWG'))?.click()" });
await new Promise((resolve) => setTimeout(resolve, 1000));
const metrics = await command("Runtime.evaluate", { expression: "window.scrollTo(0,0); JSON.stringify({innerWidth,scrollWidth:document.documentElement.scrollWidth,scrollX,href:location.href})", returnByValue: true });
console.log(metrics.result.value);
const screenshot = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
await writeFile(process.argv[2] || "vplab-mobile-check.png", Buffer.from(screenshot.data, "base64"));
socket.close();
