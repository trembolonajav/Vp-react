import { getConfig } from "../_lib/store.mjs";
const html = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
export default async function handler(req, res) {
  if (req.method !== "GET") { res.statusCode = 405; return res.end(); }
  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const id = req.query?.id || requestUrl.searchParams.get("id");
  const ad = ((await getConfig()).bazaar?.anuncios || []).find((item) => String(item.id) === String(id));
  if (!ad) { res.statusCode = 404; return res.end("Anúncio não encontrado."); }
  const protocol = req.headers["x-forwarded-proto"] || (String(req.headers.host).startsWith("127.0.0.1") ? "http" : "https");
  const origin = `${protocol}://${req.headers["x-forwarded-host"] || req.headers.host}`;
  const target = `${origin}/bazaar/anuncio.html?id=${encodeURIComponent(ad.id)}`;
  const quality = [ad.qualidadeRotulo, ad.qualidade].filter(Boolean).join(" ");
  const description = [ad.nivel ? `Lv. ${ad.nivel}` : "", quality, ad.ivTotal ? `IV ${ad.ivTotal}/192` : "", ad.preco ? `${ad.moeda === "pix" ? "R$" : "◆"} ${ad.preco}` : ""].filter(Boolean).join(" · ");
  const image = `${origin}/api/bazaar/og?id=${encodeURIComponent(ad.id)}`;
  res.setHeader("Content-Type", "text/html; charset=utf-8"); res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
  res.end(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${html(ad.titulo)} — VP Bazaar</title><meta name="description" content="${html(description)}"><meta property="og:type" content="website"><meta property="og:site_name" content="VP Bazaar"><meta property="og:title" content="${html(ad.titulo)}"><meta property="og:description" content="${html(description)}"><meta property="og:url" content="${html(target)}"><meta property="og:image" content="${html(image)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${html(image)}"><meta http-equiv="refresh" content="0;url=${html(target)}"></head><body><a href="${html(target)}">Abrir anúncio</a></body></html>`);
}
