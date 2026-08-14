import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync("frontend/src/App.tsx", "utf8");
const layout = fs.readFileSync("frontend/src/features/vplab/VplabLayout.tsx", "utf8");
const header = fs.readFileSync("frontend/src/features/vplab/components/VplabHeader.tsx", "utf8");
const shared = fs.readFileSync("frontend/src/features/shared/PlatformHeader.tsx", "utf8");

test("cabeçalho redesenhado é compartilhado por todas as rotas VPLab", () => {
  assert.match(app, /path="vplab" element=\{<VplabLayout/);
  assert.match(layout, /<VplabHeader/);
  assert.match(layout, /<Outlet/);
  for (const group of ["Consultar", "Avaliar", "Planejar"]) assert.ok(header.includes(group), group);
  for (const route of ["pokedex", "rota", "breeding", "clas", "profissoes"])
    assert.ok(header.includes(`/vplab/${route}`), route);
  assert.match(header, /SHOW_POKEFIPE = false/);
  assert.match(header, /tool\.path !== "\/vplab\/pokefipe"/);
});

test("cabeçalho preserva busca, autenticação e navegação responsiva em React", () => {
  assert.match(header, /loadPokemonCatalog/);
  assert.match(shared, /platform-header__areas/);
  assert.match(layout, /activeArea="vplab"/);
  assert.match(header, /navigate\(`/);
  assert.doesNotMatch(header, /innerHTML|querySelector|addEventListener/);
});
