import sharp from "sharp";
import { getConfig } from "../_lib/store.mjs";
const xml = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&apos;" }[c]));
export default async function handler(req, res) {
  if (req.method !== "GET") { res.statusCode = 405; return res.end(); }
  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const id = req.query?.id || requestUrl.searchParams.get("id");
  const ad = ((await getConfig()).bazaar?.anuncios || []).find((item) => String(item.id) === String(id));
  if (!ad) { res.statusCode = 404; return res.end(); }
  const protocol = req.headers["x-forwarded-proto"] || (String(req.headers.host).startsWith("127.0.0.1") ? "http" : "https");
  const origin = `${protocol}://${req.headers["x-forwarded-host"] || req.headers.host}`;
  const image = ad.imagem ? (String(ad.imagem).startsWith("http") ? ad.imagem : `${origin}${ad.imagem}`) : "";
  const quality = [ad.qualidadeRotulo, ad.qualidade].filter(Boolean).join(" ");
  const price = `${ad.moeda === "pix" ? "R$" : "◆"} ${Number(ad.preco || 0).toLocaleString("pt-BR")}`;
  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="r" cx="100%" cy="50%" r="90%"><stop stop-color="#591916"/><stop offset="1" stop-color="#0b0706"/></radialGradient></defs><rect width="1200" height="630" rx="24" fill="url(#r)"/><rect x="16" y="16" width="1168" height="598" rx="18" fill="none" stroke="#8a5e27" stroke-width="2"/><text x="64" y="78" fill="#d2a84e" font-size="26" font-family="serif" font-weight="700">VP BAZAAR · À VENDA</text><text x="64" y="180" fill="#fff1e5" font-size="58" font-family="serif" font-weight="700">${xml(ad.titulo)}</text><rect x="64" y="230" width="230" height="120" rx="14" fill="#110b09" stroke="#79541f"/><text x="84" y="267" fill="#96847a" font-size="18">QUALIDADE</text><text x="84" y="320" fill="#e8bf64" font-size="30" font-weight="700">${xml(quality || "—")}</text><rect x="310" y="230" width="190" height="120" rx="14" fill="#110b09" stroke="#28613d"/><text x="330" y="267" fill="#96847a" font-size="18">IV TOTAL</text><text x="330" y="320" fill="#79d99c" font-size="34" font-weight="700">${xml(ad.ivTotal || "—")}/192</text><rect x="516" y="230" width="170" height="120" rx="14" fill="#110b09" stroke="#79541f"/><text x="536" y="267" fill="#96847a" font-size="18">NÍVEL</text><text x="536" y="320" fill="#fff1e5" font-size="40" font-weight="700">${xml(ad.nivel || "—")}</text><text x="64" y="530" fill="#fff1e5" font-size="54" font-family="serif" font-weight="700">${xml(price)}</text><text x="64" y="575" fill="#d2a84e" font-size="22">Vendedor ${xml(ad.vendedor || "comunidade VP")}</text></svg>`;
  let pipeline = sharp(Buffer.from(svg));
  if (image) try { const response = await fetch(image); if (response.ok) { const sprite = await sharp(Buffer.from(await response.arrayBuffer())).resize(410,410,{fit:"contain",kernel:"nearest"}).png().toBuffer(); pipeline = pipeline.composite([{input:sprite,left:750,top:115}]); } } catch {}
  const png = await pipeline.png().toBuffer(); res.setHeader("Content-Type","image/png"); res.setHeader("Cache-Control","public, max-age=300, s-maxage=3600"); res.end(png);
}
