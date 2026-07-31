import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "apps", "vpertz-lab", "public", "breeding-v2.html"),
  "utf8",
);

test("breeding usa os limites e custos auditados", () => {
  assert.match(source, /maxDiff:\s*0\.15/);
  assert.match(source, /normalCap:\s*2\.6/);
  assert.match(source, /ivChance:\s*0\.05/);
  assert.match(source, /gold:\s*2000000/);
  assert.match(source, /stones:\s*20,\s*doubleStones:\s*40/);
  assert.match(source, /normalPheromones:\s*9/);
});

test("breeding impede cruzamento entre Normal e Shiny", () => {
  assert.match(source, /st\.formA\s*===\s*st\.formB/);
  assert.match(source, /Normal e Shiny não podem formar um par/);
});

test("breeding não inventa custo por abates", () => {
  assert.doesNotMatch(source, /RULES\.kills|kills:\s*\d|3\.000 abates|3000 abates/);
});

test("Dobrar Stones respeita chance de 5% e teto total de 192", () => {
  assert.match(source, /status aleatório abaixo de 32/);
  assert.match(source, /inheritedIv\s*>=\s*192/);
  assert.match(source, /RULES\.ivChance/);
});

test("projeções usam as distribuições de qualidade da referência", () => {
  assert.match(source, /\[0\.005,\s*50\]/);
  assert.match(source, /\[0\.010,\s*35\]/);
  assert.match(source, /\[0\.020,\s*12\]/);
  assert.match(source, /\[0\.040,\s*3\]/);
  assert.match(source, /\[0\.15,\s*50\]/);
  assert.match(source, /\[0\.20,\s*30\]/);
  assert.match(source, /\[0\.25,\s*15\]/);
  assert.match(source, /\[0\.30,\s*5\]/);
});
