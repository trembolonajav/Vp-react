/* Validação/sanitização server-side de tudo que o painel salva.
   Mesmo autenticado, nada entra no armazenamento sem passar por aqui:
   tipos certos, limites de tamanho, URLs com esquema seguro e
   strings sem < > (defesa extra contra XSS além do escape no frontend). */

import { ICON_KEYS, TYPE_KEYS } from "./defaults.mjs";

const str = (v, max) => String(v ?? "").replace(/[<>]/g, "").trim().slice(0, max);

const num = (v, min, max, decimals = 2) => {
  let n = Number(v);
  if (!Number.isFinite(n)) n = min;
  n = Math.min(max, Math.max(min, n));
  return Number(n.toFixed(decimals));
};

const int = (v, min, max) => Math.round(num(v, min, max, 0));

/* Imagens: só caminhos do próprio site, uploads locais ou https. */
function imgUrl(v) {
  const s = String(v ?? "").trim().slice(0, 800);
  if (/^assets\/[\w\-./]+$/i.test(s)) return s;
  if (/^\/uploads\/[\w\-.]+$/i.test(s)) return s;
  if (/^https:\/\/[^\s"'<>]+$/i.test(s)) return s;
  return "";
}

/* Links de navegação: https, http, página interna ou âncora. */
function linkUrl(v) {
  const s = String(v ?? "").trim().slice(0, 500);
  if (s === "") return "";
  if (/^https?:\/\/[^\s"'<>]+$/i.test(s)) return s;
  if (/^[\w\-./]+\.html([?#][^\s"'<>]*)?$/i.test(s)) return s;
  if (/^#[\w-]*$/.test(s)) return s;
  return "";
}

/* Lista de rótulos curtos (servidores, categorias): sem duplicados nem vazios. */
function labelList(input, max, maxLen = 40) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of input.slice(0, max)) {
    const label = str(raw, maxLen);
    const key = label.toLowerCase();
    if (!label || seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
}

const INTENCOES = ["venda", "compra"];
const MOEDAS = ["brl", "diamonds"];
const STATUS = ["ativo", "pausado", "vendido"];

/* Anúncios do VP Bazaar. `games` já sanitizado: o jogo do anúncio precisa
   apontar para um jogo existente, senão os filtros ficam com opções órfãs. */
function sanitizeBazaar(input, games) {
  const src = input && typeof input === "object" ? input : {};
  const out = {
    ativo: src.ativo === undefined ? true : Boolean(src.ativo),
    msgInteresse: str(src.msgInteresse, 300) || "Olá! Tenho interesse no anúncio {titulo} (#{id}).",
    msgAnunciar: str(src.msgAnunciar, 300) || "Olá! Quero anunciar um item no marketplace.",
    servidores: labelList(src.servidores, 40),
    categorias: labelList(src.categorias, 40)
  };

  const gameIds = new Set(games.map((g) => g.id));
  const fallbackGame = games[0]?.id || "";
  const servidores = new Set(out.servidores.map((s) => s.toLowerCase()));
  const categorias = new Set(out.categorias.map((c) => c.toLowerCase()));
  const anuncioIds = new Set();

  if (!Array.isArray(src.anuncios)) {
    out.anuncios = [];
    return out;
  }

  out.anuncios = src.anuncios.slice(0, 300).map((a, i) => {
    let id = String(a?.id ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40);
    if (!id) id = `anuncio-${i + 1}`;
    while (anuncioIds.has(id)) id += "x";
    anuncioIds.add(id);

    const titulo = str(a?.titulo, 90);
    if (!titulo) throw new Error(`Anúncio ${i + 1}: título obrigatório.`);

    const jogo = gameIds.has(a?.jogo) ? a.jogo : fallbackGame;

    /* Servidor e categoria só valem se existirem na taxonomia salva. */
    const servidor = str(a?.servidor, 40);
    const categoria = str(a?.categoria, 40);

    return {
      id,
      titulo,
      jogo,
      servidor: servidores.has(servidor.toLowerCase()) ? servidor : "",
      categoria: categorias.has(categoria.toLowerCase()) ? categoria : "",
      intencao: INTENCOES.includes(a?.intencao) ? a.intencao : "venda",
      moeda: MOEDAS.includes(a?.moeda) ? a.moeda : "brl",
      preco: num(a?.preco, 0, 10000000),
      negociavel: Boolean(a?.negociavel),
      destaque: Boolean(a?.destaque),
      status: STATUS.includes(a?.status) ? a.status : "ativo",
      img: imgUrl(a?.img),
      descricao: str(a?.descricao, 1200),
      vendedor: str(a?.vendedor, 60),
      criadoEm: /^\d{4}-\d{2}-\d{2}$/.test(a?.criadoEm) ? a.criadoEm : "",

      /* ---- ficha do card ---- */
      /* dex > 0 faz o card usar o sprite da espécie no lugar de `img` */
      dex: int(a?.dex, 0, 1025),
      nivel: int(a?.nivel, 0, 100),
      tipos: Array.isArray(a?.tipos)
        ? [...new Set(a.tipos.filter((t) => TYPE_KEYS.includes(t)))].slice(0, 2)
        : [],
      shiny: Boolean(a?.shiny),
      quantidade: int(a?.quantidade, 0, 1000000),
      aceitaTroca: Boolean(a?.aceitaTroca),

      /* ---- ficha detalhada (página do anúncio; tudo opcional) ---- */
      natureza: str(a?.natureza, 40),
      habilidade: str(a?.habilidade, 40),
      genero: ["macho", "femea", "sem"].includes(a?.genero) ? a.genero : "",
      forma: str(a?.forma, 40),
      qualidade: num(a?.qualidade, 0, 999, 3),
      disponibilidade: ["Venda", "Troca", "Venda e Troca"].includes(a?.disponibilidade) ? a.disponibilidade : "",
      /* IVs: ou os 6 valores (HP, Atq, Def, AtqEsp, DefEsp, Vel) ou nada */
      ivs: Array.isArray(a?.ivs) && a.ivs.length === 6
        ? a.ivs.map((v) => int(v, 0, 32))
        : [],
      moves: Array.isArray(a?.moves)
        ? a.moves.map((m) => str(m, 40)).filter(Boolean).slice(0, 4)
        : [],
      regras: str(a?.regras, 800),

      /* ---- reputação do anunciante (manual nesta fase, sem contas) ---- */
      vendedorVerificado: Boolean(a?.vendedorVerificado),
      vendedorOnline: Boolean(a?.vendedorOnline),
      vendedorNota: num(a?.vendedorNota, 0, 5, 1),
      vendedorVendas: int(a?.vendedorVendas, 0, 999999),
      vendedorResposta: str(a?.vendedorResposta, 40),
      vendedorAvatar: imgUrl(a?.vendedorAvatar)
    };
  });

  return out;
}

export function sanitizeConfig(input) {
  if (!input || typeof input !== "object") throw new Error("config inválida");

  const out = {};

  out.whatsapp = String(input.whatsapp ?? "").replace(/\D/g, "").slice(0, 15);
  if (out.whatsapp.length < 10) throw new Error("Número de WhatsApp inválido (use 55 + DDD + número).");

  out.msgNegociar = str(input.msgNegociar, 300) || "Olá! Quero negociar.";

  /* ---- banners ---- */
  if (!Array.isArray(input.banners)) throw new Error("banners inválidos");
  out.banners = input.banners.slice(0, 10).map((b, i) => {
    const img = imgUrl(b?.img);
    if (!img) throw new Error(`Banner ${i + 1}: imagem inválida.`);
    return { img, alt: str(b?.alt, 200), link: linkUrl(b?.link) };
  });

  /* ---- jogos ---- */
  if (!Array.isArray(input.games)) throw new Error("jogos inválidos");
  const ids = new Set();
  out.games = input.games.slice(0, 20).map((g, i) => {
    let id = String(g?.id ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40);
    if (!id) id = `jogo-${i + 1}`;
    while (ids.has(id)) id += "x";
    ids.add(id);

    const img = imgUrl(g?.img);
    if (!img) throw new Error(`Jogo "${g?.nome || i + 1}": arte do card inválida.`);

    const min = int(g?.min, 1, 1000000);
    const max = int(g?.max, 1, 1000000);

    return {
      id,
      nome: str(g?.nome, 80),
      item: str(g?.item, 80) || "Itens",
      unidade: str(g?.unidade, 40) || "item",
      botao: str(g?.botao, 80) || str(g?.nome, 80),
      img,
      icone: imgUrl(g?.icone),
      precoCompra: num(g?.precoCompra, 0, 100000),
      precoVenda: num(g?.precoVenda, 0, 100000),
      min: Math.min(min, max),
      max: Math.max(min, max),
      ativo: Boolean(g?.ativo)
    };
  });

  /* ---- VP Bazaar ---- */
  out.bazaar = sanitizeBazaar(input.bazaar, out.games);

  /* ---- contatos ---- */
  if (!Array.isArray(input.contatos)) throw new Error("contatos inválidos");
  out.contatos = input.contatos.slice(0, 20).map((c) => ({
    icone: ICON_KEYS.includes(c?.icone) ? c.icone : "site",
    nome: str(c?.nome, 40),
    info: str(c?.info, 120),
    url: linkUrl(c?.url)
  }));

  /* trava de tamanho total (config vai para o Blob como JSON) */
  if (JSON.stringify(out).length > 900 * 1024) {
    throw new Error("Configuração grande demais — use imagens enviadas pelo botão de upload, não coladas.");
  }

  return out;
}
