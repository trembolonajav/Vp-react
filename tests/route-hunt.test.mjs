import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const LAB = path.join(ROOT, "apps", "vpertz-lab", "public");
const APP = fs.readFileSync(path.join(LAB, "app.js"), "utf8");
const TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground",
  "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"
];

test("rota inclui evoluções e filtra faixas anteriores ao nível atual", () => {
  assert.match(APP, /const DEX = ALL_DEX\.filter\(\(p\) => !p\.boss\)/);
  assert.match(APP, /filter\(\(level\) => level >= trainerLevel\)/);
  for (const id of [133, 134, 135, 136, 196, 197]) {
    assert.match(fs.readFileSync(path.join(LAB, "data.js"), "utf8"), new RegExp(`"dexNo":${id},`));
  }
});

test("os 18 ícones de tipo e os três painéis foram separados", () => {
  for (const type of TYPES) {
    const file = path.join(LAB, "assets", "route", "types", `${type}.png`);
    assert.ok(fs.existsSync(file), `falta ${type}.png`);
    assert.ok(fs.statSync(file).size > 1_000, `${type}.png parece vazio`);
  }
  for (const panel of ["hunt-card-frame.png", "positive-panel.png", "warning-panel.png"]) {
    assert.ok(fs.existsSync(path.join(LAB, "assets", "route", panel)), `falta ${panel}`);
  }
});
