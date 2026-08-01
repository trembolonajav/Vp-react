import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const layout = fs.readFileSync("frontend/src/features/hub/HubLayout.tsx", "utf8");
const css = fs.readFileSync("frontend/src/styles/hub.css", "utf8");
const shared = fs.readFileSync("frontend/src/features/shared/PlatformHeader.tsx", "utf8");
const sharedCss = fs.readFileSync("frontend/src/features/shared/platform-header.css", "utf8");

test("header VPertsz usa as marcas oficiais e o CTA largo da live", () => {
  for (const asset of ["vpertsz-logo_quadrada.png", "vp-lab-logo_quadrada.png", "vp-store-logo_quadrada.png", "vp-bazaar-logo_quadrada.png", "botao-assistir-live.png"])
    assert.ok(fs.existsSync(`frontend/public/assets/platform/header/${asset}`), asset);
  assert.match(layout, /<PlatformHeader activeArea="hub"/);
  assert.match(shared, /header\/botao-assistir-live\.png/);
  assert.match(sharedCss, /\.platform-header__live\{display:block;width:216px/);
});

test("Comunidade pertence à subnavegação do hub", () => {
  assert.match(shared, /className="platform-subnav"/);
  assert.match(layout, /to="\/comunidade">Comunidade/);
  assert.equal((layout.match(/>Comunidade</g) ?? []).length, 2, "header e rodapé devem ser os únicos atalhos textuais");
});
