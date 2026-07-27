/* ============================================================
   VP BAZAAR — marketplace entre jogadores
   ------------------------------------------------------------
   Fase 1: os anúncios vêm da configuração publicada no painel
   (/api/config -> cfg.bazaar) e a negociação sai pelo WhatsApp.
   Depende de /config.js (vpEsc, vpFetchConfig, vpBazaar, vpWaLink).
   ============================================================ */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = window.vpEsc;

const PAGE_SIZE = 12;

/* Tipagens: mesmas chaves e cores do VPLab (TYPE_LABEL/TYPE_COLOR em
   apps/vpertz-lab/public/app.js). Os selos usam os ícones convertidos por
   scripts/prepare-bazaar-assets.mjs. */
const TYPE_LABEL = {
  normal: "Normal", fire: "Fogo", water: "Água", electric: "Elétrico", grass: "Planta",
  ice: "Gelo", fighting: "Lutador", poison: "Veneno", ground: "Terra", flying: "Voador",
  psychic: "Psíquico", bug: "Inseto", rock: "Pedra", ghost: "Fantasma", dragon: "Dragão",
  dark: "Sombrio", steel: "Aço", fairy: "Fada"
};
const TYPE_COLOR = {
  normal: "#9a9a7c", fire: "#e0742f", water: "#5680d8", electric: "#d8b220", grass: "#6da33e",
  ice: "#7fc4c4", fighting: "#a5342a", poison: "#8f3f8f", ground: "#c9a952", flying: "#8d7fd8",
  psychic: "#dd4f7f", bug: "#93a021", rock: "#a89232", ghost: "#5f5390", dragon: "#5f3cc9",
  dark: "#584538", steel: "#8a8aa0", fairy: "#c96f9e"
};

/* Escala de qualidade (0,80–3,60) e ordem das tipagens: mesmos valores do
   redesign "VP Bazaar — Telas" (aba de filtros do marketplace). */
const QUALIDADES = [
  { nome: "Fraca",    lo: 0.80, hi: 1.00, ponto: "#6b5a52" },
  { nome: "Comum",    lo: 1.00, hi: 1.10, ponto: "#8a7a70" },
  { nome: "Incomum",  lo: 1.10, hi: 1.30, ponto: "#7fd9a2" },
  { nome: "Rara",     lo: 1.30, hi: 1.50, ponto: "#5b9bd6" },
  { nome: "Épica",    lo: 1.50, hi: 1.70, ponto: "#9a6fbb" },
  { nome: "Lendária", lo: 1.70, hi: 1.80, ponto: "#e5b34f" },
  { nome: "Mítica",   lo: 1.80, hi: 2.20, ponto: "#e8654a" },
  { nome: "Anciã",    lo: 2.20, hi: 2.90, ponto: "#d84f9e" },
  { nome: "Divina",   lo: 2.90, hi: 3.60, ponto: "#f2f0e6" }
];
const QUAL_MIN = 0.80, QUAL_MAX = 3.60;
const TIPOS_ORDEM = [
  "normal", "fire", "water", "grass", "electric", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy"
];

/* Mesma fonte de sprites que o VPLab já usa. */
const spriteUrl = (dex) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dex}.png`;

const DIAMANTE = "/assets/diamante-pokeidle-oficial.png";
function etiquetaQualidade(valor) {
  const q = Number(valor);
  if (!Number.isFinite(q)) return "";
  if (q < 1) return "Fraca";
  if (q < 1.1) return "Comum";
  if (q < 1.3) return "Incomum";
  if (q < 1.5) return "Rara";
  if (q < 1.7) return "Épica";
  if (q < 2) return "Lendária";
  if (q < 3) return "Mítica";
  if (q < 4) return "Anciã";
  return "Divina";
}
const qualidadeTexto = (valor) => Number.isFinite(Number(valor))
  ? Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 3 })
  : "";

/* Favoritos são locais: nesta fase não há contas de usuário. */
const FAV_KEY = "vp-bazaar-favoritos";
const lerFavoritos = () => {
  try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY)) || []); }
  catch { return new Set(); }
};
let favoritos = lerFavoritos();
const gravarFavoritos = () => {
  try { localStorage.setItem(FAV_KEY, JSON.stringify([...favoritos])); }
  catch { /* modo privado / storage cheio: o favorito vale só nesta sessão */ }
};

/* Liga/desliga um favorito e sincroniza o botão que o disparou. */
function alternarFavorito(id, botao) {
  const marcado = !favoritos.has(id);
  if (marcado) favoritos.add(id); else favoritos.delete(id);
  gravarFavoritos();
  botao.setAttribute("aria-pressed", String(marcado));
  botao.setAttribute("aria-label", marcado ? "Remover dos favoritos" : "Salvar nos favoritos");
  return marcado;
}

let cfg = null;
let bz = null;
let anuncios = [];   // o que a vitrine lista
let todos = [];      // inclui os já vendidos, para abrir por link direto

/* Garante todos os campos do card/ficha mesmo em configs salvas antes desta
   fase (o /api/config público devolve o JSON como está, sem sanitizar). */
function normalizarAnuncio(a) {
  if (!a.tipo && a.categoria === "Shiny Card") a.tipo = "shinycard";
  if (!a.tipo && (a.categoria === "Item" || a.categoria === "Itens")) a.tipo = "item";
  if (!a.tipo && (a.dex || a.categoria === "Pokémon")) a.tipo = "pokemon";
  if (a.tipo === "shinycard") {
    if (!/^shiny\s.+\scard$/i.test(a.titulo || "")) a.titulo = `Shiny ${a.titulo} Card`;
    a.dex = 0;
    a.tipos = [];
    a.shiny = false;
  }
  if (a.tipo === "item") {
    a.dex = 0;
    a.tipos = [];
    a.shiny = false;
  }
  a.tipos = Array.isArray(a.tipos) ? a.tipos : [];
  a.ivs = Array.isArray(a.ivs) && a.ivs.length === 6 ? a.ivs : [];
  a.moves = Array.isArray(a.moves) ? a.moves : [];
  a.dex ??= 0; a.nivel ??= 0; a.poder ??= 0; a.quantidade ??= 0;
  a.shiny ??= false; a.aceitaTroca ??= false;
  a.natureza ??= ""; a.habilidade ??= ""; a.genero ??= ""; a.forma ??= ""; a.regras ??= "";
  if (a.tipo === "pokemon" && !["Normal", "Shiny"].includes(a.forma)) {
    a.forma = a.shiny ? "Shiny" : "Normal";
  }
  a.qualidade ??= ""; a.disponibilidade ??= "";
  a.vendedorVerificado ??= false; a.vendedorOnline ??= false;
  a.vendedorNota ??= 0; a.vendedorVendas ??= 0; a.vendedorResposta ??= ""; a.vendedorAvatar ??= "";
  return a;
}

/* Anúncios criados pelo usuário no wizard (Fase 2: placeholder local, sem
   backend). Ficam no localStorage e se juntam aos oficiais do painel para
   aparecer no marketplace e abrir em anuncio.html deste navegador. */
const MEUS_KEY = "vp-bazaar-meus";
function carregarLocais() {
  try {
    const arr = JSON.parse(localStorage.getItem(MEUS_KEY)) || [];
    return arr.map((a) => { a.local = true; return normalizarAnuncio(a); });
  } catch { return []; }
}

/* ---------------------------------------------- helpers de exibição */
const jogoNome = (id) => cfg.games.find((g) => g.id === id)?.nome || "";

function precoTexto(a) {
  if (!a.preco) return { valor: "A combinar", unidade: "" };
  if (a.moeda === "diamonds") {
    return { valor: a.preco.toLocaleString("pt-BR"), unidade: "diamonds" };
  }
  return { valor: window.vpBRL(a.preco), unidade: "" };
}

/* Mensagem do WhatsApp com os marcadores do painel já substituídos. */
function linkInteresse(a) {
  const msg = String(bz.msgInteresse)
    .replaceAll("{titulo}", a.titulo)
    .replaceAll("{id}", a.id);
  return window.vpWaLink(cfg, msg);
}

/* A arte da logo pode ainda não ter sido enviada pelo painel: nesse caso
   caímos no wordmark em texto em vez de deixar imagem quebrada. */
function ajustarMarca() {
  $$(".brand").forEach((brand) => {
    const img = $(".logo", brand);
    if (!img) return;
    const falhou = () => brand.classList.add("no-art");
    if (img.complete && img.naturalWidth === 0) falhou();
    img.addEventListener("error", falhou);
  });
}

/* ---------------------------------------------- rodapé e atalhos comuns */
function montarComuns() {
  $$("[data-wa-anunciar]").forEach((el) => {
    el.href = window.vpWaLink(cfg, bz.msgAnunciar);
  });

  const socials = $("[data-socials]");
  if (socials) {
    socials.innerHTML = cfg.contatos.map((c) => `
      <a class="social" href="${esc(c.url || window.vpWaLink(cfg, cfg.msgNegociar))}"
         target="_blank" rel="noreferrer" title="${esc(c.nome)}">
        ${window.vpIcon(c.icone)}
      </a>`).join("");
  }
}

/* ============================================================
   MARKETPLACE
   ============================================================ */

const filtros = {
  q: "", tipo: "", intencao: "", moeda: "", jogo: "", categoria: "", negociacao: "",
  min: "", max: "", ivMin: "", ivMax: "", qualityMin: "", qualityMax: "",
  nivelMin: "", nivelMax: "", poderMin: "", poderMax: "", tipos: [],
  sort: "recentes", page: 1
};

function aplicarFiltros() {
  const q = filtros.q.trim().toLowerCase();
  const min = filtros.min === "" ? null : Number(filtros.min);
  const max = filtros.max === "" ? null : Number(filtros.max);
  const ivMin = filtros.ivMin === "" ? null : Number(filtros.ivMin);
  const ivMax = filtros.ivMax === "" ? null : Number(filtros.ivMax);
  const qualityMin = filtros.qualityMin === "" ? null : Number(filtros.qualityMin);
  const qualityMax = filtros.qualityMax === "" ? null : Number(filtros.qualityMax);
  const nivelMin = filtros.nivelMin === "" ? null : Number(filtros.nivelMin);
  const nivelMax = filtros.nivelMax === "" ? null : Number(filtros.nivelMax);
  const poderMin = filtros.poderMin === "" ? null : Number(filtros.poderMin);
  const poderMax = filtros.poderMax === "" ? null : Number(filtros.poderMax);

  const lista = anuncios.filter((a) => {
    if (q && !a.titulo.toLowerCase().includes(q) && !a.descricao.toLowerCase().includes(q)) return false;
    if (filtros.tipo && a.tipo !== filtros.tipo) return false;
    if (filtros.intencao && a.intencao !== filtros.intencao) return false;
    if (filtros.moeda && a.moeda !== filtros.moeda) return false;
    if (filtros.jogo && a.jogo !== filtros.jogo) return false;
    if (filtros.categoria && a.categoria !== filtros.categoria) return false;
    /* tipagem elementar: casa quando o anúncio tem ao menos um dos tipos marcados */
    if (filtros.tipos.length && !filtros.tipos.some((t) => a.tipos.includes(t))) return false;
    const ivTotal = Array.isArray(a.ivs) ? a.ivs.reduce((sum, n) => sum + Number(n || 0), 0) : null;
    const quality = Number(a.qualidade);
    if (ivMin !== null && (ivTotal === null || ivTotal < ivMin)) return false;
    if (ivMax !== null && (ivTotal === null || ivTotal > ivMax)) return false;
    if (qualityMin !== null && (!Number.isFinite(quality) || quality < qualityMin)) return false;
    if (qualityMax !== null && (!Number.isFinite(quality) || quality > qualityMax)) return false;
    if (nivelMin !== null && (!a.nivel || a.nivel < nivelMin)) return false;
    if (nivelMax !== null && (!a.nivel || a.nivel > nivelMax)) return false;
    if (poderMin !== null && (!a.poder || a.poder < poderMin)) return false;
    if (poderMax !== null && (!a.poder || a.poder > poderMax)) return false;
    if (filtros.negociacao === "fixo" && a.negociavel) return false;
    if (filtros.negociacao === "proposta" && !a.negociavel) return false;
    /* faixa de preço só faz sentido dentro de uma mesma moeda */
    if (min !== null && a.preco < min) return false;
    if (max !== null && a.preco > max) return false;
    return true;
  });

  /* Reais e diamonds não são comparáveis: 3.500 diamonds não é "mais caro"
     que R$ 2.400. Ao ordenar por preço sem filtrar a moeda, agrupamos por
     moeda (reais primeiro) e ordenamos dentro de cada grupo. */
  const porMoeda = (a, b) =>
    filtros.moeda ? 0 : (a.moeda === "brl" ? 0 : 1) - (b.moeda === "brl" ? 0 : 1);

  const ordem = {
    recentes: (a, b) => String(b.criadoEm).localeCompare(String(a.criadoEm)),
    "preco-asc": (a, b) => porMoeda(a, b) || a.preco - b.preco,
    "preco-desc": (a, b) => porMoeda(a, b) || b.preco - a.preco,
    titulo: (a, b) => a.titulo.localeCompare(b.titulo, "pt-BR")
  };

  /* anúncios em destaque sobem sempre; o critério escolhido desempata. */
  return lista.sort((a, b) =>
    (b.destaque - a.destaque) || ordem[filtros.sort](a, b));
}

const SVG_CORACAO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.7 4.2 13a4.9 4.9 0 0 1 0-7 4.9 4.9 0 0 1 7 0l.8.8.8-.8a4.9 4.9 0 0 1 7 0 4.9 4.9 0 0 1 0 7Z"/></svg>';
const SVG_VERIFICADO = '<svg class="bz-verified" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1 9.3 3.7 5.6 3l-.9 3.7L1 7.6 2.7 11 1 14.4l3.7.9.9 3.7 3.7-.7L12 21l2.7-2.7 3.7.7.9-3.7 3.7-.9L21.3 11 23 7.6l-3.7-.9-.9-3.7-3.7.7Zm-1.2 14-3.5-3.5 1.5-1.5 2 2 4.9-4.9 1.5 1.5Z"/></svg>';

/* Selos de tipagem do card. */
function tiposHTML(tipos) {
  if (!tipos.length) return "";
  return `<div class="bz-types">${tipos.map((t) => `
    <span class="bz-type" style="--c:${TYPE_COLOR[t] || "#777"}">
      <img src="/assets/bazaar/types/${esc(t)}.webp" alt="" loading="lazy">
      ${esc(TYPE_LABEL[t] || t)}
    </span>`).join("")}</div>`;
}

/* Preço com o diamante azul do PokeIdle quando a moeda é diamonds. */
function precoHTML(a) {
  if (!a.preco) return '<div class="bz-price combinar">Preço a combinar</div>';
  if (a.moeda === "diamonds") {
    return `<img src="${DIAMANTE}" alt="diamonds" loading="lazy">
            <div class="bz-price">${a.preco.toLocaleString("pt-BR")}</div>`;
  }
  return `<div class="bz-price bz-price-brl">${esc(window.vpBRL(a.preco))}</div>`;
}

function cardHTML(a) {
  const vendido = a.status === "vendido";
  const favorito = favoritos.has(a.id);

  const placas = [
    a.destaque ? '<span class="bz-plate destaque">Destaque</span>' : "",
    a.shiny ? '<span class="bz-plate shiny">Shiny</span>' : "",
    vendido
      ? '<span class="bz-plate simples encerrado">Vendido</span>'
      : (!a.destaque && !a.shiny
          ? `<span class="bz-plate simples ${a.intencao}">${a.intencao === "compra" ? "Procura-se" : "À venda"}</span>`
          : ""),
    a.local ? '<span class="bz-plate seu">Seu anúncio</span>' : ""
  ].join("");

  /* dex > 0 usa o sprite da espécie; senão a imagem enviada no painel. */
  const arte = a.dex
    ? `<img src="${spriteUrl(a.dex)}" alt="" loading="lazy" data-fallback>`
    : a.img
      ? `<img src="${esc(a.img)}" alt="" loading="lazy">`
      : '<span class="bz-noart" aria-hidden="true">VP</span>';

  /* segunda linha da ficha: nível para pokémon, quantidade para item */
  const detalhe = a.nivel
    ? `Nível ${a.nivel}`
    : a.quantidade
      ? `Quantidade: ${a.quantidade.toLocaleString("pt-BR")}`
      : a.categoria;

  return `
    <article class="bz-card ${vendido ? "vendido" : ""}" data-id="${esc(a.id)}">
      <div class="bz-card-top">
        ${placas}
        <button class="bz-fav" type="button" data-fav="${esc(a.id)}"
                aria-pressed="${favorito}"
                aria-label="${favorito ? "Remover dos favoritos" : "Salvar nos favoritos"}">
          ${SVG_CORACAO}
        </button>
      </div>

      <div class="bz-card-main">
        <div class="bz-sprite">${arte}</div>
        <div>
          <h3 class="bz-card-title">
            <span>${esc(a.titulo)}</span>
            ${a.shiny ? '<span class="bz-star" aria-label="Shiny">★</span>' : ""}
          </h3>
          ${detalhe ? `<p class="bz-card-sub">${esc(detalhe)}</p>` : ""}
          ${tiposHTML(a.tipos)}
        </div>
      </div>

      ${a.vendedor ? `
        <div class="bz-seller">
          <span class="bz-seller-name">
            ${esc(a.vendedor)}${a.vendedorVerificado ? SVG_VERIFICADO : ""}
          </span>
          <span class="bz-online ${a.vendedorOnline ? "" : "off"}">
            ${a.vendedorOnline ? "Online" : "Offline"}
          </span>
        </div>` : ""}

      <div class="bz-card-price">
        ${precoHTML(a)}
        ${a.negociavel && !vendido ? '<span class="bz-negociavel">Aceita<br>propostas</span>' : ""}
      </div>

      <button class="bz-cta" type="button" data-ver="${esc(a.id)}">
        ${vendido ? "Ver anúncio encerrado" : "Ver anúncio"}
      </button>
    </article>`;
}

/* Card horizontal e compacto usado na faixa de anúncios semelhantes. */
function cardSemelhanteHTML(a) {
  const arte = a.dex
    ? `<img src="${spriteUrl(a.dex)}" alt="" loading="lazy" data-fallback>`
    : a.img
      ? `<img src="${esc(a.img)}" alt="" loading="lazy">`
      : '<span class="bz-related-noart" aria-hidden="true">VP</span>';
  const meta = [
    a.nivel ? `Nv. ${a.nivel}` : "",
    a.tipos[0] || a.categoria || ""
  ].filter(Boolean).join(" · ");
  const preco = precoTexto(a);

  return `<a class="bz-related-card" href="${linkAnuncio(a.id)}" aria-label="Ver ${esc(a.titulo)}">
    <span class="bz-related-art">${arte}</span>
    <span class="bz-related-copy">
      <strong>${esc(a.titulo)}</strong>
      ${meta ? `<small>${esc(meta)}</small>` : ""}
      <span class="bz-related-price">
        ${a.moeda === "diamonds" && a.preco ? '<img src="/assets/bazaar/anuncio-diamond.png" alt="">' : ""}
        <b>${esc(preco.valor)}${preco.unidade ? ` ${esc(preco.unidade)}` : ""}</b>
      </span>
    </span>
  </a>`;
}

function renderGrid() {
  const lista = aplicarFiltros();
  const total = lista.length;
  const paginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  filtros.page = Math.min(filtros.page, paginas);

  const inicio = (filtros.page - 1) * PAGE_SIZE;
  const pagina = lista.slice(inicio, inicio + PAGE_SIZE);

  $("[data-grid]").innerHTML = total
    ? pagina.map(cardHTML).join("")
    : `<div class="bz-empty">
         <strong>Nenhum anúncio encontrado</strong>
         <p>Ajuste os filtros ou fale com a gente — se o que você procura não
            está aqui, a VP corre atrás na comunidade.</p>
         <a class="btn-icon-label btn-whats" data-wa-anunciar href="#" target="_blank" rel="noreferrer">Falar no WhatsApp</a>
       </div>`;

  $("[data-count]").innerHTML = total
    ? `Exibindo <b>${inicio + 1}–${inicio + pagina.length}</b> de <b>${total}</b> ${total === 1 ? "anúncio" : "anúncios"}`
    : "Nenhum anúncio corresponde aos filtros";

  const pager = $("[data-pager]");
  pager.hidden = paginas < 2;
  if (!pager.hidden) {
    $("[data-page-info]").textContent = `Página ${filtros.page} de ${paginas}`;
    $("[data-prev]").disabled = filtros.page === 1;
    $("[data-next]").disabled = filtros.page === paginas;
  }

  montarComuns();
  ligarCards($("[data-grid]"));
}

const linkAnuncio = (id) => `anuncio.html?id=${encodeURIComponent(id)}`;

/* Um só listener por container em vez de um por card. */
function ligarCards(container) {
  container.addEventListener("click", (e) => {
    const fav = e.target.closest("[data-fav]");
    if (fav) {
      alternarFavorito(fav.dataset.fav, fav);
      return;                       // favoritar não abre o anúncio
    }
    const card = e.target.closest(".bz-card");
    if (card) location.href = linkAnuncio(card.dataset.id);
  });

  /* Sprite indisponível (offline ou dex sem arte): cai no placeholder. */
  container.addEventListener("error", (e) => {
    const img = e.target;
    if (img.tagName !== "IMG" || !img.hasAttribute("data-fallback")) return;
    img.removeAttribute("data-fallback");
    img.replaceWith(Object.assign(document.createElement("span"), {
      className: "bz-noart", textContent: "VP", ariaHidden: "true"
    }));
  }, true);                          // captura: o evento error não borbulha
}

/* ============================================================
   PÁGINA DO ANÚNCIO (anuncio.html?id=...)
   ============================================================ */

const GENERO_LABEL = { macho: "Macho ♂", femea: "Fêmea ♀", sem: "Sem gênero" };
const IV_NOMES = ["HP", "Ataque", "Defesa", "Atq. Esp.", "Def. Esp.", "Velocidade"];

/* Ícones de linha, no tom dourado da marca — desenhados inline para não pesar. */
const ICO = {
  nivel: '<path d="M5 21V9m7 12V3m7 18v-8"/>',
  nature: '<path d="M4 20c9 2 16-5 16-16C8 5 2 11 4 20zm3-3 9-9"/>',
  servidor: '<path d="M7 4h10v3a5 5 0 0 1-10 0zM6 5H3v2a3 3 0 0 0 3 3m12-8h3v2a3 3 0 0 1-3 3M9 20h6m-3-4v4"/>',
  raridade: '<path d="m12 3 2.2 5 5.3.4-4 3.5 1.2 5.2-4.7-2.8-4.7 2.8 1.2-5.2-4-3.5 5.3-.4z"/>',
  genero: '<circle cx="12" cy="9" r="5"/><path d="M12 14v7m-3-3h6"/>',
  total: '<path d="m12 3 2.6 5.6L21 9.3l-4.5 4.3L17.8 21 12 17.6 6.2 21l1.3-7.4L3 9.3l6.4-.7z"/>',
  habilidade: '<path d="M5 4h11v16H6a2 2 0 0 0-2 2V6a2 2 0 0 1 1-2z"/>',
  forma: '<path d="M12 2 4 7v10l8 5 8-5V7z"/>',
  disponivel: '<path d="M7 7h11l-3-3m3 13H6l3 3"/>',
  regras: '<path d="M6 3h9l3 3v15H6zM15 3v4h4"/>',
  descricao: '<path d="M5 4h14M5 9h14M5 14h9M5 19h6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
  stat: '<path d="m12 4 7 8-7 8-7-8z"/>'
};
const ico = (n, cls = "bz-ico") =>
  `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICO[n] || ICO.stat}</svg>`;

/* Ícones dos campos do Pokémon (arte pronta em assets/bazaar/fields). */
const fico = (arquivo) =>
  `<img class="bz-fico" src="/assets/bazaar/fields/${arquivo}.webp" alt="" loading="lazy">`;

/* Ícones dos botões do vendedor (queimados nos assets; aqui em SVG para
   escalar em qualquer largura sobre as placas 9-slice). */
const SVG_SWORDS = '<svg class="bz-bico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 3 3 3.2l.2 3.3 9 9 1.8-1.8zM17.5 3 21 3.2l-.2 3.3-4.6 4.6-1.7-1.8zM3.6 17.1l2.3-2.3 1.8 1.8-2.3 2.3.7.7-1.4 1.4-2.9-2.9 1.4-1.4zM20.4 17.1l-2.3-2.3-1.8 1.8 2.3 2.3-.7.7 1.4 1.4 2.9-2.9-1.4-1.4z"/></svg>';
const SVG_LINK = '<svg class="bz-bico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 12h6M8.5 8H7a4 4 0 0 0 0 8h1.5M15.5 8H17a4 4 0 0 1 0 8h-1.5"/></svg>';
const SVG_WARN = '<svg class="bz-bico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 20h20zM12 10v4M12 17h.01"/></svg>';

/* Data relativa curta a partir de AAAA-MM-DD. */
function tempoRelativo(iso) {
  if (!iso) return "";
  const dias = Math.floor((Date.now() - new Date(iso + "T12:00:00").getTime()) / 86400000);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 30) return `há ${dias} dias`;
  const meses = Math.floor(dias / 30);
  return meses === 1 ? "há 1 mês" : `há ${meses} meses`;
}

/* Estrelas cheias/vazias para a nota do vendedor. */
function estrelasHTML(nota) {
  const cheias = Math.round(nota);
  return `<span class="bz-stars" aria-label="${nota.toLocaleString("pt-BR")} de 5">${
    "★".repeat(cheias)}${"☆".repeat(5 - cheias)}</span>`;
}

/* Painel "Sobre o vendedor". */
function vendedorHTML(a) {
  if (!a.vendedor) return "";
  const avatar = a.vendedorAvatar
    ? `<img src="${esc(a.vendedorAvatar)}" alt="">`
    : `<span class="bz-avatar-placeholder" aria-hidden="true">${ico("info")}</span>`;

  const reputacao = a.vendedorNota
    ? `<div class="bz-seller-rep">${estrelasHTML(a.vendedorNota)}
         <b>${a.vendedorNota.toLocaleString("pt-BR")}</b>
         ${a.vendedorVendas ? `<span>(${a.vendedorVendas.toLocaleString("pt-BR")})</span>` : ""}
       </div>` : "";
  const vendas = a.vendedorVendas
    ? `<p class="bz-seller-line">🏆 ${a.vendedorVendas.toLocaleString("pt-BR")} vendas realizadas</p>` : "";
  const resposta = a.vendedorResposta
    ? ` · Responde em ${esc(a.vendedorResposta)}` : "";

  return `
    <div class="bz-panel bz-seller-card">
      <h2 class="bz-panel-title">Sobre o vendedor</h2>
      <div class="bz-seller-head">
        <div class="bz-avatar">${avatar}<span class="bz-crown" aria-hidden="true">♛</span></div>
        <div>
          <div class="bz-seller-name">
            ${esc(a.vendedor)}
            <span class="bz-seller-level">LVL 12</span>
            ${a.vendedorVerificado ? '<span class="bz-seller-verified" title="Vendedor verificado">✓</span>' : ""}
          </div>
          ${reputacao}
          <p class="bz-seller-since">Membro desde 2023 · VP Bazaar</p>
        </div>
      </div>
      <div class="bz-seller-stats">
        <div><b>${(a.vendedorVendas || 0).toLocaleString("pt-BR")}</b><span>Vendas</span></div>
        <div><b>98%</b><span>Conclusão</span></div>
        <div><b>${esc(a.vendedorResposta || "~5 min")}</b><span>Resposta</span></div>
      </div>
      <p class="bz-online ${a.vendedorOnline ? "" : "off"}">
        ${a.vendedorOnline ? "Online agora" : "Offline"} <i>·</i> <a href="perfil.html?user=${encodeURIComponent(a.vendedor)}">Ver perfil →</a>
      </p>

      <div class="bz-actions">
        ${a.status === "vendido" ? '<p class="bz-encerrado">Este anúncio já foi concluído.</p>' : `
          <button class="bz-btn-negociar" type="button" data-negociar="${esc(a.id)}">
            ${SVG_SWORDS}<span>Negociar agora</span>
          </button>
          <div class="bz-actions-row">
            <button class="bz-btn-compartilhar" type="button" data-compartilhar>
              ${SVG_LINK}<span>Compartilhar</span>
            </button>
            <button class="bz-btn-denunciar" type="button" data-denunciar>
              ${SVG_WARN}<span>Denunciar</span>
            </button>
          </div>`}
      </div>
    </div>`;
}

/* Grade de especificações do Pokémon (esquerda) + IVs (direita). */
function fichaPokemonHTML(a) {
  if (a.tipo && a.tipo !== "pokemon") return "";
  const ivTotal = a.ivs.length === 6 ? a.ivs.reduce((s, v) => s + Number(v || 0), 0) : null;
  const linhas = [
    ["nivel", "Nível", a.nivel ? String(a.nivel) : ""],
    ["natureza", "Natureza", a.natureza],
    ["forma", "Forma", a.forma],
    ["disponivel-troca", "Disponível para", a.disponibilidade || (a.intencao === "compra" ? "Compra" : (a.aceitaTroca ? "Venda e Troca" : "Venda"))]
  ].filter(([, , v]) => v);

  /* coluna direita: os seis IVs, cada um com seu ícone */
  const IV_ICON = ["hp-iv", "ataque-iv", "defesa-iv", "ataque-especial-iv", "defesa-especial-iv", "velocidade-iv"];
  const ivs = a.ivs.length === 6
    ? a.ivs.map((v, i) =>
        `<div class="bz-spec-row">${fico(IV_ICON[i])}<span>${IV_NOMES[i]} IV</span><strong>${v}</strong></div>`).join("")
    : "";

  if (!linhas.length && !ivs) return "";

  const moves = a.moves.length
    ? `<div class="bz-info-line">${fico("golpes")}<span class="bz-spec-key">Moves</span>
         <div class="bz-moves">${a.moves.map((m) => `<span class="bz-move">${esc(m)}</span>`).join("")}</div></div>` : "";

  const regras = a.regras
    ? `<div class="bz-sheet-rules">
         <b>Regras da negociação · observações do vendedor</b>
         <ul>${a.regras.split(/\r?\n/).filter((l) => l.trim())
           .map((l) => `<li>${esc(l.trim())}</li>`).join("")}</ul>
       </div>` : "";

  return `
    <div class="bz-subpanel">
      <div class="bz-sheet-heading">
        <h2 class="bz-subpanel-title">${ico("info")}Informações do Pokémon</h2>
        ${ivTotal !== null ? `<span class="bz-sheet-iv-total">${fico("iv-total")}IV total <b>${ivTotal}</b> / 192</span>` : ""}
      </div>
      <div class="bz-info-grid">
        <div class="bz-spec-list">
          ${linhas.map(([k, rot, v]) =>
            `<div class="bz-spec-row">${fico(k)}<span>${esc(rot)}</span><strong>${esc(v)}</strong></div>`).join("")}
        </div>
        ${ivs ? `<div class="bz-spec-list">${ivs}</div>` : ""}
      </div>
      ${moves}
      ${regras}
    </div>`;
}

function fichaNaoPokemonHTML(a) {
  if (a.tipo === "pokemon" || (!a.tipo && a.dex)) return "";
  const card = a.tipo === "shinycard";
  const quantidade = a.quantidade || 1;
  const esquerda = card
    ? [["Coleção","Shiny Cards"],["Tipo","Colecionável"],["Unidade",String(quantidade)]]
    : [["Categoria",a.categoria || "Item"],["Quantidade",String(quantidade)],["Empilhável",quantidade > 1 ? "Sim" : "Não informado"]];
  const direita = card
    ? [["Origem","Abates da espécie"],["Entrega","In-game"],["Disponível para",a.intencao === "compra" ? "Compra" : "Venda"]]
    : [["Categoria",a.categoria || "Item"],["Entrega","In-game"],["Disponível para",a.intencao === "compra" ? "Compra" : "Venda"]];
  const coluna = (linhas) => `<div>${linhas.map(([k,v]) =>
    `<div class="bz-nonpoke-row"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join("")}</div>`;
  return `<div class="bz-subpanel">
    <h2 class="bz-subpanel-title">${card ? "Detalhes da Shiny Card" : "Detalhes do item"}</h2>
    <div class="bz-nonpoke-details">
      ${coluna(esquerda)}<div class="bz-nonpoke-divider"></div>${coluna(direita)}
    </div>
  </div>`;
}

function renderDetalhe() {
  const alvo = $("[data-detalhe]");
  const id = new URLSearchParams(location.search).get("id");
  const a = todos.find((x) => x.id === id);

  if (!a) {
    alvo.innerHTML = `
      <div class="bz-empty" style="margin-top:40px">
        <strong>Anúncio não encontrado</strong>
        <p>Ele pode ter sido concluído ou removido. Volte ao marketplace para ver o que está disponível.</p>
        <a class="btn-icon-label btn-twitch" href="index.html">Voltar ao marketplace</a>
      </div>`;
    return;
  }

  document.title = `${a.titulo} — VP Bazaar`;
  const vendido = a.status === "vendido";
  const preco = precoTexto(a);
  const ehPokemon = !a.tipo || a.tipo === "pokemon";
  const kind = a.tipo === "shinycard" ? "shinycard" : a.tipo === "item" ? "item" : "pokemon";
  const qualidadeLabel = etiquetaQualidade(a.qualidade);
  const qualidadeNumero = qualidadeTexto(a.qualidade);
  const ivTotal = ehPokemon && a.ivs.length === 6
    ? a.ivs.reduce((s, v) => s + Number(v || 0), 0)
    : null;

  const arte = a.dex
    ? `<img src="${spriteUrl(a.dex)}" alt="${esc(a.titulo)}" class="bz-hero-sprite" data-fallback>`
    : a.img
      ? `<img src="${esc(a.img)}" alt="${esc(a.titulo)}" class="bz-hero-sprite">`
      : '<span class="bz-noart" aria-hidden="true">VP</span>';

  const precoBloco = a.preco
    ? (a.moeda === "diamonds"
        ? `<img src="/assets/bazaar/anuncio-diamond.png" alt="diamonds"><b>${a.preco.toLocaleString("pt-BR")}</b><span>Diamonds</span>`
        : `<b>${esc(window.vpBRL(a.preco))}</b>`)
    : '<b class="combinar">Preço a combinar</b>';

  /* faixa de especificações com ícones reais (Nível / Nature / Raridade) */
  const stripItems = [
    ["nivel", "Nível", ehPokemon && a.nivel ? String(a.nivel) : ""],
    ["natureza", "Nature", ehPokemon ? a.natureza : ""],
    ["iv-total", "IV Total", ivTotal !== null ? `${ivTotal} / 192` : ""],
    ["raridade-shiny", "Qualidade", ehPokemon ? qualidadeLabel : "", qualidadeNumero]
  ].filter(([, , v]) => v);

  /* similares: mesma categoria ou tipo primeiro; completa com o resto até 12 */
  const relacionados = anuncios.filter((x) => x.id !== a.id &&
    (x.categoria === a.categoria || x.tipos.some((t) => a.tipos.includes(t))));
  const resto = anuncios.filter((x) => x.id !== a.id && !relacionados.includes(x));
  const similares = [...relacionados, ...resto].slice(0, 12);

  alvo.innerHTML = `
    <nav class="bz-breadcrumb" aria-label="Trilha">
      <a href="index.html">Início</a> <span>›</span>
      <a href="index.html">Anúncios</a> <span>›</span>
      ${a.categoria ? `<a href="index.html?categoria=${encodeURIComponent(a.categoria)}">${esc(a.categoria)}</a> <span>›</span>` : ""}
      <em>${esc(a.titulo)}</em>
    </nav>

    <div class="bz-detalhe kind-${kind}">
      <!-- coluna da imagem -->
      <div class="bz-gallery">
        <div class="bz-panel bz-hero-art">
        <div class="bz-hero-plates">
          ${a.destaque ? '<span class="bz-plate destaque">Destaque</span>' : ""}
          ${a.shiny ? '<span class="bz-plate shiny">Shiny</span>' : ""}
        </div>
        <button class="bz-art-share" type="button" data-compartilhar aria-label="Compartilhar anúncio">↗</button>
        ${!ehPokemon ? `<span class="bz-kind-badge">${kind === "shinycard" ? "Colecionável" : (a.intencao === "compra" ? "Procura-se" : "À venda")}</span>` : ""}
        ${arte}
        ${ehPokemon ? `<span class="bz-art-quality">${esc(a.forma || (a.shiny ? "Shiny" : "Normal"))}${a.nivel ? ` <b>Nv. ${a.nivel}</b>` : ""}</span>` : ""}
        </div>
        ${ehPokemon ? `<div class="bz-thumbnails" aria-label="Galeria do anúncio">
          <button type="button" aria-label="Imagem anterior">‹</button>
          <div>
            ${[0,1,2,3].map((_, i) => `<span class="${i === 0 ? "active" : ""}">${arte}</span>`).join("")}
          </div>
          <button type="button" aria-label="Próxima imagem">›</button>
        </div>` : `<div class="bz-gallery-stats">
          <div><b>${a.quantidade || 1}</b><span>${kind === "shinycard" ? "Unidade" : "Unidades"}</span></div>
          <div><b>${a.moeda === "diamonds" ? "◆ " : ""}${a.preco ? a.preco.toLocaleString("pt-BR") : "—"}</b><span>Valor</span></div>
          <div><b>${esc(a.categoria || "Item")}</b><span>Categoria</span></div>
        </div>`}
      </div>

      <!-- coluna central: painéis emoldurados empilhados -->
      <div class="bz-detalhe-main">
        <div class="bz-subpanel bz-head">
          <div class="bz-head-top">
            <div>
              <h1 class="bz-detalhe-title">
                ${esc(a.titulo)}${a.shiny ? ' <span class="bz-star" aria-label="Shiny">★</span>' : ""}
              </h1>
              ${tiposHTML(a.tipos)}
            </div>
            <p class="bz-status">
              <small>Anúncio</small>
              <span><i class="bz-status-dot ${vendido ? "off" : ""}"></i>${vendido ? "Encerrado" : "Ativo"}</span>
              ${a.criadoEm ? `<time>Publicado ${tempoRelativo(a.criadoEm)}</time>` : ""}
            </p>
          </div>

          ${stripItems.length ? `<div class="bz-strip bz-strip-${stripItems.length}">
            ${stripItems.map(([k, rot, v, detalhe]) =>
              `<div class="bz-strip-item">${fico(k)}<div><span>${esc(rot)}</span><strong>${esc(v)}${detalhe ? ` <small>${esc(detalhe)}</small>` : ""}</strong></div></div>`).join("")}
          </div>` : ""}

        </div>

        <div class="bz-subpanel bz-price-panel">${precoBloco}
          ${a.negociavel && !vendido ? '<span class="bz-price-tag"><b>Aceita propostas</b><small>Venda e troca</small></span>' : ""}
        </div>

        ${a.descricao ? `<div class="bz-subpanel">
          <h2 class="bz-subpanel-title">${ico("descricao")}Descrição do anúncio</h2>
          <p class="bz-desc">${esc(a.descricao)}</p>
        </div>` : ""}

        ${ehPokemon ? fichaPokemonHTML(a) : fichaNaoPokemonHTML(a)}

      </div>

      <!-- coluna do vendedor -->
      <aside class="bz-detalhe-side">
        ${vendedorHTML(a)}

        <div class="bz-panel bz-alerta">
          <h2 class="bz-panel-title">Compre com segurança</h2>
          <div class="bz-safe-list">
            <div><i>↻</i><p><b>Negocie pelos canais oficiais</b><span>Toda a conversa acontece dentro da plataforma.</span></p></div>
            <div><i>♙</i><p><b>Não pague fora do combinado</b><span>Use o intermédio da VP em valores altos.</span></p></div>
            <div><i>✦</i><p><b>Confira reputação e histórico</b><span>Avaliações e vendas anteriores do vendedor.</span></p></div>
          </div>
          <a class="bz-safe-link" href="como-funciona.html#seguranca">Ver dicas de segurança →</a>
        </div>
      </aside>
    </div>

    ${similares.length ? `<section class="bz-similar">
      <div class="bz-similar-head">
        <h2 class="section-title">Anúncios semelhantes</h2>
        <div class="bz-carousel-nav">
          <a href="index.html">Ver todos</a>
          <button class="bz-arrow prev" type="button" data-carousel-prev aria-label="Ver anteriores"></button>
          <button class="bz-arrow next" type="button" data-carousel-next aria-label="Ver próximos"></button>
        </div>
      </div>
      <div class="bz-carousel" data-carousel>
        <div class="bz-carousel-track" data-similares></div>
      </div>
    </section>` : ""}`;

  if (similares.length) {
    $("[data-similares]").innerHTML = similares.map(cardSemelhanteHTML).join("");
    ligarCarrossel(alvo);
  }

  /* fallback do sprite grande */
  alvo.addEventListener("error", (e) => {
    const img = e.target;
    if (img.tagName !== "IMG" || !img.hasAttribute("data-fallback")) return;
    img.removeAttribute("data-fallback");
    img.replaceWith(Object.assign(document.createElement("span"), {
      className: "bz-noart", textContent: "VP", ariaHidden: "true"
    }));
  }, true);

  $$("[data-compartilhar]", alvo).forEach((button) => button.addEventListener("click", () => abrirCompartilhamento(a)));
  $$("[data-denunciar]", alvo).forEach((button) => button.addEventListener("click", () => abrirDenuncia(a)));
  $("[data-negociar]", alvo)?.addEventListener("click", async () => {
    const conta = await window.VPConta.exigirConta();
    if (!conta) return;
    try {
      const response = await fetch("/api/bazaar/chat", {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start", adId: a.id, title: a.titulo, seller: a.vendedor,
          image: a.imagem || "", price: a.preco || 0, currency: a.moeda || "diamante",
          details: [a.nivel ? `Nv. ${a.nivel}` : "", a.qualidadeRotulo || "", a.ivTotal ? `IV ${a.ivTotal}/192` : ""].filter(Boolean).join(" · ")
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível iniciar a conversa.");
      location.href = `chat.html?id=${encodeURIComponent(data.conversation.id)}`;
    } catch (error) { alert(error.message); }
  });
}

/* Carrossel de "Anúncios semelhantes": setas rolam a trilha; desabilita nas pontas. */
function ligarCarrossel(alvo) {
  const trilha = $("[data-similares]", alvo);
  const prev = $("[data-carousel-prev]", alvo);
  const next = $("[data-carousel-next]", alvo);
  if (!trilha || !prev || !next) return;

  const passo = () => Math.max(240, trilha.clientWidth * 0.8);
  const sync = () => {
    const fim = trilha.scrollWidth - trilha.clientWidth - 2;
    prev.disabled = trilha.scrollLeft <= 2;
    next.disabled = trilha.scrollLeft >= fim;
  };

  prev.addEventListener("click", () => trilha.scrollBy({ left: -passo(), behavior: "smooth" }));
  next.addEventListener("click", () => trilha.scrollBy({ left: passo(), behavior: "smooth" }));
  trilha.addEventListener("scroll", sync, { passive: true });
  sync();
}

/* Toast simples reutilizado na página do anúncio. */
function toast(msg) {
  let el = $(".bz-toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "bz-toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 2200);
}

function fecharDialog() {
  document.querySelector(".bz-action-overlay")?.remove();
}

function abrirCompartilhamento(a) {
  fecharDialog();
  const url = `${location.origin}/api/bazaar/share?id=${encodeURIComponent(a.id)}`;
  const valor = a.moeda === "pix"
    ? `R$ ${Number(a.preco || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    : `◆ ${Number(a.preco || 0).toLocaleString("pt-BR")}`;
  const nivel = a.nivel ? `Lv. ${a.nivel}` : "";
  const qualidade = [a.qualidadeRotulo, a.qualidade].filter(Boolean).join(" ");
  const iv = a.ivTotal ? `IV ${a.ivTotal}/192` : "";
  const texto = [a.titulo.toUpperCase(), [nivel, qualidade, iv].filter(Boolean).join(" · "), `${valor}${a.aceitaPropostas ? " — aceita propostas" : ""}`, url].filter(Boolean).join("\n");
  const overlay = document.createElement("div");
  overlay.className = "bz-action-overlay";
  overlay.innerHTML = `<section class="bz-action-modal" role="dialog" aria-modal="true" aria-labelledby="bz-share-title">
    <button class="bz-action-close" type="button" data-dialog-close aria-label="Fechar">×</button>
    <span class="bz-modal-title" id="bz-share-title">Compartilhar anúncio</span>
    <div class="bz-share-arrival"><header><b>Como chega para a pessoa</b><a href="${esc(url)}" target="_blank">Ver card →</a></header>
      <div class="bz-share-preview">${a.imagem ? `<img src="${esc(a.imagem)}" alt="">` : ""}<div><strong>${esc(a.titulo)}${a.nivel ? ` · Lv. ${esc(a.nivel)}` : ""}</strong><span>${qualidade ? `<em>${esc(qualidade)}</em>` : ""}${iv ? `<em class="iv">${esc(iv)}</em>` : ""}</span><small>${esc(location.host)} · ${esc(valor)}</small></div></div>
      <p>O link gera esse card automaticamente no WhatsApp, Discord e Telegram.</p>
    </div>
    <div class="bz-share-grid">
      <a class="whatsapp" href="https://wa.me/?text=${encodeURIComponent(texto)}" target="_blank" rel="noreferrer"><b><svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7a11.6 11.6 0 0 1-4.8-4.2c-.4-.5-1-1.4-1-2.7A2.9 2.9 0 0 1 7.3 7.5a1 1 0 0 1 .7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .6l-.4.5-.3.3c-.1.1-.2.3 0 .5a8.4 8.4 0 0 0 3.9 3.3c.3.1.4.1.6-.1l.9-1c.2-.2.3-.2.6-.1l2 1c.2.1.4.2.4.3a2 2 0 0 1-.3 1.1Z"></path></svg></b> WhatsApp</a>
      <a class="discord" href="https://discord.com/invite/9M3HCdytt" target="_blank" rel="noreferrer"><b><svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M19.3 5.4A16.9 16.9 0 0 0 15.1 4l-.2.4a15.6 15.6 0 0 1 3.7 1.5 13.1 13.1 0 0 0-11.2 0A15.6 15.6 0 0 1 11.1 4.4L10.9 4a16.9 16.9 0 0 0-4.2 1.4C4 9.4 3.3 13.2 3.6 17a17 17 0 0 0 5.1 2.6l1-1.7a11 11 0 0 1-1.7-.8l.4-.3a12.1 12.1 0 0 0 9.2 0l.4.3a11 11 0 0 1-1.7.8l1 1.7a17 17 0 0 0 5.1-2.6c.4-4.4-.6-8.2-3.1-11.6ZM9.5 14.7c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm5 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z"></path></svg></b> Discord</a>
      <a class="telegram" href="https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(texto.replace(`\n${url}`, ""))}" target="_blank" rel="noreferrer"><b><svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M21.7 4.3 2.9 11.6c-.9.4-.9 1.6.1 1.9l4.7 1.5 1.8 5.5c.3.8 1.3 1 1.8.3l2.6-3.1 4.8 3.5c.7.5 1.7.1 1.9-.7l3-14.4c.2-.9-.7-1.7-1.9-1.3ZM9.6 14.2l8.8-5.6-7.3 6.7-.3 3.3Z"></path></svg></b> Telegram</a>
      <a class="twitter" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}" target="_blank" rel="noreferrer"><b><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 3h3.2l-7 8 8.2 10h-6.4l-5-6.1L4.7 21H1.5l7.5-8.6L1.2 3h6.6l4.5 5.6Zm-1.1 16h1.8L7.7 4.8H5.8Z"></path></svg></b> X / Twitter</a>
    </div>
    <div class="bz-share-link"><input value="${esc(url)}" readonly><button type="button" data-copy-link>Copiar</button></div>
    <p class="bz-share-footnote">O link abre o anúncio com imagem, preço e vendedor — funciona mesmo se o anúncio for pausado.</p>
  </section>`;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", async (event) => {
    if (event.target === overlay || event.target.closest("[data-dialog-close]")) return fecharDialog();
    if (event.target.closest("[data-copy-link]")) {
      await navigator.clipboard.writeText(url); toast("Link copiado!"); fecharDialog();
    }
  });
}

async function abrirDenuncia(a) {
  const conta = await window.VPConta.exigirConta();
  if (!conta) return;
  fecharDialog();
  const motivos = ["Anúncio falso ou enganoso", "Preço ou informações incorretas", "Item proibido ou duplicado", "Tentativa de golpe", "Outro motivo"];
  const overlay = document.createElement("div");
  overlay.className = "bz-action-overlay";
  overlay.innerHTML = `<section class="bz-action-modal bz-report-modal" role="dialog" aria-modal="true" aria-labelledby="bz-report-title">
    <button class="bz-action-close" type="button" data-dialog-close aria-label="Fechar">×</button>
    <span class="kicker">Moderação do Bazaar</span><h2 id="bz-report-title">Denunciar anúncio</h2>
    <p>A denúncia será enviada para a administração. O vendedor não recebe seus dados.</p>
    <form data-report-form>
      <fieldset><legend>Qual é o problema?</legend>${motivos.map((motivo, i) => `<label><input type="radio" name="reason" value="${esc(motivo)}" ${i === 0 ? "required" : ""}>${esc(motivo)}</label>`).join("")}</fieldset>
      <label class="bz-report-details">Detalhes <small>(opcional)</small><textarea name="details" maxlength="600" rows="4" placeholder="Explique o que aconteceu…"></textarea></label>
      <p class="bz-report-status" data-report-status hidden></p>
      <div class="bz-report-actions"><button type="button" data-dialog-close>Cancelar</button><button type="submit">Enviar denúncia</button></div>
    </form>
  </section>`;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay || event.target.closest("[data-dialog-close]")) fecharDialog();
  });
  overlay.querySelector("[data-report-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = overlay.querySelector("[data-report-status]");
    const submit = event.currentTarget.querySelector('[type="submit"]');
    submit.disabled = true; status.hidden = true;
    try {
      const body = Object.fromEntries(new FormData(event.currentTarget));
      const response = await fetch("/api/bazaar/report", {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, adId: a.id, title: a.titulo, seller: a.vendedor })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível enviar.");
      status.textContent = "Denúncia enviada. Obrigado por ajudar a comunidade.";
      status.className = "bz-report-status ok"; status.hidden = false;
      setTimeout(fecharDialog, 1500);
    } catch (error) {
      status.textContent = error.message; status.className = "bz-report-status";
      status.hidden = false; submit.disabled = false;
    }
  });
}

/* ---------------------------------------------- filtros: montagem e eventos */
/* Faixa de preço só vale dentro de uma moeda — "entre 100 e 500" não quer
   dizer nada se a lista mistura reais e diamonds. */
function travarFaixaDePreco() {
  const liberado = Boolean(filtros.moeda);
  ["min", "max"].forEach((chave) => {
    const campo = $(`[data-f-${chave}]`);
    campo.disabled = !liberado;
    if (!liberado) { campo.value = ""; filtros[chave] = ""; }
  });
  $("[data-preco-aviso]").hidden = liberado;
}

const debounce = (fn, ms) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};
const mudouFiltro = () => { filtros.page = 1; renderGrid(); };

/* posição (0–100%) de um valor de qualidade na escala 0,80–3,60 */
const posQualidade = (v) =>
  Math.max(0, Math.min(100, (v - QUAL_MIN) / (QUAL_MAX - QUAL_MIN) * 100));
const fmtQual = (v) => Number(v).toFixed(2).replace(".", ",");

function montarFiltros() {
  /* busca */
  $("[data-f-q]").addEventListener("input", debounce((e) => {
    filtros.q = e.target.value; mudouFiltro();
  }, 220));

  /* faixas numéricas diretas: preço, IV, nível e poder */
  [["min", "min"], ["max", "max"],
   ["ivMin", "iv-min"], ["ivMax", "iv-max"],
   ["nivelMin", "nivel-min"], ["nivelMax", "nivel-max"],
   ["poderMin", "poder-min"], ["poderMax", "poder-max"]].forEach(([chave, attr]) => {
    const el = $(`[data-f-${attr}]`);
    if (!el) return;
    el.addEventListener("input", debounce((e) => { filtros[chave] = e.target.value; mudouFiltro(); }, 280));
  });

  /* segmentados: tipo de anúncio, intenção e moeda */
  $$("[data-seg]").forEach((grupo) => {
    const chave = grupo.dataset.seg;
    grupo.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      filtros[chave] = btn.dataset.value;
      $$("button", grupo).forEach((b) => b.classList.toggle("on", b === btn));
      if (chave === "moeda") travarFaixaDePreco();
      mudouFiltro();
    });
  });

  montarQualidade();
  montarTipos();

  $("[data-f-sort]").addEventListener("change", (e) => { filtros.sort = e.target.value; mudouFiltro(); });
  $("[data-clear]").addEventListener("click", limparFiltros);

  $("[data-prev]").addEventListener("click", () => { filtros.page--; renderGrid(); window.scrollTo({ top: 0, behavior: "smooth" }); });
  $("[data-next]").addEventListener("click", () => { filtros.page++; renderGrid(); window.scrollTo({ top: 0, behavior: "smooth" }); });

  const toggle = $("[data-filter-toggle]");
  toggle.addEventListener("click", () => {
    const painel = $("[data-filters]");
    const fechado = painel.dataset.collapsed === "1";
    painel.dataset.collapsed = fechado ? "0" : "1";
    toggle.setAttribute("aria-expanded", String(fechado));
  });
}

/* ---- Qualidade: chips + escala + inputs, todos sincronizados ---- */
function montarQualidade() {
  const chips = $("[data-qual-chips]");
  chips.innerHTML = QUALIDADES.map((q) =>
    `<button type="button" class="bz-qual" data-qual data-lo="${q.lo}" data-hi="${q.hi}">
       <span class="dot" style="background:${q.ponto}"></span>${esc(q.nome)}
     </button>`).join("");

  /* clicar num chip define a faixa daquele tier; clicar de novo limpa */
  chips.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-qual]");
    if (!chip) return;
    const lo = chip.dataset.lo, hi = chip.dataset.hi;
    const igual = filtros.qualityMin === lo && filtros.qualityMax === hi;
    filtros.qualityMin = igual ? "" : lo;
    filtros.qualityMax = igual ? "" : hi;
    escreverInputsQualidade();
    sincronizarEscalaQualidade();
    mudouFiltro();
  });

  /* digitar aceita vírgula ou ponto e normaliza para número */
  [["qualityMin", "quality-min"], ["qualityMax", "quality-max"]].forEach(([chave, attr]) => {
    $(`[data-f-${attr}]`).addEventListener("input", debounce((e) => {
      const txt = e.target.value.trim().replace(",", ".");
      filtros[chave] = txt === "" || Number.isNaN(Number(txt)) ? "" : txt;
      sincronizarEscalaQualidade();
      mudouFiltro();
    }, 280));
  });

  sincronizarEscalaQualidade();
}

function escreverInputsQualidade() {
  $("[data-f-quality-min]").value = filtros.qualityMin === "" ? "" : fmtQual(filtros.qualityMin);
  $("[data-f-quality-max]").value = filtros.qualityMax === "" ? "" : fmtQual(filtros.qualityMax);
}

function sincronizarEscalaQualidade() {
  const filtrando = filtros.qualityMin !== "" || filtros.qualityMax !== "";
  const lo = filtros.qualityMin === "" ? QUAL_MIN : Number(filtros.qualityMin);
  const hi = filtros.qualityMax === "" ? QUAL_MAX : Number(filtros.qualityMax);
  const pLo = posQualidade(lo), pHi = posQualidade(hi);

  $("[data-qual-mask-lo]").style.cssText = `left:0;right:${(100 - pLo).toFixed(2)}%`;
  $("[data-qual-mask-hi]").style.cssText = `left:${pHi.toFixed(2)}%;right:0`;
  $("[data-qual-knob-lo]").style.left = `calc(${pLo.toFixed(2)}% - 5px)`;
  $("[data-qual-knob-hi]").style.left = `calc(${pHi.toFixed(2)}% - 6px)`;

  /* chip aceso quando sua faixa intersecta a faixa filtrada (bordas exclusivas) */
  $$("[data-qual]").forEach((chip) => {
    const clo = Number(chip.dataset.lo), chi = Number(chip.dataset.hi);
    chip.classList.toggle("on", filtrando && clo < hi && chi > lo);
  });
}

/* ---- Tipagem elementar: grade de ícones com múltipla seleção ---- */
function montarTipos() {
  const grid = $("[data-type-grid]");
  grid.innerHTML = TIPOS_ORDEM.map((t) =>
    `<button type="button" class="bz-type-cell" data-type="${t}" title="${esc(TYPE_LABEL[t] || t)}" aria-label="${esc(TYPE_LABEL[t] || t)}" aria-pressed="false">
       <i style="background-image:url(/assets/bazaar/types/${t}.webp)"></i>
     </button>`).join("");

  grid.addEventListener("click", (e) => {
    const cell = e.target.closest("[data-type]");
    if (!cell) return;
    const t = cell.dataset.type;
    const i = filtros.tipos.indexOf(t);
    if (i >= 0) filtros.tipos.splice(i, 1); else filtros.tipos.push(t);
    const ativo = filtros.tipos.includes(t);
    cell.classList.toggle("on", ativo);
    cell.setAttribute("aria-pressed", String(ativo));
    atualizarContadorTipos();
    mudouFiltro();
  });

  $("[data-type-count]").addEventListener("click", () => {
    filtros.tipos = [];
    $$("[data-type]", grid).forEach((c) => { c.classList.remove("on"); c.setAttribute("aria-pressed", "false"); });
    atualizarContadorTipos();
    mudouFiltro();
  });
}

function atualizarContadorTipos() {
  const count = $("[data-type-count]");
  const n = filtros.tipos.length;
  count.hidden = n === 0;
  count.textContent = n ? `${n} ativo${n > 1 ? "s" : ""}` : "";
}

function limparFiltros() {
  Object.assign(filtros, {
    q: "", tipo: "", intencao: "", moeda: "", jogo: "", categoria: "", negociacao: "",
    min: "", max: "", ivMin: "", ivMax: "", qualityMin: "", qualityMax: "",
    nivelMin: "", nivelMax: "", poderMin: "", poderMax: "", tipos: [], page: 1
  });
  $("[data-f-q]").value = "";
  ["min", "max", "iv-min", "iv-max", "nivel-min", "nivel-max",
   "poder-min", "poder-max", "quality-min", "quality-max"].forEach((k) => {
    const el = $(`[data-f-${k}]`); if (el) el.value = "";
  });
  $$("[data-seg]").forEach((grupo) => {
    $$("button", grupo).forEach((b) => b.classList.toggle("on", b.dataset.value === ""));
  });
  $$("[data-qual]").forEach((c) => c.classList.remove("on"));
  $$("[data-type]").forEach((c) => { c.classList.remove("on"); c.setAttribute("aria-pressed", "false"); });
  atualizarContadorTipos();
  sincronizarEscalaQualidade();
  travarFaixaDePreco();
  renderGrid();
}

/* Atalhos por link: /bazaar/?categoria=Itens */
function lerURL() {
  const p = new URLSearchParams(location.search);
  const categoria = p.get("categoria");
  const busca = p.get("q");
  if (categoria && bz.categorias.includes(categoria)) filtros.categoria = categoria;
  if (busca) filtros.q = busca;
}

function renderEstatisticas() {
  const numeros = {
    anuncios: anuncios.length,
    vendendo: anuncios.filter((a) => a.intencao === "venda").length,
    procurando: anuncios.filter((a) => a.intencao === "compra").length
  };
  Object.entries(numeros).forEach(([chave, valor]) => {
    const el = $(`[data-stat="${chave}"]`);
    if (el) el.textContent = valor.toLocaleString("pt-BR");
  });
}

/* ============================================================
   PÁGINA "ANUNCIAR" — monta a mensagem pronta do WhatsApp
   ============================================================ */
function montarFormulario() {
  const form = $("[data-anunciar-form]");
  if (!form) return;

  $("[data-a-jogo]").innerHTML = cfg.games.filter((g) => g.ativo)
    .map((g) => `<option value="${esc(g.nome)}">${esc(g.nome)}</option>`).join("");
  $("[data-a-servidor]").innerHTML = ['<option value="">Não se aplica</option>']
    .concat(bz.servidores.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`)).join("");
  $("[data-a-categoria]").innerHTML = bz.categorias
    .map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const dados = Object.fromEntries(new FormData(form).entries());
    const preco = dados.preco
      ? (dados.moeda === "diamonds"
          ? `${Number(dados.preco).toLocaleString("pt-BR")} diamonds`
          : window.vpBRL(Number(dados.preco)))
      : "a combinar";

    /* Uma informação por linha, sem linhas em branco: vpWaLink colapsa
       espaços repetidos, então "\n\n" viraria um espaço solto. */
    const linhas = [
      bz.msgAnunciar,
      `Tipo: ${dados.intencao === "compra" ? "Quero comprar" : "Quero vender"}`,
      `Título: ${dados.titulo}`,
      `Jogo: ${dados.jogo}`,
      dados.servidor ? `Servidor: ${dados.servidor}` : null,
      `Categoria: ${dados.categoria}`,
      `Preço: ${preco}`,
      `Aceita propostas: ${dados.negociavel ? "sim" : "não"}`,
      dados.contato ? `Meu nick/contato: ${dados.contato}` : null,
      dados.descricao ? `Descrição: ${dados.descricao}` : null
    ].filter((l) => l !== null);

    window.open(window.vpWaLink(cfg, linhas.join("\n")), "_blank", "noopener");
  });
}

/* ============================================================ */
(async function init() {
  ajustarMarca();
  cfg = await window.vpFetchConfig();
  bz = window.vpBazaar(cfg);
  bz.anuncios.forEach(normalizarAnuncio);
  /* "pausado" some do site; "vendido" sai da vitrine mas continua acessível
     pelo link direto do anúncio, que já pode ter circulado no WhatsApp.
     Os anúncios locais do usuário entram junto (Fase 2). */
  const oficiais = bz.anuncios.filter((a) => a.status !== "pausado");
  const locais = carregarLocais().filter((a) => a.status !== "pausado");
  todos = oficiais.concat(locais);
  anuncios = todos.filter((a) => a.status === "ativo");

  montarComuns();
  montarFormulario();

  /* página do anúncio */
  if ($("[data-detalhe]")) { renderDetalhe(); return; }

  if (!$("[data-grid]")) return;   // demais páginas sem marketplace

  lerURL();
  montarFiltros();
  travarFaixaDePreco();
  $("[data-f-q]").value = filtros.q;
  renderEstatisticas();
  renderGrid();
})();
