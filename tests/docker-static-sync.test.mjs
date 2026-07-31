import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const compose = fs.readFileSync("docker-compose.yml", "utf8");
const dockerfile = fs.readFileSync("frontend/Dockerfile", "utf8");

test("Docker monta o frontend a partir da raiz do projeto", () => {
  assert.match(compose, /context:\s*\./);
  assert.match(compose, /dockerfile:\s*frontend\/Dockerfile/);
});

test("Docker mantém apps somente como ponte temporária de compatibilidade", () => {
  assert.match(dockerfile, /COPY apps \.\/apps/);
  assert.match(dockerfile, /Ponte temporária de paridade/);
  assert.match(dockerfile, /não é a arquitetura final/);
  assert.match(dockerfile, /\/workspace\/dist\/vplab/);
  assert.match(dockerfile, /\/workspace\/dist\/bazaar/);
  assert.match(dockerfile, /\/workspace\/dist\/store/);
  assert.doesNotMatch(dockerfile, /COPY frontend\/public\/vplab/);
});
