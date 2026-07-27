import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { cookies } from "./http.mjs";

const FILE = path.join(process.cwd(), ".data", "bazaar-accounts.json");
const COOKIE = "vp_bazaar_session";
const secret = () => process.env.BAZAAR_SESSION_SECRET || process.env.SESSION_SECRET || "vpertz-local-development-session";
const clean = (v, max = 80) => String(v || "").trim().slice(0, max);
const hash = (password, salt) => crypto.scryptSync(password, salt, 64).toString("hex");

export async function readDb() {
  try { return JSON.parse(await fs.readFile(FILE, "utf8")); }
  catch {
    const salt = crypto.randomBytes(16).toString("hex");
    const db = {
      users: [{
        id: "user-moonlight", username: "moonlight", email: "demo@vpertsz.com.br",
        salt, passwordHash: hash("Bazaar2026!", salt), createdAt: new Date().toISOString()
      }],
      conversations: [], messages: []
    };
    await writeDb(db);
    return db;
  }
}

export async function writeDb(db) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(db, null, 2), "utf8");
}

export function publicUser(user) {
  return user ? { id: user.id, username: user.username, nick: user.username, email: user.email, avatar: user.avatar || "initial" } : null;
}

export function makePassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return { salt, passwordHash: hash(password, salt) };
}

export function verifyPassword(user, password) {
  const expected = Buffer.from(user.passwordHash, "hex");
  const actual = Buffer.from(hash(password, user.salt), "hex");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function sign(payload) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function sessionCookie(user) {
  const payload = Buffer.from(JSON.stringify({ id: user.id, exp: Date.now() + 7 * 864e5 })).toString("base64url");
  return `${COOKIE}=${payload}.${sign(payload)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${process.env.VERCEL ? "; Secure" : ""}`;
}

export function clearSessionCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.VERCEL ? "; Secure" : ""}`;
}

export async function currentUser(req) {
  const token = cookies(req)[COOKIE];
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || sign(payload) !== signature) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (data.exp < Date.now()) return null;
    const db = await readDb();
    return db.users.find((u) => u.id === data.id) || null;
  } catch { return null; }
}

export const normalizeLogin = (v) => clean(v).toLowerCase();
export const normalizeUsername = (v) => clean(v, 24).replace(/\s+/g, "");
