import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const detail = fs.readFileSync("frontend/src/features/bazaar/pages/AnuncioPage.tsx", "utf8");
const header = fs.readFileSync("frontend/src/features/vplab/components/VplabHeader.tsx", "utf8");
const pokedex = fs.readFileSync("frontend/src/features/vplab/pages/PokedexPage.tsx", "utf8");
const app = fs.readFileSync("frontend/src/App.tsx", "utf8");
const bazaarHeader = fs.readFileSync("frontend/src/features/bazaar/components/Header.tsx", "utf8");

test("compartilhamento prepara texto por plataforma sem abrir aplicativos", () => {
  assert.match(detail, /mensagemDiscord/);
  assert.match(detail, /mensagemPlataforma/);
  assert.match(detail, /Copiar para \$\{atual\[1\]\}/);
  assert.match(detail, /\?v=2/);
  assert.match(detail, /"💎"/);
  assert.doesNotMatch(detail, /wa\.me\/\?text|discord\.com\/channels|t\.me\/share|twitter\.com\/intent/);
});

test("imagem do anúncio e da prévia possuem fallback de carregamento", () => {
  assert.match(detail, /const spriteFallback/);
  assert.match(detail, /e\.currentTarget\.src = spriteFallback/);
});

test("PokeFipe fica oculta dos atalhos sem remover sua implementação", () => {
  assert.match(header, /SHOW_POKEFIPE = false/);
  assert.match(header, /tool\.path !== "\/vplab\/pokefipe"/);
  assert.doesNotMatch(pokedex, /Ver na PokeFipe/);
  assert.match(app, /path="pokefipe"/);
});

test("anúncio e sessão aguardam as APIs sem exibir dados fictícios", () => {
  assert.match(detail, /if \(!listing\)/);
  assert.match(detail, /Carregando anúncio/);
  assert.match(bazaarHeader, /user, loading, logout/);
  assert.match(bazaarHeader, /loading \? \(/);
});
