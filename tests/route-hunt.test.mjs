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

test("rota v3 preserva o catálogo restrito a 194 Pokémon", () => {
  assert.match(APP, /const DEX = ALL_DEX\.filter\(\(p\) => !p\.boss\)/);
  assert.match(APP, /const ROUTE_DEX_NUMBERS = new Set\(\[/);
  assert.match(APP, /const ROUTE_DEX = ALL_DEX\.filter\(\(p\) => ROUTE_DEX_NUMBERS\.has\(p\.dexNo\) && !p\.boss\)/);

  const whitelistSource = APP.match(/const ROUTE_DEX_NUMBERS = new Set\(\[([\s\S]*?)\]\);/)?.[1] || "";
  const whitelist = [...whitelistSource.matchAll(/\d+/g)].map(([value]) => Number(value));
  assert.equal(whitelist.length, 194);
  assert.equal(new Set(whitelist).size, 194);

  for (const id of [133, 134, 135, 136, 196, 197]) {
    assert.match(fs.readFileSync(path.join(LAB, "data.js"), "utf8"), new RegExp(`"dexNo":${id},`));
  }
});

test("rota v3 usa os ícones e alertas originais do redesign", () => {
  for (const type of TYPES) {
    const file = path.join(LAB, "assets", "route", "types-v2", `${type}.png`);
    assert.ok(fs.existsSync(file), `falta ${type}.png`);
    assert.ok(fs.statSync(file).size > 1_000, `${type}.png parece vazio`);
  }

  for (const alert of [
    "alvo-ideal.png", "alvo-evitar.png", "dano-super.png",
    "hunt-segura.png", "hunt-lenta.png", "recebe-muito.png"
  ]) {
    assert.ok(fs.existsSync(path.join(LAB, "assets", "route", "alerts", alert)), `falta ${alert}`);
  }

  assert.match(APP, /future=groups\.filter\(\(g\)=>g\.lv>=current\)/);
  assert.match(APP, /innerHTML=future\.map/);
});

test("rota destaca vantagem ofensiva e hunts seguras, deixando neutras recolhidas", () => {
  assert.match(APP, /const offensive=best\.m>=2\.5/);
  assert.match(APP, /const safeHunt=worst\.m===0&&best\.m>0/);
  assert.match(APP, /const featured=offensive\|\|safeHunt/);
  assert.match(APP, /Number\(b\.offensive\)-Number\(a\.offensive\)/);
  assert.match(APP, /const shown=open\?\[\.\.\.keep,\.\.\.drop\]:keep/);
  assert.match(APP, /Mostrar descartadas \(\$\{drop\.length\}\)/);
  assert.match(APP, /\["Alvo neutro","dano-neutro","#b5a196",35,false/);
});

test("rota inclui os 47 mobs adicionais no mesmo fluxo das hunts", () => {
  const specsSource = APP.match(/const OUTLAND_SPECS = \[([\s\S]*?)\n\];/)?.[1] || "";
  const specs = [...specsSource.matchAll(/\["([^"]+)","([^"]+)"\]/g)].map((match) => ({
    name:match[1],
    slug:match[2]
  }));
  const dataSource = fs.readFileSync(path.join(LAB, "data.js"), "utf8");

  assert.equal(specs.length, 47);
  for (const mob of specs) {
    assert.match(dataSource, new RegExp(`"slug":"${mob.slug}"`), `falta a espécie-base de ${mob.name}`);
  }

  assert.match(APP, /const HUNTABLE = \[\.\.\.ROUTE_DEX, \.\.\.OUTLAND\]/);
  assert.match(APP, /HUNTABLE\.length\} hunts no catálogo/);
  assert.doesNotMatch(APP, /route-v3-summary-note[^;]+Outland/i);
});
