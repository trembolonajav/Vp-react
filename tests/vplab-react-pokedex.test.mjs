import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync("frontend/src/App.tsx","utf8");
const page = fs.readFileSync("frontend/src/features/vplab/pages/PokedexPage.tsx","utf8");
const scanner = fs.readFileSync("frontend/src/features/vplab/pages/IvScannerPage.tsx","utf8");
const nginx = fs.readFileSync("frontend/nginx.conf","utf8");
const header = fs.readFileSync("frontend/src/features/vplab/components/VplabHeader.tsx","utf8");
const dex = JSON.parse(fs.readFileSync("frontend/public/vplab-data/vplab-dex.json","utf8"));

test("Pokédex React é servida pela rota oficial", () => {
  assert.match(app, /path="vplab" element=\{<VplabLayout/);
  assert.match(app, /path="pokedex"/);
  assert.match(nginx, /location = \/vplab\/pokedex/);
  assert.match(header, /path: "\/vplab\/pokedex"/);
  assert.match(scanner, /searchParams\.get\("p"\)/);
  assert.doesNotMatch(scanner, /legacy\/\?tab=pokedex/);
});

test("Pokédex usa o catálogo integral e oferece a paridade principal", () => {
  assert.equal(dex.length, 251);
  for (const feature of ["Buscar espécie","Raridade","Stats base","Fraquezas e resistências","Golpes","Linha evolutiva","Drops"]) {
    assert.ok(page.includes(feature), `recurso ausente: ${feature}`);
  }
  assert.match(page, /loadPokemonCatalog/);
});
