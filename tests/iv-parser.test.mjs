import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../apps/vpertz-lab/public/iv-scan.js", import.meta.url), "utf8");
const context = vm.createContext({ window: {} });
vm.runInContext(source, context);
const { parseQuality, parseIv, parseWholeCard } = context.window.IvScan;

for (const [input, expected] of [
  ["x1.70", "1.7"], ["Lendária x1,78", "1.78"],
  ["Lendaria-170", "1.7"], ["1,245", "1.245"],
  ["1245", "1.245"], ["095", "0.95"]
]) assert.equal(parseQuality(input), expected, `quality: ${input}`);

for (const [input, expected] of [
  ["IV 140/192", "140"], ["1V 139 / 192", "139"],
  ["lV 40/192", "40"], ["140 192", "140"]
]) assert.equal(parseIv(input).current, expected, `IV: ${input}`);

for (const input of ["192", "Nv 21", "Power 192", "IV 250/192"])
  assert.equal(parseIv(input).current, "", `IV must reject: ${input}`);

const whole = parseWholeCard("Gyarados\nNv 1 Qualidade Lendária x1.70 IV 140/192\nHP 3 Atk 3 Def 2\nSpA 2 SpD 2 Vel 2\nPoder 24");
assert.deepEqual(JSON.parse(JSON.stringify(whole)), {
  level: "1", quality: "1.7", ivTotal: "140", ivMaximum: "192",
  power: "24", stats: ["3", "3", "2", "2", "2", "2"]
});

console.log("IV parser: 15 casos aprovados");
