import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const app = fs.readFileSync("frontend/src/App.tsx", "utf8");
const legacyMarketplace = fs.readFileSync("apps/vpertz-bazaar/public/bazaar.js", "utf8");
const nginx = fs.readFileSync("frontend/nginx.conf", "utf8");

test("detalhe do anúncio usa a página React antes do fallback legado", () => {
  assert.match(app, /path="bazaar" element=\{<BazaarLayout \/>}/);
  assert.match(app, /path="anuncio\/:id" element=\{<AnuncioPage \/>}/);
  assert.match(app, /path="bazaar\/\*" element=\{<BazaarRedirect \/>}/);

  const detailRoute = app.indexOf('path="anuncio/:id"');
  const legacyFallback = app.indexOf('path="bazaar/*"');
  assert.ok(detailRoute >= 0 && detailRoute < legacyFallback);
});

test("marketplace ativo encaminha o detalhe para a rota React limpa", () => {
  assert.match(
    legacyMarketplace,
    /const linkAnuncio = \(id\) => `\/bazaar\/anuncio\/\$\{encodeURIComponent\(id\)\}`/,
  );
  assert.doesNotMatch(legacyMarketplace, /const linkAnuncio = \(id\) => `anuncio\.html/);
});

test("Marketplace React é a rota index e as páginas pendentes são pontes explícitas", () => {
  assert.match(app, /<Route index element=\{<MarketplacePage \/>\} \/>/);
  assert.match(nginx, /location = \/bazaar\/\s*\{\s*try_files \/index\.html =404;/);

  const page = fs.readFileSync("frontend/src/features/bazaar/pages/MarketplacePage.tsx", "utf8");
  const header = fs.readFileSync("frontend/src/features/bazaar/components/Header.tsx", "utf8");

  assert.match(page, /href="\/bazaar\/anunciar\.html"/);
  assert.match(page, /href="\/bazaar\/como-funciona\.html"/);
  assert.match(header, /href="\/bazaar\/anunciar\.html"/);
});

test("contadores e grade do Marketplace usam a API Spring, não config.bazaar.anuncios", () => {
  const page = fs.readFileSync("frontend/src/features/bazaar/pages/MarketplacePage.tsx", "utf8");
  const stats = fs.readFileSync("frontend/src/hooks/useMarketplaceStats.ts", "utf8");
  const listings = fs.readFileSync("frontend/src/services/listingsService.ts", "utf8");

  assert.doesNotMatch(page, /config\?\.bazaar\.anuncios/);
  assert.match(stats, /listListings\(EMPTY_FILTERS/);
  assert.match(stats, /intencao: "venda"/);
  assert.match(stats, /intencao: "compra"/);
  assert.match(listings, /\/api\/v1\/listings\?/);
});
