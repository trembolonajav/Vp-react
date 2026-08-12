import express from "express";
import QRCode from "qrcode";
import pino from "pino";
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from "@whiskeysockets/baileys";

const port = Number(process.env.PORT || 3000);
const authDir = process.env.WHATSAPP_AUTH_DIR || "/data/auth";
const serviceToken = process.env.WHATSAPP_SERVICE_TOKEN || "dev-whatsapp-token";
const logger = pino({ level: process.env.LOG_LEVEL || "warn" });

let socket;
let state = { status: "starting", qr: null, phone: null, lastConnection: null, error: null };
let configuredGroup = process.env.WHATSAPP_GROUP_JID || "";
let reconnectTimer;

const publicState = () => ({ ...state, groupJid: configuredGroup || null });

async function connect() {
  clearTimeout(reconnectTimer);
  state = { ...state, status: "connecting", qr: null, error: null };
  const { state: auth, saveCreds } = await useMultiFileAuthState(authDir);
  socket = makeWASocket({ auth, logger, printQRInTerminal: false, syncFullHistory: false, markOnlineOnConnect: false });
  socket.ev.on("creds.update", saveCreds);
  socket.ev.on("connection.update", async ({ connection, qr, lastDisconnect }) => {
    if (qr) state = { ...state, status: "qr", qr: await QRCode.toDataURL(qr), error: null };
    if (connection === "open") {
      state = { status: "connected", qr: null, phone: socket.user?.id?.split(":")[0] || null, lastConnection: new Date().toISOString(), error: null };
    }
    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      state = { ...state, status: loggedOut ? "disconnected" : "reconnecting", qr: null, error: loggedOut ? "Sessão desconectada pelo WhatsApp." : null };
      if (!loggedOut) reconnectTimer = setTimeout(() => void connect(), 3000);
    }
  });
}

const app = express();
app.use(express.json({ limit: "100kb" }));
const protectedRoute = (req, res, next) => req.headers.authorization === `Bearer ${serviceToken}` ? next() : res.status(401).json({ message: "Não autorizado." });

app.get("/health", (_req, res) => res.json({ ok: true, status: state.status }));
app.use(protectedRoute);
app.get("/status", (_req, res) => res.json(publicState()));
app.post("/connect", async (_req, res) => { await connect(); res.status(202).json(publicState()); });
app.post("/disconnect", async (_req, res) => { await socket?.logout(); state = { ...state, status: "disconnected", qr: null, phone: null }; res.json(publicState()); });
app.get("/groups", async (_req, res) => {
  if (state.status !== "connected") return res.status(409).json({ message: "WhatsApp não conectado." });
  const groups = await socket.groupFetchAllParticipating();
  res.json(Object.values(groups).map(({ id, subject, size }) => ({ id, name: subject, size })).sort((a, b) => a.name.localeCompare(b.name)));
});
app.put("/config", (req, res) => { configuredGroup = String(req.body?.groupJid || "").trim(); res.json(publicState()); });
app.post("/send", async (req, res) => {
  if (state.status !== "connected") return res.status(409).json({ message: "WhatsApp não conectado." });
  const target = String(req.body?.groupJid || configuredGroup || "").trim();
  const text = String(req.body?.message || "").trim();
  if (!target.endsWith("@g.us") || !text) return res.status(400).json({ message: "Grupo e mensagem são obrigatórios." });
  const result = await socket.sendMessage(target, { text: text.slice(0, 3500) });
  res.json({ sent: true, id: result?.key?.id || null });
});

app.use((error, _req, res, _next) => { logger.error(error); res.status(500).json({ message: error?.message || "Falha no serviço WhatsApp." }); });
app.listen(port, () => { logger.info({ port }, "WhatsApp service ready"); void connect(); });
