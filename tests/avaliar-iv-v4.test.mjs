import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const index = fs.readFileSync(
  path.join(root, "apps", "vpertz-lab", "public", "index.html"),
  "utf8",
);
const avaliar = fs.readFileSync(
  path.join(root, "apps", "vpertz-lab", "public", "avaliar-iv-v4.html"),
  "utf8",
);
const devServer = fs.readFileSync(path.join(root, "dev-server.mjs"), "utf8");
const vercel = fs.readFileSync(path.join(root, "vercel.json"), "utf8");

test("a aba Avaliar IV usa integralmente o redesign v4", () => {
  assert.match(index, /data-prototype="avaliar"/);
  assert.match(index, /src="avaliar-iv-v4\.html\?embed=1"/);
  assert.match(avaliar, /Esse Pokémon é bom — e é melhor que o outro\?/);
  assert.match(avaliar, /compara dois Pokémon stat por stat/);
  assert.match(avaliar, /Card copiado — use Ctrl \+ V no Discord\./);
});

test("o redesign v4 integra-se ao shell do VPLab sem caminhos absolutos da origem", () => {
  assert.match(avaliar, /class="prototype-shell"/);
  assert.match(avaliar, /prototype-embed\.js" data-page="avaliar"/);
  assert.doesNotMatch(avaliar, /apps\/vpertz-lab\/public\/assets/);
});

test("o servidor local e a Vercel permitem o runtime React do protótipo v4", () => {
  assert.match(devServer, /"avaliar-iv-v4\.html"/);
  assert.match(vercel, /breeding-v2\|avaliar-iv-v4/);
});

test("avaliador v4 conecta arquivo, colagem e arrastar ao OCR real", () => {
  assert.match(avaliar, /vendor\/tesseract\.min\.js/);
  assert.match(avaliar, /src="iv-scan\.js"/);
  assert.match(avaliar, /window\.IvScan\.readCard/);
  assert.match(avaliar, /onDrop="\{\{ s\.onDrop \}\}"/);
  assert.doesNotMatch(avaliar, /leitura autom.+roda no VPLab publicado/i);
});
