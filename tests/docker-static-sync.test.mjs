import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const compose = fs.readFileSync("docker-compose.yml", "utf8");
const dockerfile = fs.readFileSync("frontend/Dockerfile", "utf8");

test("Docker monta exclusivamente o frontend React", () => {
  assert.match(compose, /context:\s*\.\/frontend/);
  assert.match(compose, /dockerfile:\s*Dockerfile/);
});

test("Docker não copia nem executa o build estático legado", () => {
  assert.doesNotMatch(dockerfile, /COPY apps|COPY scripts|static-build|workspace\/dist/);
  assert.match(dockerfile, /COPY \. \.\//);
  assert.match(dockerfile, /npm run build/);
});
