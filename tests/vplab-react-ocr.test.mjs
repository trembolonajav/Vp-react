import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const app = fs.readFileSync("frontend/src/App.tsx", "utf8");
const scanner = fs.readFileSync("frontend/src/features/vplab/pages/IvScannerPage.tsx", "utf8");
const ocr = fs.readFileSync("frontend/src/features/vplab/services/paddleIvScanner.ts", "utf8");
const dockerfile = fs.readFileSync("frontend/Dockerfile", "utf8");
const nginx = fs.readFileSync("frontend/nginx.conf", "utf8");

test("Avaliar IV React é a rota oficial do VPLab", () => {
  assert.match(app, /path="vplab"/);
  assert.match(app, /<IvScannerPage/);
  assert.match(nginx, /location = \/vplab\//);
});

test("scanner usa PaddleOCR local nos três fluxos de entrada", () => {
  assert.match(ocr, /PaddleOCR\.create/);
  assert.match(ocr, /\/ocr-models/);
  assert.match(scanner, /type="file"/);
  assert.match(scanner, /onDrop=\{onDrop\}/);
  assert.match(scanner, /addEventListener\("paste"/);
  assert.doesNotMatch(scanner, /Tesseract/);
});

test("ferramentas pendentes permanecem isoladas na ponte legada", () => {
  assert.match(dockerfile, /dist\/vplab\/legacy/);
  assert.match(scanner, /to="\/vplab\/pokedex"/);
  assert.match(scanner, /\/vplab\/legacy\/\?tab=clas/);
});
