import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app=fs.readFileSync("frontend/src/App.tsx","utf8");
const page=fs.readFileSync("frontend/src/features/vplab/pages/PokeFipePage.tsx","utf8");
const engine=fs.readFileSync("frontend/src/features/vplab/services/pokeFipe.ts","utf8");
const scanner=fs.readFileSync("frontend/src/features/vplab/pages/IvScannerPage.tsx","utf8");
const nginx=fs.readFileSync("frontend/nginx.conf","utf8");

test("PokeFipe React é a rota oficial",()=>{
  assert.match(app,/path="vplab\/pokefipe"/);
  assert.match(nginx,/location = \/vplab\/pokefipe/);
  assert.match(scanner,/to="\/vplab\/pokefipe"/);
  assert.doesNotMatch(scanner,/legacy\/\?tab=fipe/);
});
test("motor React preserva o modelo PokeFipe 2.0",()=>{
  for(const token of ["DIAMOND_BRL = 0.12","LEVEL_CUT = 400","QUICK_FACTOR = 0.85","LIST_FACTOR = 1.10","28/07/2026"]) assert.ok(engine.includes(token),token);
  for(const label of ["Venda rápida","Valor justo","Equivalente em diamonds","Valor dos níveis","Referência, não oferta"]) assert.ok(page.includes(label),label);
  assert.match(page,/params\.get\("iv"\)/);
  assert.match(scanner,/Ver estimativa na PokeFipe/);
});
