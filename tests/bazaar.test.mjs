import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { sanitizeConfig } from "../api/_lib/validate.mjs";
import { DEFAULT_CONFIG, TYPE_KEYS } from "../api/_lib/defaults.mjs";

const ROOT = path.join(import.meta.dirname, "..");
const BAZAAR = path.join(ROOT, "apps", "vpertz-bazaar", "public");
const read = (file) => fs.readFileSync(path.join(BAZAAR, file), "utf8");

/* Config mínima válida com um anúncio, para os testes de sanitização. */
function comAnuncio(anuncio, bazaar = {}) {
  const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  cfg.bazaar = { ...cfg.bazaar, ...bazaar, anuncios: [anuncio] };
  return sanitizeConfig(cfg).bazaar;
}

const BASE = {
  id: "an-1", titulo: "Charizard shiny", jogo: "pokeidle",
  servidor: "Genesis", categoria: "Pokémon", intencao: "venda",
  moeda: "brl", preco: 250, negociavel: true, destaque: false,
  status: "ativo", img: "", descricao: "lvl 100", vendedor: "vperts",
  criadoEm: "2026-07-22",
  dex: 6, nivel: 88, tipos: ["fire", "flying"], shiny: true,
  quantidade: 0, aceitaTroca: false,
  natureza: "Modest", habilidade: "Blaze", genero: "macho", forma: "Normal",
  qualidade: 1.8, disponibilidade: "Venda e Troca",
  ivs: [31, 31, 31, 31, 31, 29], moves: ["Flamethrower", "Air Slash"], regras: "Só pelo chat.",
  vendedorVerificado: true, vendedorOnline: true,
  vendedorNota: 4.9, vendedorVendas: 42, vendedorResposta: "5 min", vendedorAvatar: ""
};

test("a configuração padrão já traz o bazaar pronto", () => {
  const { bazaar } = sanitizeConfig(DEFAULT_CONFIG);
  assert.equal(bazaar.ativo, true);
  assert.ok(bazaar.servidores.length > 0);
  assert.ok(bazaar.categorias.length > 0);
  assert.deepEqual(bazaar.anuncios, []);
  assert.match(bazaar.msgInteresse, /\{titulo\}/);
  assert.match(bazaar.msgInteresse, /\{id\}/);
});

test("config sem a chave bazaar não quebra (deploys anteriores ao lançamento)", () => {
  const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  delete cfg.bazaar;
  const { bazaar } = sanitizeConfig(cfg);
  assert.equal(bazaar.ativo, true);
  assert.deepEqual(bazaar.anuncios, []);
});

test("um anúncio válido atravessa a sanitização intacto", () => {
  const { anuncios } = comAnuncio(BASE);
  assert.equal(anuncios.length, 1);
  assert.deepEqual(anuncios[0], BASE);
});

test("anúncio sem título é recusado", () => {
  assert.throws(() => comAnuncio({ ...BASE, titulo: "   " }), /título obrigatório/i);
});

test("campos de escolha caem no padrão quando vêm com valor inventado", () => {
  const { anuncios } = comAnuncio({
    ...BASE, intencao: "trocar", moeda: "pix", status: "excluido"
  });
  assert.equal(anuncios[0].intencao, "venda");
  assert.equal(anuncios[0].moeda, "brl");
  assert.equal(anuncios[0].status, "ativo");
});

test("servidor e categoria fora da taxonomia são descartados", () => {
  /* senão o filtro do marketplace ganha opções órfãs que não selecionam nada */
  const { anuncios } = comAnuncio({ ...BASE, servidor: "Inexistente", categoria: "Nada" });
  assert.equal(anuncios[0].servidor, "");
  assert.equal(anuncios[0].categoria, "");
});

test("o jogo do anúncio precisa existir na loja", () => {
  const { anuncios } = comAnuncio({ ...BASE, jogo: "jogo-que-nao-existe" });
  assert.equal(anuncios[0].jogo, DEFAULT_CONFIG.games[0].id);
});

test("ids duplicados são desambiguados", () => {
  const cfg = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  cfg.bazaar.anuncios = [BASE, { ...BASE, titulo: "Outro" }];
  const { anuncios } = sanitizeConfig(cfg).bazaar;
  assert.notEqual(anuncios[0].id, anuncios[1].id);
});

test("HTML no título e na descrição é neutralizado", () => {
  const { anuncios } = comAnuncio({
    ...BASE,
    titulo: '<img src=x onerror="alert(1)">Espada',
    descricao: "<script>roubar()</script>"
  });
  assert.equal(anuncios[0].titulo.includes("<"), false);
  assert.equal(anuncios[0].descricao.includes("<"), false);
});

test("imagem só aceita asset do site, upload ou https", () => {
  assert.equal(comAnuncio({ ...BASE, img: "javascript:alert(1)" }).anuncios[0].img, "");
  assert.equal(comAnuncio({ ...BASE, img: "http://inseguro.com/a.png" }).anuncios[0].img, "");
  assert.equal(comAnuncio({ ...BASE, img: "https://ok.com/a.png" }).anuncios[0].img, "https://ok.com/a.png");
  assert.equal(comAnuncio({ ...BASE, img: "assets/item.webp" }).anuncios[0].img, "assets/item.webp");
});

test("preço é numérico e nunca negativo", () => {
  assert.equal(comAnuncio({ ...BASE, preco: -50 }).anuncios[0].preco, 0);
  assert.equal(comAnuncio({ ...BASE, preco: "abc" }).anuncios[0].preco, 0);
});

test("data de publicação inválida vira vazio em vez de sujar a ordenação", () => {
  assert.equal(comAnuncio({ ...BASE, criadoEm: "22/07/2026" }).anuncios[0].criadoEm, "");
});

test("servidores e categorias não guardam duplicados nem vazios", () => {
  const { servidores } = comAnuncio(BASE, { servidores: ["Genesis", " genesis ", "", "Aurora"] });
  assert.deepEqual(servidores, ["Genesis", "Aurora"]);
});

/* ---------------- ficha do card ---------------- */

test("tipagens inválidas e repetidas são descartadas, no máximo duas", () => {
  const { anuncios } = comAnuncio({ ...BASE, tipos: ["fire", "fire", "banana", "water", "grass"] });
  assert.deepEqual(anuncios[0].tipos, ["fire", "water"]);
});

test("tipos fora de array não quebram a sanitização", () => {
  assert.deepEqual(comAnuncio({ ...BASE, tipos: "fire" }).anuncios[0].tipos, []);
  assert.deepEqual(comAnuncio({ ...BASE, tipos: null }).anuncios[0].tipos, []);
});

test("dex e nível ficam dentro dos limites da Pokédex", () => {
  assert.equal(comAnuncio({ ...BASE, dex: 99999 }).anuncios[0].dex, 1025);
  assert.equal(comAnuncio({ ...BASE, dex: -5 }).anuncios[0].dex, 0);
  assert.equal(comAnuncio({ ...BASE, nivel: 250 }).anuncios[0].nivel, 100);
});

test("anúncio antigo, sem os campos do card, ganha valores neutros", () => {
  /* garante que um deploy anterior a esta fase não quebra o marketplace */
  const antigo = { ...BASE };
  delete antigo.dex; delete antigo.nivel; delete antigo.tipos;
  delete antigo.shiny; delete antigo.quantidade;
  delete antigo.vendedorVerificado; delete antigo.vendedorOnline;

  const a = comAnuncio(antigo).anuncios[0];
  assert.equal(a.dex, 0);
  assert.equal(a.nivel, 0);
  assert.deepEqual(a.tipos, []);
  assert.equal(a.shiny, false);
  assert.equal(a.vendedorVerificado, false);
});

test("o card usa as artes 9-slice e o diamante azul existente", () => {
  const css = read("bazaar.css");
  for (const arte of ["card-frame", "botao-anuncio", "placa-destaque", "placa-shiny"]) {
    assert.match(css, new RegExp(`border-image:url\\('/assets/bazaar/${arte}\\.webp'\\)`),
      `${arte} deveria ser aplicada como border-image (9-slice)`);
  }
  assert.match(read("bazaar.js"), /diamante-pokeidle-oficial\.png/);
});

test("as artes do card e da página existem e são leves", () => {
  const dir = path.join(ROOT, "apps", "vpertz-store", "public", "assets", "bazaar");
  let total = 0;
  for (const arte of ["card-frame", "botao-anuncio", "placa-destaque", "placa-shiny",
    "placa-vermelha", "placa-alerta"]) {
    const arquivo = path.join(dir, `${arte}.webp`);
    assert.ok(fs.existsSync(arquivo), `falta ${arte}.webp`);
    total += fs.statSync(arquivo).size;
  }
  /* as origens somavam ~13 MB; servir isso seria repetir o erro do Drazaar */
  assert.ok(total < 160 * 1024, `artes pesam ${(total / 1024).toFixed(0)} KB`);
});

test("IVs só valem com os 6 valores, cada um de 0 a 32", () => {
  assert.deepEqual(comAnuncio({ ...BASE, ivs: [32, 32, 32, 32, 32, 32] }).anuncios[0].ivs,
    [32, 32, 32, 32, 32, 32]);
  assert.deepEqual(comAnuncio({ ...BASE, ivs: [31, 31, 31] }).anuncios[0].ivs, []);
  assert.deepEqual(comAnuncio({ ...BASE, ivs: [99, -5, 31, 31, 31, 31] }).anuncios[0].ivs,
    [32, 0, 31, 31, 31, 31]);
});

test("qualidade numérica preserva decimais e é limitada com segurança", () => {
  assert.equal(comAnuncio({ ...BASE, qualidade: 3.2 }).anuncios[0].qualidade, 3.2);
  assert.equal(comAnuncio({ ...BASE, qualidade: -1 }).anuncios[0].qualidade, 0);
});

test("moves limitam a quatro e o gênero cai no vazio se inválido", () => {
  assert.deepEqual(comAnuncio({ ...BASE, moves: ["a", "b", "c", "d", "e"] }).anuncios[0].moves,
    ["a", "b", "c", "d"]);
  assert.equal(comAnuncio({ ...BASE, genero: "outro" }).anuncios[0].genero, "");
  assert.equal(comAnuncio({ ...BASE, genero: "femea" }).anuncios[0].genero, "femea");
});

test("a nota do vendedor fica entre 0 e 5", () => {
  assert.equal(comAnuncio({ ...BASE, vendedorNota: 9 }).anuncios[0].vendedorNota, 5);
  assert.equal(comAnuncio({ ...BASE, vendedorNota: 4.7 }).anuncios[0].vendedorNota, 4.7);
});

test("existe um ícone para cada uma das 18 tipagens", () => {
  const dir = path.join(ROOT, "apps", "vpertz-store", "public", "assets", "bazaar", "types");
  for (const tipo of TYPE_KEYS) {
    assert.ok(fs.existsSync(path.join(dir, `${tipo}.webp`)), `falta o ícone de ${tipo}`);
  }
});

test("os 16 ícones de campo do Pokémon foram gerados e são leves", () => {
  const dir = path.join(ROOT, "apps", "vpertz-store", "public", "assets", "bazaar", "fields");
  const nomes = ["nivel", "genero", "natureza", "iv-total", "habilidade", "forma", "golpes",
    "servidor", "hp-iv", "ataque-iv", "defesa-iv", "ataque-especial-iv", "defesa-especial-iv",
    "velocidade-iv", "raridade-shiny", "disponivel-troca"];
  let total = 0;
  for (const nome of nomes) {
    const arquivo = path.join(dir, `${nome}.webp`);
    assert.ok(fs.existsSync(arquivo), `falta o ícone de campo ${nome}`);
    total += fs.statSync(arquivo).size;
  }
  assert.ok(total < 130 * 1024, `ícones de campo pesam ${(total / 1024).toFixed(0)} KB`);
});

test("a seta do carrossel existe (xadrez falso removido)", () => {
  const arquivo = path.join(ROOT, "apps", "vpertz-store", "public", "assets", "bazaar", "seta.webp");
  assert.ok(fs.existsSync(arquivo), "falta seta.webp");
});

test("o vendedor tem Negociar/Compartilhar/Denunciar e não Chamar/Favoritar", () => {
  const js = read("bazaar.js");
  assert.ok(js.includes("bz-btn-negociar"), "falta o botão Negociar");
  assert.ok(js.includes("bz-btn-compartilhar"), "falta o botão Compartilhar");
  assert.ok(js.includes("bz-btn-denunciar"), "falta o botão Denunciar");
  assert.equal(js.includes("Chamar no WhatsApp"), false, "Chamar no chat deveria ter saído");
  assert.equal(js.includes("Favoritar anúncio"), false, "Favoritar deveria ter saído do anúncio");
});

test("os botões ficam dentro do card do vendedor", () => {
  /* vendedorHTML monta o card e as ações no mesmo bloco .bz-seller-card */
  const js = read("bazaar.js");
  const card = js.slice(js.indexOf("bz-seller-card"), js.indexOf("Grade de especificações"));
  assert.ok(card.includes("bz-actions"), "as ações deveriam estar dentro do card do vendedor");
});

test("Compartilhar e Denunciar usam a placa completa e têm o mesmo tamanho", () => {
  const css = read("bazaar.css");
  assert.match(css, /\.bz-btn-compartilhar[^}]*botao-compartilhar\.webp/s);
  assert.match(css, /\.bz-btn-denunciar[^}]*botao-denunciar\.webp/s);
  /* metades iguais travadas por grid minmax(0,1fr) */
  assert.match(css, /\.bz-actions-row\{[^}]*minmax\(0,1fr\) minmax\(0,1fr\)/s);
  /* usam a moldura completa (sem `fill`, os dois cantos aparecem) */
  assert.equal(/botao-compartilhar\.webp'\)\s*\d+\s+fill/.test(css), false);
  assert.equal(/botao-denunciar\.webp'\)\s*\d+\s+fill/.test(css), false);
  for (const nome of ["botao-compartilhar", "botao-denunciar"]) {
    const arquivo = path.join(ROOT, "apps", "vpertz-store", "public", "assets", "bazaar", `${nome}.webp`);
    assert.ok(fs.existsSync(arquivo), `falta ${nome}.webp`);
  }
});

test("o carrossel de semelhantes tem trilha e setas", () => {
  const js = read("bazaar.js");
  assert.ok(js.includes("data-carousel-prev") && js.includes("data-carousel-next"), "faltam as setas");
  assert.ok(js.includes("ligarCarrossel"), "falta a lógica do carrossel");
  assert.match(read("bazaar.css"), /\.bz-arrow[^}]*seta\.webp/s);
});

test("as páginas do bazaar carregam o design system da loja", () => {
  for (const pagina of ["index.html", "anunciar.html", "como-funciona.html", "anuncio.html"]) {
    const html = read(pagina);
    assert.ok(html.includes('href="/styles.css"'), `${pagina} sem o CSS da loja`);
    assert.ok(html.includes('href="bazaar.css"'), `${pagina} sem o CSS do bazaar`);
    assert.ok(html.includes("Cinzel"), `${pagina} sem a tipografia da marca`);
    assert.ok(html.includes('src="/config.js"'), `${pagina} sem os helpers compartilhados`);
  }
});

test("o marketplace tem os filtros e não abre mais em modal", () => {
  const html = read("index.html");
  for (const marcador of [
    "data-grid", "data-f-q", "data-f-iv-min", "data-f-quality-min", "data-f-categoria",
    "data-f-jogo", "data-f-sort", "data-seg=\"intencao\"", "data-seg=\"moeda\"",
    "data-pager"
  ]) {
    assert.ok(html.includes(marcador), `faltou ${marcador} no marketplace`);
  }
  /* o anúncio agora abre em página própria: o modal foi removido */
  assert.equal(html.includes("data-modal"), false, "o modal deveria ter sido removido");
  assert.equal(read("bazaar.js").includes("abrirFicha"), false, "sobrou código do modal antigo");
});

test("existe a página dedicada do anúncio, ligada ao id da URL", () => {
  const html = read("anuncio.html");
  assert.ok(html.includes("data-detalhe"), "anuncio.html sem o ponto de montagem");
  const js = read("bazaar.js");
  assert.ok(js.includes("renderDetalhe"), "falta o renderizador da página de anúncio");
  assert.match(js, /anuncio\.html\?id=/, 'o card deve linkar para "anuncio.html?id="');
});

test("cada seção do anúncio é um painel emoldurado empilhado, sem moldura única", () => {
  const css = read("bazaar.css");
  /* os sub-painéis usam a moldura de cantos card-frame */
  assert.match(css, /\.bz-subpanel\{[^}]*border-image:url\('\/assets\/bazaar\/card-frame\.webp'\)/s);
  /* a coluna central é uma pilha flex, não um container com moldura própria */
  assert.match(css, /\.bz-detalhe-main\{[^}]*display:flex/s);
  assert.equal(/\.bz-detalhe-main\{[^}]*moldura-anuncio/s.test(css), false,
    "a coluna central não deve mais usar a moldura única");
  assert.match(css, /\.bz-btn-negociar[^}]*placa-vermelha\.webp/s);
});

test("o bazaar é publicado em /bazaar/ pelo build e pela Vercel", () => {
  const build = fs.readFileSync(path.join(ROOT, "scripts", "build.mjs"), "utf8");
  assert.match(build, /dist.*bazaar|"bazaar"/);
  const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
  assert.ok(vercel.redirects.some((r) => r.source === "/bazaar" && r.destination === "/bazaar/"));
});

test("o CSS do bazaar não redefine a paleta nem o header globais", () => {
  const css = read("bazaar.css");
  assert.equal(/:root\s*\{/.test(css), false, "o bazaar não deve redeclarar variáveis da marca");
  assert.equal(/(?:^|[};])\s*header\s*\{/.test(css), false, "o bazaar não deve reestilizar o header global");
});
