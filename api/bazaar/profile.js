import { send, readJson, sameOrigin, query } from "../_lib/http.mjs";
import { readDb, writeDb, currentUser, publicUser } from "../_lib/bazaar-account.mjs";

const clean = (value, max) => String(value || "").trim().slice(0, max);

export default async function handler(req, res) {
  const db = await readDb();
  if (req.method === "GET") {
    const signed = await currentUser(req);
    const username = clean(query(req).get("user"), 24).toLowerCase();
    const user = username ? db.users.find((u) => u.username.toLowerCase() === username) : signed;
    if (!user) return send(res, 404, { error: "Perfil não encontrado." });
    const profile = publicUser(user);
    return send(res, 200, { profile: { ...profile, bio: user.bio || "", contact: user.contact || "", preferredContact: user.preferredContact || "Chat do Bazaar", avatar: user.avatar || "initial", createdAt: user.createdAt } });
  }
  const user = await currentUser(req);
  if (!user) return send(res, 401, { error: "Entre na sua conta." });
  if (req.method !== "POST" || !sameOrigin(req)) return send(res, 405, { error: "Método não permitido." });
  const body = await readJson(req);
  const stored = db.users.find((item) => item.id === user.id);
  stored.bio = clean(body.bio, 240);
  stored.contact = clean(body.contact, 80);
  stored.preferredContact = ["Chat do Bazaar", "Discord", "WhatsApp"].includes(body.preferredContact) ? body.preferredContact : "Chat do Bazaar";
  stored.avatar = clean(body.avatar, 40) || "initial";
  await writeDb(db);
  return send(res, 200, { profile: publicUser(stored) });
}
