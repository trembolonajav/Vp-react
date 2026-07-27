import crypto from "node:crypto";
import { send, readJson, sameOrigin } from "../_lib/http.mjs";
import { readDb, writeDb, currentUser } from "../_lib/bazaar-account.mjs";

const clean = (value, max) => String(value || "").trim().slice(0, max);

export default async function handler(req, res) {
  const user = await currentUser(req);
  if (!user) return send(res, 401, { error: "Entre na sua conta para denunciar." });
  if (req.method !== "POST" || !sameOrigin(req)) return send(res, 405, { error: "Método não permitido." });
  const body = await readJson(req);
  const adId = clean(body.adId, 80);
  const reason = clean(body.reason, 100);
  if (!adId || !reason) return send(res, 400, { error: "Selecione o motivo da denúncia." });
  const db = await readDb();
  db.reports ||= [];
  const duplicate = db.reports.some((report) => report.adId === adId && report.reporterId === user.id && report.status === "aberta");
  if (duplicate) return send(res, 409, { error: "Você já enviou uma denúncia para este anúncio." });
  const report = {
    id: crypto.randomUUID(), adId, title: clean(body.title, 120), seller: clean(body.seller, 40),
    reason, details: clean(body.details, 600), reporterId: user.id, reporter: user.username,
    status: "aberta", createdAt: new Date().toISOString()
  };
  db.reports.push(report);
  await writeDb(db);
  return send(res, 201, { ok: true, id: report.id });
}
