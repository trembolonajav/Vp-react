const section = process.argv[2] || "Pacotes";
const pageScope = process.argv[3] === "play" ? "/play" : "/tcg";
const targets = await fetch("http://127.0.0.1:9222/json/list").then((response) => response.json());
const page = targets.find((target) => target.type === "page" && target.url.includes(pageScope));
if (!page) throw new Error("A página direta do TCG não está aberta.");
const socket = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
socket.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  const handler = pending.get(message.id);
  if (!handler) return;
  pending.delete(message.id);
  handler(message);
};
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
const command = (method, params) => new Promise((resolve, reject) => {
  const callId = ++id;
  pending.set(callId, (message) => message.error || message.result?.exceptionDetails ? reject(message) : resolve(message.result));
  socket.send(JSON.stringify({ id: callId, method, params }));
});
const evaluate = async (expression) => (await command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result.value;
const clicked = await evaluate(`(() => {
  const element = [...document.querySelectorAll('*')]
    .filter((candidate) => candidate.getAttribute('aria-label') === ${JSON.stringify(section)} || candidate.innerText?.trim().split('\\n')[0] === ${JSON.stringify(section)})
    .filter((candidate) => candidate.getClientRects().length)
    .at(-1);
  let actionable = element;
  while (actionable?.parentElement && getComputedStyle(actionable).cursor !== 'pointer') actionable = actionable.parentElement;
  actionable?.click();
  return { clicked: Boolean(actionable), html: actionable?.outerHTML.slice(0, 2500) || null };
})()`);
console.error(JSON.stringify(clicked, null, 2));
if (!clicked.clicked) console.error(`Seção não encontrada na tela atual: ${section}`);
if (section.includes("rasgar")) {
  const rect = await evaluate(`(() => {
    const element = [...document.querySelectorAll('*')].find((candidate) => candidate.innerText?.trim() === ${JSON.stringify(section)});
    const box = element?.getBoundingClientRect();
    return box ? { x: box.left + box.width / 2, y: box.top + box.height / 2 } : null;
  })()`);
  if (rect) {
    await command("Input.dispatchMouseEvent", { type: "mouseMoved", x: rect.x, y: rect.y });
    await command("Input.dispatchMouseEvent", { type: "mousePressed", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
    await command("Input.dispatchMouseEvent", { type: "mouseMoved", x: rect.x, y: Math.max(20, rect.y - 180), button: "left", buttons: 1 });
    await command("Input.dispatchMouseEvent", { type: "mouseReleased", x: rect.x, y: Math.max(20, rect.y - 180), button: "left", clickCount: 1 });
  }
}
await new Promise((resolve) => setTimeout(resolve, 1200));
console.log(await evaluate("document.body.innerText"));
socket.close();
