import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
await import("../apps/vpertz-lab/public/pokefipe-core.js");
const { calculateFipe, POKEMON } = globalThis.PokeFipe;
const page = fs.readFileSync("apps/vpertz-lab/public/pokefipe-v2.html", "utf8");

test("PokeFipe oferece as 251 espécies da Poképedia", () => {
  assert.equal(POKEMON.length, 251);
  assert.equal(POKEMON[0].name, "Bulbasaur");
  assert.equal(POKEMON.at(-1).name, "Celebi");
});

test("PokeFipe 2.0 reproduz a base provisória e as margens da planilha", () => {
  const value = calculateFipe({ iv: 110, multiplier: 1.8, level: 1 });
  assert.equal(value.valid, true);
  assert.equal(value.inRange, true);
  assert.equal(value.score, 198);
  assert.equal(value.diamondsMin, 28);
  assert.equal(value.diamondsMax, 37);
  assert.equal(value.pokemonMin, 3.4);
  assert.equal(value.pokemonMax, 4.4);
  assert.equal(value.levelValue, 0);
  assert.equal(value.fair, 4);
});

test("PokeFipe aplica bônus e valor progressivo de levels", () => {
  const value = calculateFipe({ iv: 125, multiplier: 1.8, level: 100 });
  assert.equal(value.score, 225);
  assert.equal(value.band.bonus, 0.9);
  assert.equal(value.levelValue, 2.97);
  assert.deepEqual([value.diamondsMin, value.diamondsMax], [56, 72]);
});

test("PokeFipe cobre resultados baixos com penalidade explícita", () => {
  const value = calculateFipe({ iv: 100, multiplier: 1, level: 1 });
  assert.equal(value.valid, true);
  assert.equal(value.inRange, true);
  assert.equal(value.band.bonus, -2.5);
});

test("PokeFipe arredonda o resultante como a célula formatada do Excel", () => {
  const value = calculateFipe({ iv: 115, multiplier: 1.805, level: 1 });
  assert.equal(value.rawScore, 207.575);
  assert.equal(value.score, 208);
  assert.deepEqual([value.diamondsMin, value.diamondsMax], [31, 39]);
});

test("PokeFipe rejeita entradas inválidas", () => {
  assert.equal(calculateFipe({ iv: 0, multiplier: 1.8, level: 1 }).valid, false);
  assert.equal(calculateFipe({ iv: 110, multiplier: "", level: 1 }).valid, false);
});

test("PokeFipe usa o diamante oficial e mantém somente os blocos públicos pedidos", () => {
  assert.match(page, /\/assets\/diamante-pokeidle-oficial\.png/);
  assert.doesNotMatch(page, /Comprar diamonds/);
  assert.doesNotMatch(page, />Segmento</);
  assert.doesNotMatch(page, /Nota da base desta espécie/);
  assert.doesNotMatch(page, /Curva do resultado/);
  assert.match(page, /Tabela por espécie e nível de confiança/);
});
