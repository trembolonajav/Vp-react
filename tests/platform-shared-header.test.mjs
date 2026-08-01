import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const files = [
  ["hub", "frontend/src/features/hub/HubLayout.tsx"],
  ["store", "frontend/src/features/store/StoreLayout.tsx"],
  ["bazaar", "frontend/src/features/bazaar/components/Header.tsx"],
  ["vplab", "frontend/src/features/vplab/VplabLayout.tsx"],
];
const component = fs.readFileSync("frontend/src/features/shared/PlatformHeader.tsx", "utf8");
const css = fs.readFileSync("frontend/src/features/shared/platform-header.css", "utf8");

test("todas as áreas usam o mesmo PlatformHeader", () => {
  for (const [area, file] of files) {
    const source = fs.readFileSync(file, "utf8");
    assert.match(source, new RegExp(`PlatformHeader activeArea="${area}"`), area);
  }
});

test("header padrão usa somente marcas horizontais e compartilha o hover", () => {
  for (const asset of ["logo-vpertsz-horizontal.webp", "logo-vp-store-horizontal.webp", "logo-vp-bazaar-horizontal-oficial.webp", "tool-vplab.webp"])
    assert.ok(component.includes(asset), asset);
  assert.match(css, /\.platform-header__areas a:hover/);
  assert.match(css, /transform:translateY\(-2px\)/);
  assert.match(css, /filter:drop-shadow/);
});
