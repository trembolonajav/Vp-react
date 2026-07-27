import crypto from "node:crypto";
import { send, readJson, sameOrigin } from "../_lib/http.mjs";
import {
  readDb, writeDb, publicUser, makePassword, verifyPassword, sessionCookie,
  clearSessionCookie, currentUser, normalizeLogin, normalizeUsername
} from "../_lib/bazaar-account.mjs";

export default async function handler(req, res) {
  if (req.method === "GET") return send(res, 200, { user: publicUser(await currentUser(req)) });
  if (req.method !== "POST" || !sameOrigin(req)) return send(res, 405, { error: "Método não permitido." });
  const body = await readJson(req);
  const action = String(body.action || "");
  if (action === "logout") return send(res, 200, { ok: true }, { "Set-Cookie": clearSessionCookie() });
  const db = await readDb();
  if (action === "login") {
    const login = normalizeLogin(body.login);
    const user = db.users.find((u) => u.username.toLowerCase() === login || u.email.toLowerCase() === login);
    if (!user || !verifyPassword(user, String(body.password || ""))) return send(res, 401, { error: "Login ou senha incorretos." });
    return send(res, 200, { user: publicUser(user) }, { "Set-Cookie": sessionCookie(user) });
  }
  if (action === "register") {
    const username = normalizeUsername(body.username);
    const email = normalizeLogin(body.email);
    const password = String(body.password || "");
    if (!/^[a-zA-Z0-9_.-]{3,24}$/.test(username)) return send(res, 400, { error: "Use de 3 a 24 caracteres no usuário." });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return send(res, 400, { error: "Informe um e-mail válido." });
    if (password.length < 8) return send(res, 400, { error: "A senha precisa ter pelo menos 8 caracteres." });
    if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email)) {
      return send(res, 409, { error: "Usuário ou e-mail já cadastrado." });
    }
    const user = { id: crypto.randomUUID(), username, email, ...makePassword(password), createdAt: new Date().toISOString() };
    db.users.push(user);
    await writeDb(db);
    return send(res, 201, { user: publicUser(user) }, { "Set-Cookie": sessionCookie(user) });
  }
  return send(res, 400, { error: "Ação inválida." });
}
