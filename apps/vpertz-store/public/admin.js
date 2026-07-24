/* ============================================================
   VP STORE — painel do administrador (fala com /api)
   Login por sessão (cookie HttpOnly). As mudanças são salvas
   no servidor e valem para todos os visitantes na hora.
   ============================================================ */

let cfg = null;
let dirty = false;
let activeTab = "banners";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const panel = () => $("#panel");
const esc = vpEsc;

/* ---------------------------------------------- API */
async function api(path, opts = {}) {
  const res = await fetch(path, { credentials: "same-origin", ...opts });
  let data = null;
  try { data = await res.json(); } catch (e) { /* respostas sem corpo */ }
  return { ok: res.ok, status: res.status, data };
}

/* ---------------------------------------------- UI básica */
function toast(msg, kind = "ok") {
  const t = $("#toast");
  t.textContent = msg;
  t.className = `toast show ${kind}`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 3800);
}

function markDirty() { dirty = true; }

window.addEventListener("beforeunload", (e) => {
  if (dirty) { e.preventDefault(); e.returnValue = ""; }
});

/* Sobe a imagem para o servidor e devolve a URL pública. */
function pickImage(cb) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/png,image/jpeg,image/webp,image/gif";
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) {
      toast("Imagem muito pesada (máx. 2,5MB). Comprima antes — WebP é o ideal.", "err");
      return;
    }
    toast("Enviando imagem…");
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { toast(data.error || "Falha no envio da imagem.", "err"); return; }
    cb(data.url);
  };
  input.click();
}

function move(arr, i, delta) {
  const j = i + delta;
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  markDirty();
  render();
}

function bindFields(scope, getTarget) {
  $$("[data-bind]", scope).forEach((el) => {
    el.addEventListener("input", () => {
      const target = getTarget(el);
      if (!target) return;
      const key = el.dataset.bind;
      let value = el.type === "checkbox" ? el.checked : el.value;
      if (el.dataset.type === "number") value = Number(value) || 0;
      if (el.dataset.type === "digits") value = value.replace(/\D/g, "");
      /* lista separada por vírgula (servidores, categorias do bazaar) */
      if (el.dataset.type === "list") {
        value = value.split(",").map((v) => v.trim()).filter(Boolean);
      }
      /* IVs: "31/31/31/31/31/29" -> [31,...]; qualquer coisa diferente de 6 números limpa */
      if (el.dataset.type === "ivs") {
        const nums = value.split(/[\/\s,]+/).map(Number).filter((n) => Number.isFinite(n));
        value = nums.length === 6 ? nums.map((n) => Math.min(31, Math.max(0, Math.round(n)))) : [];
      }
      target[key] = value;
      markDirty();
    });
  });
}

/* ---------------------------------------------- seções */
function renderBanners() {
  panel().innerHTML = cfg.banners.map((b, i) => `
    <div class="a-card" data-i="${i}">
      <div class="a-card-head">
        <img class="a-thumb banner" src="${esc(b.img)}" alt="">
        <div class="a-title">Banner ${i + 1}</div>
        <div class="order">
          <button class="mini-btn" data-act="up" title="Mover para cima" ${i === 0 ? "disabled" : ""}>↑</button>
          <button class="mini-btn" data-act="down" title="Mover para baixo" ${i === cfg.banners.length - 1 ? "disabled" : ""}>↓</button>
        </div>
      </div>
      <div class="a-row">
        <div class="a-field">
          <label>Descrição (texto alternativo)</label>
          <input type="text" data-bind="alt" value="${esc(b.alt)}" placeholder="Ex.: Sorteio semanal de 50 diamantes">
        </div>
        <div class="a-field">
          <label>Link ao clicar</label>
          <input type="text" data-bind="link" value="${esc(b.link)}" placeholder="https://… ou contato.html">
          <div class="sub">Pode ser um endereço externo ou uma página do site.</div>
        </div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="a-btn small" data-act="img">Trocar imagem</button>
        <button class="a-btn small danger" data-act="del">Remover banner</button>
      </div>
    </div>`).join("") + `
    <button class="a-btn a-add" id="add-banner">+ Adicionar banner</button>`;

  bindFields(panel(), (el) => cfg.banners[+el.closest(".a-card").dataset.i]);

  $$(".a-card [data-act]", panel()).forEach((btn) => {
    const i = +btn.closest(".a-card").dataset.i;
    btn.addEventListener("click", () => {
      const act = btn.dataset.act;
      if (act === "up") move(cfg.banners, i, -1);
      if (act === "down") move(cfg.banners, i, 1);
      if (act === "del") {
        if (confirm("Remover este banner?")) { cfg.banners.splice(i, 1); markDirty(); render(); }
      }
      if (act === "img") pickImage((url) => { cfg.banners[i].img = url; markDirty(); render(); });
    });
  });

  $("#add-banner").addEventListener("click", () =>
    pickImage((url) => {
      cfg.banners.push({ img: url, alt: "", link: "" });
      markDirty(); render();
      toast("Banner adicionado — preencha a descrição e o link, depois salve.");
    }));
}

function renderJogos() {
  panel().innerHTML = cfg.games.map((g, i) => `
    <div class="a-card ${g.ativo ? "" : "disabled"}" data-i="${i}">
      <div class="a-card-head">
        <img class="a-thumb" src="${esc(g.img)}" alt="">
        <div>
          <div class="a-title">${esc(g.nome) || "Novo jogo"}</div>
          <label class="a-check" style="margin-top:6px">
            <input type="checkbox" data-bind="ativo" ${g.ativo ? "checked" : ""}>
            Visível na loja
          </label>
        </div>
        <div class="order">
          <button class="mini-btn" data-act="up" title="Mover para cima" ${i === 0 ? "disabled" : ""}>↑</button>
          <button class="mini-btn" data-act="down" title="Mover para baixo" ${i === cfg.games.length - 1 ? "disabled" : ""}>↓</button>
        </div>
      </div>
      <div class="a-row">
        <div class="a-field">
          <label>Nome do jogo</label>
          <input type="text" data-bind="nome" value="${esc(g.nome)}" placeholder="Ex.: PokeIdle World">
        </div>
        <div class="a-field">
          <label>Texto do botão do card</label>
          <input type="text" data-bind="botao" value="${esc(g.botao)}" placeholder="Ex.: [PokeIdle] Diamonds">
        </div>
      </div>
      <div class="a-row">
        <div class="a-field">
          <label>Item negociado (plural)</label>
          <input type="text" data-bind="item" value="${esc(g.item)}" placeholder="Ex.: Diamonds">
        </div>
        <div class="a-field">
          <label>Item no singular</label>
          <input type="text" data-bind="unidade" value="${esc(g.unidade)}" placeholder="Ex.: diamante">
          <div class="sub">Usado na cotação: "1 diamante = R$ 0,30".</div>
        </div>
      </div>
      <div class="a-row">
        <div class="a-field">
          <label>Preço de COMPRA — cliente paga (R$ por unidade)</label>
          <input type="number" step="0.01" min="0" data-bind="precoCompra" data-type="number" value="${g.precoCompra}">
        </div>
        <div class="a-field">
          <label>Preço de VENDA — cliente recebe (R$ por unidade)</label>
          <input type="number" step="0.01" min="0" data-bind="precoVenda" data-type="number" value="${g.precoVenda}">
        </div>
      </div>
      <div class="a-row">
        <div class="a-field">
          <label>Quantidade mínima</label>
          <input type="number" step="1" min="1" data-bind="min" data-type="number" value="${g.min}">
        </div>
        <div class="a-field">
          <label>Quantidade máxima</label>
          <input type="number" step="1" min="1" data-bind="max" data-type="number" value="${g.max}">
        </div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <button class="a-btn small" data-act="img">Trocar arte do card</button>
        <button class="a-btn small" data-act="icone">Trocar imagem do item</button>
        <img class="a-thumb icon-p" src="${esc(g.icone)}" alt="" title="Imagem do item (página de negociação)">
        <span class="spacer" style="flex:1"></span>
        <button class="a-btn small danger" data-act="del">Remover jogo</button>
      </div>
    </div>`).join("") + `
    <button class="a-btn a-add" id="add-game">+ Adicionar jogo</button>`;

  bindFields(panel(), (el) => cfg.games[+el.closest(".a-card").dataset.i]);

  $$(".a-card [data-act]", panel()).forEach((btn) => {
    const i = +btn.closest(".a-card").dataset.i;
    btn.addEventListener("click", () => {
      const act = btn.dataset.act;
      if (act === "up") move(cfg.games, i, -1);
      if (act === "down") move(cfg.games, i, 1);
      if (act === "del") {
        if (confirm(`Remover o jogo "${cfg.games[i].nome}"?`)) { cfg.games.splice(i, 1); markDirty(); render(); }
      }
      if (act === "img") pickImage((url) => { cfg.games[i].img = url; markDirty(); render(); });
      if (act === "icone") pickImage((url) => { cfg.games[i].icone = url; markDirty(); render(); });
    });
  });

  $("#add-game").addEventListener("click", () => {
    cfg.games.push({
      id: "jogo-" + Date.now(),
      nome: "", item: "", unidade: "", botao: "",
      img: "assets/logo-vp-store-quadrada.webp",
      icone: "assets/diamante-pokeidle.webp",
      precoCompra: 0, precoVenda: 0, min: 1, max: 1000, ativo: false
    });
    markDirty(); render();
    toast("Jogo criado — preencha os dados, troque a arte e marque \"Visível na loja\".");
  });
}

function renderContatos() {
  const options = (sel) => Object.entries(VP_ICON_NAMES)
    .map(([k, v]) => `<option value="${k}" ${k === sel ? "selected" : ""}>${v}</option>`).join("");

  panel().innerHTML = cfg.contatos.map((c, i) => `
    <div class="a-card" data-i="${i}">
      <div class="a-card-head">
        <div class="icon-select">
          <span class="prev-box">${vpIcon(c.icone)}</span>
        </div>
        <div class="a-title">${esc(c.nome) || "Novo contato"}</div>
        <div class="order">
          <button class="mini-btn" data-act="up" title="Mover para cima" ${i === 0 ? "disabled" : ""}>↑</button>
          <button class="mini-btn" data-act="down" title="Mover para baixo" ${i === cfg.contatos.length - 1 ? "disabled" : ""}>↓</button>
        </div>
      </div>
      <div class="a-row three">
        <div class="a-field">
          <label>Ícone</label>
          <select data-bind="icone">${options(c.icone)}</select>
        </div>
        <div class="a-field">
          <label>Nome da rede</label>
          <input type="text" data-bind="nome" value="${esc(c.nome)}" placeholder="Ex.: Instagram">
        </div>
        <div class="a-field">
          <label>Texto de apoio (@, descrição)</label>
          <input type="text" data-bind="info" value="${esc(c.info)}" placeholder="Ex.: @vperts_ot">
        </div>
      </div>
      <div class="a-row single">
        <div class="a-field">
          <label>Link</label>
          <input type="url" data-bind="url" value="${esc(c.url)}" placeholder="https://…">
          <div class="sub">Deixe vazio para abrir o WhatsApp da loja.</div>
        </div>
      </div>
      <button class="a-btn small danger" data-act="del">Remover contato</button>
    </div>`).join("") + `
    <button class="a-btn a-add" id="add-contact">+ Adicionar contato</button>`;

  bindFields(panel(), (el) => cfg.contatos[+el.closest(".a-card").dataset.i]);

  $$(".a-card select[data-bind=icone]", panel()).forEach((sel) => {
    sel.addEventListener("change", () => {
      const card = sel.closest(".a-card");
      $(".prev-box", card).innerHTML = vpIcon(sel.value);
    });
  });

  $$(".a-card [data-act]", panel()).forEach((btn) => {
    const i = +btn.closest(".a-card").dataset.i;
    btn.addEventListener("click", () => {
      const act = btn.dataset.act;
      if (act === "up") move(cfg.contatos, i, -1);
      if (act === "down") move(cfg.contatos, i, 1);
      if (act === "del") {
        if (confirm(`Remover "${cfg.contatos[i].nome}"?`)) { cfg.contatos.splice(i, 1); markDirty(); render(); }
      }
    });
  });

  $("#add-contact").addEventListener("click", () => {
    cfg.contatos.push({ icone: "site", nome: "", info: "", url: "" });
    markDirty(); render();
  });
}

/* ---------------------------------------------- VP Bazaar */
const BZ_STATUS = { ativo: "No ar", pausado: "Pausado (oculto)", vendido: "Vendido" };

/* Mesmas chaves de TYPE_KEYS em api/_lib/defaults.mjs. */
const BZ_TIPOS = [
  ["normal", "Normal"], ["fire", "Fogo"], ["water", "Água"], ["electric", "Elétrico"],
  ["grass", "Planta"], ["ice", "Gelo"], ["fighting", "Lutador"], ["poison", "Veneno"],
  ["ground", "Terra"], ["flying", "Voador"], ["psychic", "Psíquico"], ["bug", "Inseto"],
  ["rock", "Pedra"], ["ghost", "Fantasma"], ["dragon", "Dragão"], ["dark", "Sombrio"],
  ["steel", "Aço"], ["fairy", "Fada"]
];

function bzOptions(lista, atual) {
  return lista.map((v) =>
    `<option value="${esc(v)}" ${v === atual ? "selected" : ""}>${esc(v)}</option>`).join("");
}

function renderBazaar() {
  const bz = cfg.bazaar;

  /* Anúncios salvos antes dos campos do card (ou vindos de backup antigo)
     não têm essas chaves — o editor precisa delas para renderizar. */
  bz.anuncios.forEach((a) => {
    a.tipos = Array.isArray(a.tipos) ? a.tipos : [];
    a.ivs = Array.isArray(a.ivs) && a.ivs.length === 6 ? a.ivs : [];
    a.moves = Array.isArray(a.moves) ? a.moves : [];
    a.dex ??= 0;
    a.nivel ??= 0;
    a.quantidade ??= 0;
    a.shiny ??= false;
    a.aceitaTroca ??= false;
    a.natureza ??= ""; a.habilidade ??= ""; a.genero ??= ""; a.forma ??= ""; a.regras ??= "";
    a.vendedorVerificado ??= false;
    a.vendedorOnline ??= false;
    a.vendedorNota ??= 0; a.vendedorVendas ??= 0; a.vendedorResposta ??= ""; a.vendedorAvatar ??= "";
  });

  const cardAnuncio = (a, i) => `
    <div class="a-card ${a.status === "ativo" ? "" : "disabled"}" data-i="${i}"
         data-busca="${esc((a.titulo + " " + a.servidor + " " + a.categoria + " " + a.vendedor).toLowerCase())}">
      <div class="a-card-head">
        <img class="a-thumb" src="${esc(a.img || "assets/logo-vp-store-quadrada.webp")}" alt="">
        <div>
          <div class="a-title">${esc(a.titulo) || "Novo anúncio"}</div>
          <div class="sub" style="margin-top:4px">#${esc(a.id)}</div>
        </div>
        <div class="order">
          <button class="mini-btn" data-act="up" title="Mover para cima" ${i === 0 ? "disabled" : ""}>↑</button>
          <button class="mini-btn" data-act="down" title="Mover para baixo" ${i === bz.anuncios.length - 1 ? "disabled" : ""}>↓</button>
        </div>
      </div>

      <div class="a-row single">
        <div class="a-field">
          <label>Título</label>
          <input type="text" data-bind="titulo" maxlength="90" value="${esc(a.titulo)}" placeholder="Ex.: Charizard shiny lvl 100">
        </div>
      </div>

      <div class="a-row three">
        <div class="a-field">
          <label>Situação</label>
          <select data-bind="status">
            ${Object.entries(BZ_STATUS).map(([k, v]) =>
              `<option value="${k}" ${k === a.status ? "selected" : ""}>${v}</option>`).join("")}
          </select>
        </div>
        <div class="a-field">
          <label>Intenção</label>
          <select data-bind="intencao">
            <option value="venda" ${a.intencao === "venda" ? "selected" : ""}>Vendendo</option>
            <option value="compra" ${a.intencao === "compra" ? "selected" : ""}>Procurando comprar</option>
          </select>
        </div>
        <div class="a-field">
          <label>Jogo</label>
          <select data-bind="jogo">
            ${cfg.games.map((g) =>
              `<option value="${esc(g.id)}" ${g.id === a.jogo ? "selected" : ""}>${esc(g.nome)}</option>`).join("")}
          </select>
        </div>
      </div>

      <div class="a-row three">
        <div class="a-field">
          <label>Servidor</label>
          <select data-bind="servidor">
            <option value="">— nenhum —</option>
            ${bzOptions(bz.servidores, a.servidor)}
          </select>
        </div>
        <div class="a-field">
          <label>Categoria</label>
          <select data-bind="categoria">
            <option value="">— nenhuma —</option>
            ${bzOptions(bz.categorias, a.categoria)}
          </select>
        </div>
        <div class="a-field">
          <label>Anunciante (nick)</label>
          <input type="text" data-bind="vendedor" maxlength="60" value="${esc(a.vendedor)}">
        </div>
      </div>

      <div class="a-row three">
        <div class="a-field">
          <label>Preço (0 = a combinar)</label>
          <input type="number" step="0.01" min="0" data-bind="preco" data-type="number" value="${a.preco}">
        </div>
        <div class="a-field">
          <label>Moeda</label>
          <select data-bind="moeda">
            <option value="brl" ${a.moeda === "brl" ? "selected" : ""}>Reais (R$)</option>
            <option value="diamonds" ${a.moeda === "diamonds" ? "selected" : ""}>Diamonds</option>
          </select>
        </div>
        <div class="a-field">
          <label>Publicado em</label>
          <input type="date" data-bind="criadoEm" value="${esc(a.criadoEm)}">
          <div class="sub">Usado na ordenação "mais recentes".</div>
        </div>
      </div>

      <div class="a-row three">
        <div class="a-field">
          <label>Nº na Pokédex</label>
          <input type="number" min="0" max="1025" data-bind="dex" data-type="number" value="${a.dex}">
          <div class="sub">Preenchido, o card mostra o sprite da espécie no lugar da imagem.</div>
        </div>
        <div class="a-field">
          <label>Nível</label>
          <input type="number" min="0" max="100" data-bind="nivel" data-type="number" value="${a.nivel}">
        </div>
        <div class="a-field">
          <label>Quantidade (itens)</label>
          <input type="number" min="0" data-bind="quantidade" data-type="number" value="${a.quantidade}">
          <div class="sub">Aparece quando não há nível. Ex.: Ultra Ball x50.</div>
        </div>
      </div>

      <div class="a-row">
        <div class="a-field">
          <label>Tipagem 1</label>
          <select data-tipo="0">
            <option value="">— nenhuma —</option>
            ${BZ_TIPOS.map(([k, v]) =>
              `<option value="${k}" ${k === a.tipos[0] ? "selected" : ""}>${v}</option>`).join("")}
          </select>
        </div>
        <div class="a-field">
          <label>Tipagem 2</label>
          <select data-tipo="1">
            <option value="">— nenhuma —</option>
            ${BZ_TIPOS.map(([k, v]) =>
              `<option value="${k}" ${k === a.tipos[1] ? "selected" : ""}>${v}</option>`).join("")}
          </select>
        </div>
      </div>

      <div class="a-row single">
        <div class="a-field">
          <label>Descrição</label>
          <textarea data-bind="descricao" maxlength="1200" placeholder="Atributos, level, o que vai junto…">${esc(a.descricao)}</textarea>
        </div>
      </div>

      <details class="bz-detalhe-fields" ${a.natureza || a.ivs.length || a.vendedorNota ? "open" : ""}>
        <summary>Ficha detalhada da página do anúncio (opcional)</summary>

        <div class="a-row three" style="margin-top:14px">
          <div class="a-field">
            <label>Natureza</label>
            <input type="text" data-bind="natureza" maxlength="40" value="${esc(a.natureza)}" placeholder="Ex.: Modest">
          </div>
          <div class="a-field">
            <label>Habilidade</label>
            <input type="text" data-bind="habilidade" maxlength="40" value="${esc(a.habilidade)}" placeholder="Ex.: Synchronize">
          </div>
          <div class="a-field">
            <label>Gênero</label>
            <select data-bind="genero">
              <option value="" ${!a.genero ? "selected" : ""}>— não informar —</option>
              <option value="macho" ${a.genero === "macho" ? "selected" : ""}>Macho ♂</option>
              <option value="femea" ${a.genero === "femea" ? "selected" : ""}>Fêmea ♀</option>
              <option value="sem" ${a.genero === "sem" ? "selected" : ""}>Sem gênero</option>
            </select>
          </div>
        </div>

        <div class="a-row">
          <div class="a-field">
            <label>IVs (HP/Atq/Def/AtqEsp/DefEsp/Vel)</label>
            <input type="text" data-bind="ivs" data-type="ivs" value="${a.ivs.length === 6 ? a.ivs.join("/") : ""}" placeholder="31/31/31/31/31/29">
            <div class="sub">Seis números de 0 a 31 separados por barra. Deixe vazio para ocultar.</div>
          </div>
          <div class="a-field">
            <label>Golpes / moves (até 4, por vírgula)</label>
            <input type="text" data-bind="moves" data-type="list" value="${esc(a.moves.join(", "))}" placeholder="Moonblast, Psychic, Calm Mind">
          </div>
        </div>

        <div class="a-row three">
          <div class="a-field">
            <label>Forma</label>
            <input type="text" data-bind="forma" maxlength="40" value="${esc(a.forma)}" placeholder="Ex.: Padrão, Mega">
          </div>
          <div class="a-field">
            <label>Nota do vendedor (0–5)</label>
            <input type="number" step="0.1" min="0" max="5" data-bind="vendedorNota" data-type="number" value="${a.vendedorNota}">
          </div>
          <div class="a-field">
            <label>Vendas realizadas</label>
            <input type="number" min="0" data-bind="vendedorVendas" data-type="number" value="${a.vendedorVendas}">
          </div>
        </div>

        <div class="a-row">
          <div class="a-field">
            <label>Tempo de resposta</label>
            <input type="text" data-bind="vendedorResposta" maxlength="40" value="${esc(a.vendedorResposta)}" placeholder="Ex.: 5 min">
          </div>
          <div class="a-field">
            <label>Regras / observações do vendedor</label>
            <textarea data-bind="regras" maxlength="800" placeholder="Negocie apenas pelo chat, não aceito pagamento fora…">${esc(a.regras)}</textarea>
          </div>
        </div>
      </details>

      <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center">
        <label class="a-check">
          <input type="checkbox" data-bind="destaque" ${a.destaque ? "checked" : ""}> Destaque
        </label>
        <label class="a-check">
          <input type="checkbox" data-bind="shiny" ${a.shiny ? "checked" : ""}> Shiny
        </label>
        <label class="a-check">
          <input type="checkbox" data-bind="negociavel" ${a.negociavel ? "checked" : ""}> Aceita propostas
        </label>
        <label class="a-check">
          <input type="checkbox" data-bind="aceitaTroca" ${a.aceitaTroca ? "checked" : ""}> Aceita troca
        </label>
        <label class="a-check">
          <input type="checkbox" data-bind="vendedorVerificado" ${a.vendedorVerificado ? "checked" : ""}> Anunciante verificado
        </label>
        <label class="a-check">
          <input type="checkbox" data-bind="vendedorOnline" ${a.vendedorOnline ? "checked" : ""}> Online
        </label>
        <button class="a-btn small" data-act="img">Trocar imagem</button>
        <span class="spacer" style="flex:1"></span>
        <button class="a-btn small danger" data-act="del">Remover anúncio</button>
      </div>
    </div>`;

  panel().innerHTML = `
    <div class="a-card" id="bz-geral">
      <div class="a-title" style="margin-bottom:16px">Configuração do marketplace</div>
      <label class="a-check" style="margin-bottom:16px">
        <input type="checkbox" data-bind="ativo" ${bz.ativo ? "checked" : ""}>
        Bazaar visível para os visitantes
      </label>
      <div class="a-row">
        <div class="a-field">
          <label>Servidores (separados por vírgula)</label>
          <input type="text" data-bind="servidores" data-type="list" value="${esc(bz.servidores.join(", "))}">
        </div>
        <div class="a-field">
          <label>Categorias (separadas por vírgula)</label>
          <input type="text" data-bind="categorias" data-type="list" value="${esc(bz.categorias.join(", "))}">
        </div>
      </div>
      <div class="a-row single">
        <div class="a-field">
          <label>Mensagem do botão "Tenho interesse"</label>
          <textarea data-bind="msgInteresse">${esc(bz.msgInteresse)}</textarea>
          <div class="sub">Use <strong>{titulo}</strong> e <strong>{id}</strong> — são trocados pelo anúncio clicado.</div>
        </div>
      </div>
      <div class="a-row single">
        <div class="a-field">
          <label>Mensagem do botão "Anunciar"</label>
          <textarea data-bind="msgAnunciar">${esc(bz.msgAnunciar)}</textarea>
        </div>
      </div>
      <p class="sub" style="margin:4px 0 0">
        Servidores e categorias removidos daqui somem do filtro e são limpos dos
        anúncios que os usavam ao salvar.
      </p>
    </div>

    <div class="a-card">
      <div class="a-field">
        <label>Procurar anúncio</label>
        <input type="search" id="bz-busca" placeholder="Título, servidor, categoria ou anunciante">
      </div>
    </div>

    <div id="bz-lista">${bz.anuncios.map(cardAnuncio).join("")}</div>
    <button class="a-btn a-add" id="add-anuncio">+ Adicionar anúncio</button>`;

  bindFields($("#bz-geral"), () => cfg.bazaar);
  bindFields($("#bz-lista"), (el) => bz.anuncios[+el.closest(".a-card").dataset.i]);

  /* As duas tipagens gravam num array só, sem posições vazias no meio. */
  $$("#bz-lista [data-tipo]").forEach((sel) => {
    sel.addEventListener("change", () => {
      const card = sel.closest(".a-card");
      const anuncio = bz.anuncios[+card.dataset.i];
      const escolhidos = $$("[data-tipo]", card)
        .sort((a, b) => a.dataset.tipo - b.dataset.tipo)
        .map((s) => s.value);
      anuncio.tipos = [...new Set(escolhidos.filter(Boolean))].slice(0, 2);
      markDirty();
    });
  });

  /* filtra sem re-renderizar, para não perder o que está sendo digitado */
  $("#bz-busca").addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    $$("#bz-lista .a-card").forEach((card) => {
      card.hidden = Boolean(q) && !card.dataset.busca.includes(q);
    });
  });

  $$("#bz-lista .a-card [data-act]").forEach((btn) => {
    const i = +btn.closest(".a-card").dataset.i;
    btn.addEventListener("click", () => {
      const act = btn.dataset.act;
      if (act === "up") move(bz.anuncios, i, -1);
      if (act === "down") move(bz.anuncios, i, 1);
      if (act === "del") {
        if (confirm(`Remover o anúncio "${bz.anuncios[i].titulo}"?`)) {
          bz.anuncios.splice(i, 1); markDirty(); render();
        }
      }
      if (act === "img") pickImage((url) => { bz.anuncios[i].img = url; markDirty(); render(); });
    });
  });

  $("#add-anuncio").addEventListener("click", () => {
    bz.anuncios.unshift({
      id: "an-" + Date.now().toString(36),
      titulo: "",
      jogo: cfg.games[0]?.id || "",
      servidor: bz.servidores[0] || "",
      categoria: bz.categorias[0] || "",
      intencao: "venda",
      moeda: "brl",
      preco: 0,
      negociavel: false,
      destaque: false,
      status: "pausado",
      img: "",
      descricao: "",
      vendedor: "",
      criadoEm: new Date().toISOString().slice(0, 10),
      dex: 0,
      nivel: 0,
      tipos: [],
      shiny: false,
      quantidade: 0,
      aceitaTroca: false,
      natureza: "", habilidade: "", genero: "", forma: "", ivs: [], moves: [], regras: "",
      vendedorVerificado: false,
      vendedorOnline: false,
      vendedorNota: 0, vendedorVendas: 0, vendedorResposta: "", vendedorAvatar: ""
    });
    markDirty(); render();
    toast("Anúncio criado — preencha os dados e mude a situação para \"No ar\".");
  });
}

function renderGeral() {
  panel().innerHTML = `
    <div class="a-card">
      <div class="a-title" style="margin-bottom:16px">WhatsApp da loja</div>
      <div class="a-row">
        <div class="a-field">
          <label>Número (só dígitos, com país e DDD)</label>
          <input type="text" data-bind="whatsapp" data-type="digits" value="${esc(cfg.whatsapp)}" placeholder="5547988930280">
          <div class="sub">Formato: 55 + DDD + número. Ex.: 5547988930280.</div>
        </div>
      </div>
      <div class="a-row single">
        <div class="a-field">
          <label>Mensagem do botão "Negociar" (topo do site)</label>
          <textarea data-bind="msgNegociar">${esc(cfg.msgNegociar)}</textarea>
          <div class="sub">É a mensagem que chega pronta no seu WhatsApp quando clicam em Negociar.</div>
        </div>
      </div>
    </div>
    <div class="a-card">
      <div class="a-title" style="margin-bottom:10px">Segurança</div>
      <p style="color:var(--muted);font-size:13px;margin:0">
        Usuário e senha do painel ficam nas variáveis de ambiente do servidor
        (ADMIN_USER / ADMIN_PASS na Vercel) — para trocar a senha, altere lá e faça
        um novo deploy. A sessão expira sozinha em 12 horas.
      </p>
    </div>`;

  bindFields(panel(), () => cfg);
}

const SECTIONS = {
  banners: renderBanners, jogos: renderJogos, bazaar: renderBazaar,
  contatos: renderContatos, geral: renderGeral
};
function render() { SECTIONS[activeTab](); }

/* ---------------------------------------------- abas */
$$(".admin-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    activeTab = tab.dataset.tab;
    $$(".admin-tab").forEach((t) => t.classList.toggle("active", t === tab));
    render();
  });
});

/* ---------------------------------------------- ações */
function download(filename, text, type = "application/json") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

$("#save-btn").addEventListener("click", async () => {
  const res = await api("/api/admin/config", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cfg)
  });
  if (!res.ok) {
    toast(res.data?.error || "Não foi possível salvar.", "err");
    return;
  }
  cfg = res.data;   // versão sanitizada pelo servidor
  dirty = false;
  render();
  toast("Publicado! A atualização pode levar até 1 minuto para aparecer para todos.");
});

$("#export-btn").addEventListener("click", () => {
  download("vp-store-backup.json", JSON.stringify(cfg, null, 2));
  toast("Backup baixado.");
});

$("#import-btn").addEventListener("click", () => $("#import-file").click());
$("#import-file").addEventListener("change", () => {
  const file = $("#import-file").files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data.games || !data.banners || !data.contatos) throw new Error("estrutura inválida");
      cfg = data;
      cfg.bazaar = vpBazaar(cfg);   // backups anteriores ao bazaar não têm a chave
      markDirty(); render();
      toast("Backup carregado — confira e clique em Salvar e publicar.");
    } catch (e) {
      toast("Arquivo inválido: use um backup gerado por este painel.", "err");
    }
  };
  reader.readAsText(file);
  $("#import-file").value = "";
});

$("#reset-btn").addEventListener("click", async () => {
  if (!confirm("Carregar a configuração padrão? (nada é salvo até você clicar em Salvar e publicar)")) return;
  const res = await api("/api/admin/config?defaults=1");
  if (!res.ok) { toast("Não foi possível carregar o padrão.", "err"); return; }
  cfg = res.data;
  markDirty(); render();
  toast("Padrão carregado — clique em Salvar e publicar para aplicar.");
});

$("#logout-btn").addEventListener("click", async () => {
  await api("/api/logout", { method: "POST" });
  location.reload();
});

/* ---------------------------------------------- login */
$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("#login-err");
  err.hidden = true;
  $("#login-btn").disabled = true;
  const res = await api("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: $("#login-user").value, pass: $("#login-pass").value })
  });
  $("#login-btn").disabled = false;
  if (!res.ok) {
    err.textContent = res.data?.error || "Falha no login.";
    err.hidden = false;
    return;
  }
  init();
});

/* ---------------------------------------------- inicialização */
async function init() {
  const res = await api("/api/admin/config");
  if (res.ok) {
    cfg = res.data;
    cfg.bazaar = vpBazaar(cfg);   // configs salvas antes do bazaar não têm a chave
    $("#login-view").hidden = true;
    $("#admin-view").hidden = false;
    $("#logout-btn").hidden = false;
    render();
  } else {
    $("#admin-view").hidden = true;
    $("#logout-btn").hidden = true;
    $("#login-view").hidden = false;
    $("#login-user").focus();
  }
}

init();
