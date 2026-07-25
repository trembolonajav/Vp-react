import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const HUB = path.join(ROOT, "apps", "vpertz-hub", "public");
const STORE = path.join(ROOT, "apps", "vpertz-store", "public");
const LAB = path.join(ROOT, "apps", "vpertz-lab", "public");
const BAZAAR = path.join(ROOT, "apps", "vpertz-bazaar", "public");
const MODULES = path.join(ROOT, "node_modules");

/* Páginas da Store que passam a viver em /store/. Os demais arquivos da Store
   (config.js, dados.js, styles.css, assets/, PWA e o painel admin) ficam na
   raiz porque o hub, o Bazaar e o VPLab os referenciam por caminho absoluto. */
const STORE_PAGES = ["index.html", "jogos.html", "negociar.html", "intermedio.html", "contato.html", "app.js"];

const insideRoot = (target) => target.startsWith(ROOT + path.sep);
if (!insideRoot(DIST) || path.basename(DIST) !== "dist") {
  throw new Error("Diretório de saída inválido.");
}

await fs.rm(DIST, { recursive: true, force: true });
await fs.mkdir(DIST, { recursive: true });
await fs.cp(STORE, DIST, { recursive: true });

/* Move as páginas da Store para dist/store/, mantendo o compartilhado na raiz. */
const STORE_DIST = path.join(DIST, "store");
await fs.mkdir(STORE_DIST, { recursive: true });
for (const page of STORE_PAGES) {
  await fs.rename(path.join(DIST, page), path.join(STORE_DIST, page));
}

/* O hub assume a raiz: index.html do hub + hub.css/hub.js (e assets do hub,
   que se fundem na pasta /assets/ compartilhada). */
await fs.cp(HUB, DIST, { recursive: true });

await fs.cp(LAB, path.join(DIST, "vplab"), { recursive: true });
await fs.cp(BAZAAR, path.join(DIST, "bazaar"), { recursive: true });

const OCR_VENDOR = path.join(DIST, "vplab", "vendor");
await fs.mkdir(path.join(OCR_VENDOR, "tesseract-core"), { recursive: true });
await fs.mkdir(path.join(OCR_VENDOR, "lang-data"), { recursive: true });
await fs.copyFile(
  path.join(MODULES, "tesseract.js", "dist", "tesseract.min.js"),
  path.join(OCR_VENDOR, "tesseract.min.js")
);
await fs.copyFile(
  path.join(MODULES, "tesseract.js", "dist", "worker.min.js"),
  path.join(OCR_VENDOR, "worker.min.js")
);

for (const coreFile of [
  "tesseract-core.wasm.js",
  "tesseract-core-simd.wasm.js",
  "tesseract-core-lstm.wasm.js",
  "tesseract-core-simd-lstm.wasm.js"
]) {
  await fs.copyFile(
    path.join(MODULES, "tesseract.js-core", coreFile),
    path.join(OCR_VENDOR, "tesseract-core", coreFile)
  );
}

for (const language of ["por", "eng"]) {
  await fs.copyFile(
    path.join(MODULES, "@tesseract.js-data", language, "4.0.0_best_int", `${language}.traineddata.gz`),
    path.join(OCR_VENDOR, "lang-data", `${language}.traineddata.gz`)
  );
}

console.log("Build concluído:");
console.log("  Hub      -> dist/ (página inicial VPertsz)");
console.log("  Store    -> dist/store/");
console.log("  VPLab    -> dist/vplab/ (inclui a aba PokeFipe)");
console.log("  Bazaar   -> dist/bazaar/");
console.log("  OCR local -> dist/vplab/vendor/");
