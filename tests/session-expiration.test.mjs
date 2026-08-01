import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("qualquer 401 autenticado encerra a sessão React", () => {
  const api = fs.readFileSync("frontend/src/services/api.ts", "utf8");
  const context = fs.readFileSync("frontend/src/contexts/AuthContext.tsx", "utf8");
  assert.match(api, /response\.status === 401 && token/);
  assert.match(api, /tokenStore\.clear\(\)/);
  assert.match(api, /dispatchEvent\(new Event\(AUTH_EXPIRED_EVENT\)\)/);
  assert.match(context, /addEventListener\(AUTH_EXPIRED_EVENT, expireSession\)/);
  assert.match(context, /const expireSession = \(\) => setUser\(null\)/);
});
