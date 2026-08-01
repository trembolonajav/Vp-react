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

test("runtime Docker não possui mecanismos de publicação legados", () => {
  assert.doesNotMatch(dockerfile, /apps|scripts|static-build|tesseract|vplab\/legacy/);
  assert.match(dockerfile, /COPY --from=react-build \/app\/dist \/usr\/share\/nginx\/html/);
});
