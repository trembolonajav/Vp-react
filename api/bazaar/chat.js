import crypto from "node:crypto";
import { send, readJson, sameOrigin, query } from "../_lib/http.mjs";
import { readDb, writeDb, currentUser, publicUser } from "../_lib/bazaar-account.mjs";

export default async function handler(req, res) {
  const user = await currentUser(req);
  if (!user) return send(res, 401, { error: "Entre na sua conta para negociar." });
  const db = await readDb();
  if (req.method === "GET") {
    const id = query(req).get("id");
    if (!id) {
      const conversations = db.conversations
        .filter((c) => c.participants.includes(user.id))
        .map((conversation) => {
          const messages = db.messages.filter((m) => m.conversationId === conversation.id);
          const lastMessage = messages.at(-1) || null;
          const unread = messages.filter((m) => m.authorId !== user.id && !(m.readBy || []).includes(user.id)).length;
          return { ...conversation, lastMessage, unread };
        })
        .sort((a, b) => new Date(b.lastMessage?.createdAt || b.createdAt) - new Date(a.lastMessage?.createdAt || a.createdAt));
      return send(res, 200, { conversations, unread: conversations.reduce((sum, c) => sum + c.unread, 0), user: publicUser(user) });
    }
    const conversation = db.conversations.find((c) => c.id === id && c.participants.includes(user.id));
    if (!conversation) return send(res, 404, { error: "Conversa não encontrada." });
    return send(res, 200, {
      conversation,
      messages: db.messages.filter((m) => m.conversationId === id),
      user: publicUser(user)
    });
  }
  if (req.method !== "POST" || !sameOrigin(req)) return send(res, 405, { error: "Método não permitido." });
  const body = await readJson(req);
  if (body.action === "start") {
    const sellerName = String(body.seller || "").trim();
    const seller = db.users.find((u) => u.username.toLowerCase() === sellerName.toLowerCase());
    if (!seller) return send(res, 409, { error: "O vendedor ainda não ativou uma conta no Bazaar." });
    if (seller.id === user.id) return send(res, 400, { error: "Este anúncio pertence à sua conta." });
    let conversation = db.conversations.find((c) => c.adId === String(body.adId) && c.participants.includes(user.id) && c.participants.includes(seller.id));
    if (!conversation) {
      conversation = {
        id: crypto.randomUUID(), adId: String(body.adId), title: String(body.title || "Anúncio").slice(0, 100),
        buyer: user.username, seller: seller.username, participants: [user.id, seller.id],
        image: String(body.image || "").slice(0, 500), price: Number(body.price) || 0,
        currency: ["diamante", "pix"].includes(body.currency) ? body.currency : "diamante",
        details: String(body.details || "").slice(0, 160), status: "aberta", createdAt: new Date().toISOString()
      };
      db.conversations.push(conversation);
      await writeDb(db);
    } else if (!conversation.image && body.image) {
      conversation.image = String(body.image).slice(0, 500);
      conversation.price = Number(body.price) || 0;
      conversation.currency = ["diamante", "pix"].includes(body.currency) ? body.currency : "diamante";
      conversation.details = String(body.details || "").slice(0, 160);
      await writeDb(db);
    }
    return send(res, 200, { conversation });
  }
  if (body.action === "message") {
    const conversation = db.conversations.find((c) => c.id === String(body.id) && c.participants.includes(user.id));
    const text = String(body.text || "").trim().slice(0, 1000);
    if (!conversation || !text) return send(res, 400, { error: "Mensagem inválida." });
    db.messages.push({ id: crypto.randomUUID(), conversationId: conversation.id, authorId: user.id, author: user.username, text, createdAt: new Date().toISOString(), readBy: [user.id] });
    await writeDb(db);
    return send(res, 201, { ok: true });
  }
  if (body.action === "read") {
    const conversation = db.conversations.find((c) => c.id === String(body.id) && c.participants.includes(user.id));
    if (!conversation) return send(res, 404, { error: "Conversa não encontrada." });
    db.messages.filter((m) => m.conversationId === conversation.id).forEach((m) => {
      m.readBy = Array.from(new Set([...(m.readBy || [m.authorId]), user.id]));
    });
    await writeDb(db);
    return send(res, 200, { ok: true });
  }
  if (body.action === "status") {
    const conversation = db.conversations.find((c) => c.id === String(body.id) && c.participants.includes(user.id));
    const allowed = new Set(["aberta", "intermedio-solicitado", "concluida", "encerrada"]);
    if (!conversation || !allowed.has(body.status)) return send(res, 400, { error: "Estado inválido." });
    conversation.status = body.status;
    conversation.updatedAt = new Date().toISOString();
    await writeDb(db);
    return send(res, 200, { conversation });
  }
  return send(res, 400, { error: "Ação inválida." });
}
