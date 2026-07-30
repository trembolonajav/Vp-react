import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const app = fs.readFileSync("frontend/src/App.tsx", "utf8");
const legacyMarketplace = fs.readFileSync("apps/vpertz-bazaar/public/bazaar.js", "utf8");

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
