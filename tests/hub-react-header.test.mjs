import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const layout = fs.readFileSync("frontend/src/features/hub/HubLayout.tsx", "utf8");
const css = fs.readFileSync("frontend/src/styles/hub.css", "utf8");

test("header VPertsz usa as marcas oficiais e o CTA largo da live", () => {
  for (const asset of ["vpertsz.png", "vplab.png", "vp-store.png", "vp-bazaar.png", "assistir-live.png"])
    assert.ok(fs.existsSync(`frontend/public/assets/hub/header/${asset}`), asset);
  assert.match(layout, /className="hub-family-links"/);
  assert.match(layout, /header\/assistir-live\.png/);
  assert.match(css, /\.hub-header \.header-live-asset\{width:216px/);
});

test("Comunidade pertence à subnavegação do hub", () => {
  assert.match(layout, /className="hub-subnav"/);
  assert.match(layout, /to="\/comunidade">Comunidade/);
  assert.equal((layout.match(/>Comunidade</g) ?? []).length, 2, "header e rodapé devem ser os únicos atalhos textuais");
});
