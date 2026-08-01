import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const nginx = fs.readFileSync("frontend/nginx.conf", "utf8");
const dockerfile = fs.readFileSync("frontend/Dockerfile", "utf8");

test("URLs HTML históricas convergem para rotas React pelo Nginx", () => {
  for (const [oldPath, cleanPath] of [
    ["/bazaar/index.html", "/bazaar/"],
    ["/bazaar/anunciar.html", "/bazaar/anunciar"],
    ["/bazaar/chat.html", "/bazaar/chat"],
    ["/bazaar/meus-anuncios.html", "/bazaar/meus-anuncios"],
    ["/store/index.html", "/store/"],
    ["/store/negociar.html", "/store/negociar"],
    ["/vplab/index.html", "/vplab/"],
    ["/vplab/avaliar-iv-v4.html", "/vplab/avaliar-iv"],
    ["/vplab/pokedex-v2.html", "/vplab/pokedex"],
  ]) {
    assert.ok(nginx.includes(`location = ${oldPath}`), oldPath);
    assert.ok(nginx.includes(`return 308 ${cleanPath}`), cleanPath);
  }
});

test("rota explícita do Avaliar IV serve o SPA sem cair no redirect da raiz", () => {
  assert.match(nginx, /location = \/vplab\/avaliar-iv\s*\{\s*try_files \/index\.html =404;/);
});

test("runtime Docker não possui mecanismos de publicação legados", () => {
  assert.doesNotMatch(dockerfile, /apps|scripts|static-build|tesseract|vplab\/legacy/);
  assert.match(dockerfile, /COPY --from=react-build \/app\/dist \/usr\/share\/nginx\/html/);
});

test("fontes e dependências do runtime legado foram removidas", () => {
  for (const legacyPath of ["apps", "api", "dev-server.mjs", "vercel.json", "scripts/build.mjs"]) {
    assert.equal(fs.existsSync(legacyPath), false, `${legacyPath} ainda existe`);
  }

  const packageJson = fs.readFileSync("package.json", "utf8");
  assert.doesNotMatch(packageJson, /tesseract|@vercel\/blob|linkedom|sharp/);
});
