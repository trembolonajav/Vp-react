import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const app = fs.readFileSync("frontend/src/App.tsx", "utf8");
const nginx = fs.readFileSync("frontend/nginx.conf", "utf8");

test("rotas finais da Store são servidas pelo SPA React", () => {
  assert.match(app, /path="jogos" element=\{<StoreHomePage \/>\}/);
  assert.match(app, /path="intermedio" element=\{<IntermedioPage \/>\}/);
  assert.match(app, /path="offline" element=\{<OfflinePage \/>\}/);
  assert.match(app, /path="admin" element=\{<Navigate to="\/admin" replace \/>\}/);
  for (const route of ["jogos", "intermedio", "offline"]) {
    assert.match(nginx, new RegExp(`location = \/store\/${route}\\s*\\{\\s*try_files \/index\\.html =404;`));
  }
});

test("URLs HTML históricas da Store apenas redirecionam", () => {
  for (const route of ["jogos", "intermedio", "offline"]) {
    assert.match(app, new RegExp(`path="${route}\\.html" element=\\{<Navigate to="\/store\/${route}" replace \/>\\}`));
    assert.match(nginx, new RegExp(`location = \/store\/${route}\\.html\\s*\\{\\s*return 308 \/store\/${route};`));
  }
  assert.match(nginx, /location = \/store\/admin(?:\.html)?\s*\{\s*return 308 \/admin;/);
});

test("catálogo informa loading e falha da configuração Spring", () => {
  const home = fs.readFileSync("frontend/src/features/store/pages/StoreHomePage.tsx", "utf8");
  const configService = fs.readFileSync("frontend/src/services/configService.ts", "utf8");
  assert.match(home, /Carregando jogos/);
  assert.match(home, /Não foi possível carregar os jogos/);
  assert.match(configService, /\/api\/v1\/config/);
  assert.doesNotMatch(home, /localStorage/);
});
