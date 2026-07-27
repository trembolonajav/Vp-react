/* ============================================================
   VP BAZAAR — wizard de anunciar (Fase 2)
   ------------------------------------------------------------
   Passos: tipo (pokémon / item / shiny card) -> jogo (PokeIdle) ->
   vender/comprar -> seleção (sprites dos pokémon, catálogo de itens com
   sprite, ou arte das shiny cards) -> moeda + valor -> revisar/criar. Para
   pokémon há campos de nível, shiny e IVs. O anúncio é salvo localmente
   (placeholder de contas) e o usuário vai para "Meus anúncios".

   Reutiliza globais do bazaar.js: spriteUrl, precoHTML, tiposHTML,
   TYPE_LABEL/TYPE_COLOR; de config.js: vpEsc, vpFetchConfig, vpBazaar;
   dados do VPLab (window.VPLAB_DEX) e das shiny cards (window.VP_SHINY_CARDS).
   ============================================================ */

(function () {
  const wizardEl = document.querySelector("[data-wizard]");
  if (!wizardEl) return;

  const esc = window.vpEsc;
  const q = (s, el = wizardEl) => el.querySelector(s);
  const DEX = Array.isArray(window.VPLAB_DEX) ? window.VPLAB_DEX : [];
  const CARDS = Array.isArray(window.VP_SHINY_CARDS) ? window.VP_SHINY_CARDS : [];

  /* catálogo de itens: nomes únicos do loot, ordenados; sprite via pokexguides */
  const ITENS = [...new Set(DEX.flatMap((p) => (p.loot || []).map((l) => l.n)).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
  const itemSprite = (nome) =>
    "https://pokexguides.com/images/items/drops/" + String(nome).replace(/ /g, "_") + ".png";

  /* pokémon ordenados por dex */
  const POKES = DEX
    .filter((p) => p.dexNo)
    .map((p) => ({ dex: p.dexNo, nome: p.nome, tipos: Array.isArray(p.tipos) ? p.tipos : [] }))
    .sort((a, b) => a.dex - b.dex);
  const IV_LABELS = ["HP IV", "Ataque IV", "Defesa IV", "Atq. Esp. IV", "Def. Esp. IV", "Velocidade IV"];

  const MEUS_KEY = "vp-bazaar-meus";
  const lerMeus = () => { try { return JSON.parse(localStorage.getItem(MEUS_KEY)) || []; } catch { return []; } };
  const gravarMeus = (arr) => { try { localStorage.setItem(MEUS_KEY, JSON.stringify(arr)); } catch { /* cheio/privado */ } };

  const TOTAL = 6;
  let step = 1;
  let cfg = null, bz = null;
  const st = {
    tipo: null, intencao: null,
    dex: 0, titulo: "", tipos: [], nivel: "", shiny: false, forma: "",
    disponibilidade: "", qualidade: "", quantidade: "",
    ivs: ["", "", "", "", "", ""], img: "",
    moeda: null, preco: "", servidor: "", negociavel: false, descricao: ""
  };
  let buscaSel = "";

  const resetSelecao = () => Object.assign(st, {
    dex: 0, titulo: "", tipos: [], nivel: "", shiny: false, forma: "",
    disponibilidade: "", qualidade: "", quantidade: "",
    ivs: ["", "", "", "", "", ""], img: ""
  });

  /* ---------------------------------------------- ícones inline */
  const IC = {
    poke: '<path d="M12 2a10 10 0 0 0-9.95 9h6.15a3.9 3.9 0 0 1 7.6 0h6.15A10 10 0 0 0 12 2Zm0 20a10 10 0 0 0 9.95-9h-6.15a3.9 3.9 0 0 1-7.6 0H2.05A10 10 0 0 0 12 22Zm0-8a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"/>',
    item: '<path d="M20 7h-3V6a3 3 0 0 0-3-3h-4a3 3 0 0 0-3 3v1H4a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a1 1 0 0 0-1-1ZM9 6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1H9Z"/>',
    card: '<path d="M4 5h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm16 2h1a1 1 0 0 1 1 1v10a3 3 0 0 1-3 3H7v-2h12a1 1 0 0 0 1-1ZM6 8h4v4H6Zm6 0h5v1.5h-5Zm0 3h5v1.5h-5ZM6 14h11v1.5H6Z"/>',
    vender: '<path d="M20.6 12 12 3.4A2 2 0 0 0 10.6 3H4a1 1 0 0 0-1 1v6.6a2 2 0 0 0 .6 1.4l8.6 8.6a2 2 0 0 0 2.8 0l5.6-5.6a2 2 0 0 0 0-2.8ZM7.5 8A1.5 1.5 0 1 1 9 6.5 1.5 1.5 0 0 1 7.5 8Z"/>',
    comprar: '<path d="M7 4h-.5a1 1 0 0 0 0 2H8l2.6 8.6A2 2 0 0 0 12.5 16H18a2 2 0 0 0 1.9-1.4l1.9-6A1 1 0 0 0 20.8 7H9l-.4-1.4A2 2 0 0 0 6.7 4Zm3 15a1.5 1.5 0 1 1-1.5-1.5A1.5 1.5 0 0 1 10 19Zm8 0a1.5 1.5 0 1 1-1.5-1.5A1.5 1.5 0 0 1 18 19Z"/>',
    pix: '<path d="m12 2 4.2 4.2a3 3 0 0 0 2.1.9H19L12 14 5 7.1h.7a3 3 0 0 0 2.1-.9ZM5 9.9 2.3 12.6a2 2 0 0 0 0 2.8L5 18.1l4.6-4.6ZM19 9.9l-4.6 4.6L19 19.1l2.7-2.7a2 2 0 0 0 0-2.8Zm-7 6L7.8 20a3 3 0 0 0 2.1.9h4.2a3 3 0 0 0 2.1-.9Z"/>'
  };
  const svg = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true">${IC[n] || ""}</svg>`;

  /* ---------------------------------------------- blocos reutilizáveis */
  function escolhaCard(value, titulo, desc, icon, active) {
    return `<button type="button" class="bz-choice${active ? " on" : ""}" data-choice="${esc(value)}">
      <span class="bz-choice-ic">${svg(icon)}</span>
      <b>${esc(titulo)}</b>
      <small>${esc(desc)}</small>
    </button>`;
  }
  function wireEscolha(cb) {
    q("[data-choices]").addEventListener("click", (e) => {
      const b = e.target.closest("[data-choice]");
      if (b) cb(b.dataset.choice);
    });
  }

  const setStep = (n) => { step = Math.max(1, Math.min(TOTAL, n)); buscaSel = ""; render(); };

  const labelTipo = () => (st.tipo === "item" ? "item" : st.tipo === "shinycard" ? "shiny card" : "pokémon");

  /* ---------------------------------------------- passos */
  function stepTipo() {
    return {
      titulo: "O que você vai anunciar?",
      sub: "Escolha o tipo do anúncio.",
      body: `<div class="bz-choice-grid three" data-choices>
        ${escolhaCard("pokemon", "Pokémon", "Com sprite, tipos, nível e IVs", "poke", st.tipo === "pokemon")}
        ${escolhaCard("item", "Item", "Itens do jogo pelo catálogo", "item", st.tipo === "item")}
        ${escolhaCard("shinycard", "Shiny Card", "Cards colecionáveis de abate", "card", st.tipo === "shinycard")}
      </div>`,
      wire() { wireEscolha((v) => { if (st.tipo !== v) { st.tipo = v; resetSelecao(); } setStep(2); }); }
    };
  }

  function stepJogo() {
    return {
      titulo: "Jogo do anúncio",
      sub: "Por enquanto, apenas o PokeIdle World.",
      body: `<div class="bz-choice-grid one" data-choices>
        <button type="button" class="bz-choice on" data-choice="pokeidle">
          <img class="bz-choice-art bz-game-logo" src="/assets/logo-pokeidle-world.png" alt="PokeIdle World">
          <b>PokeIdle World</b>
          <small>Servidores da comunidade</small>
        </button>
      </div>`,
      wire() { wireEscolha(() => setStep(3)); }
    };
  }

  function stepIntencao() {
    const t = labelTipo();
    return {
      titulo: "Vender ou comprar?",
      sub: "Defina se você está oferecendo ou procurando.",
      body: `<div class="bz-choice-grid" data-choices>
        ${escolhaCard("venda", "Vender", "Estou oferecendo este " + t, "vender", st.intencao === "venda")}
        ${escolhaCard("compra", "Comprar", "Estou procurando este " + t, "comprar", st.intencao === "compra")}
      </div>`,
      wire() { wireEscolha((v) => { st.intencao = v; setStep(4); }); }
    };
  }

  /* ------- passo 4: seleção ------- */
  function pokeResultsHTML() {
    const termo = buscaSel.trim().toLowerCase();
    let lista = POKES;
    if (termo) lista = POKES.filter((p) => p.nome.toLowerCase().includes(termo) || String(p.dex) === termo);
    const capado = lista.slice(0, 60);
    if (!capado.length) return `<p class="bz-sel-vazio">Nenhum pokémon encontrado.</p>`;
    return capado.map((p) => `
      <button type="button" class="bz-poke${st.dex === p.dex ? " on" : ""}" data-dex="${p.dex}"
              data-nome="${esc(p.nome)}" data-tipos="${esc(p.tipos.join(","))}" title="${esc(p.nome)}">
        <img src="${spriteUrl(p.dex)}" alt="" loading="lazy" data-fallback data-selo="${esc(p.nome.slice(0, 2).toUpperCase())}">
        <span>${esc(p.nome)}</span>
      </button>`).join("") +
      (lista.length > 60 ? `<p class="bz-sel-mais">Mostrando 60 de ${lista.length}. Refine a busca.</p>` : "");
  }

  function itemResultsHTML() {
    const termo = buscaSel.trim().toLowerCase();
    let lista = ITENS;
    if (termo) lista = ITENS.filter((n) => n.toLowerCase().includes(termo));
    const capado = lista.slice(0, 80);
    if (!capado.length) return `<p class="bz-sel-vazio">Nenhum item encontrado.</p>`;
    return capado.map((n) => `
      <button type="button" class="bz-item${st.titulo === n ? " on" : ""}" data-item="${esc(n)}">
        <span class="bz-item-ico"><img src="${esc(itemSprite(n))}" alt="" loading="lazy"
              data-fallback data-selo="${esc(n.slice(0, 1).toUpperCase())}"></span>
        <span>${esc(n)}</span>
      </button>`).join("") +
      (lista.length > 80 ? `<p class="bz-sel-mais">Mostrando 80 de ${lista.length}. Refine a busca.</p>` : "");
  }

  function cardResultsHTML() {
    const termo = buscaSel.trim().toLowerCase();
    let lista = CARDS;
    if (termo) lista = CARDS.filter((c) => (`shiny ${c.nome} card`).toLowerCase().includes(termo));
    if (!lista.length) return `<p class="bz-sel-vazio">Nenhuma card encontrada.</p>`;
    return lista.map((c) => `
      <button type="button" class="bz-cardpick${st.titulo === `Shiny ${c.nome} Card` && st.img === c.src ? " on" : ""}"
              data-card="${esc(`Shiny ${c.nome} Card`)}" data-src="${esc(c.src)}" title="${esc(`Shiny ${c.nome} Card`)}">
        <img src="${esc(c.src)}" alt="" loading="lazy" data-fallback data-selo="${esc(c.nome.slice(0, 2).toUpperCase())}">
        <span>${esc(`Shiny ${c.nome} Card`)}</span>
      </button>`).join("");
  }

  function extrasHTML() {
    if (st.tipo === "pokemon") {
      const show = st.dex ? "" : "hidden";
      const ivTotal = st.ivs.every((v) => v !== "" && Number(v) >= 0 && Number(v) <= 31)
        ? st.ivs.reduce((s, v) => s + Number(v), 0) : null;
      return `<div class="bz-sel-extras" ${show} data-extras>
        <div class="bz-form-2">
          <label class="bz-field">
            <span>Nível <b>*</b></span>
            <input class="bz-input" required type="number" min="1" max="1000" data-nivel value="${esc(st.nivel)}" placeholder="Ex.: 100">
          </label>
          <label class="bz-field">
            <span>Forma <b>*</b></span>
            <select class="bz-input" required data-forma>
              <option value="">Selecione</option>
              <option value="Normal" ${st.forma === "Normal" ? "selected" : ""}>Normal</option>
              <option value="Shiny" ${st.forma === "Shiny" ? "selected" : ""}>Shiny</option>
            </select>
          </label>
          <label class="bz-field">
            <span>Disponível para <b>*</b></span>
            <select class="bz-input" required data-disponibilidade>
              <option value="">Selecione</option>
              <option value="Venda" ${st.disponibilidade === "Venda" ? "selected" : ""}>Venda</option>
              <option value="Troca" ${st.disponibilidade === "Troca" ? "selected" : ""}>Troca</option>
              <option value="Venda e Troca" ${st.disponibilidade === "Venda e Troca" ? "selected" : ""}>Venda e Troca</option>
            </select>
          </label>
          <label class="bz-field">
            <span>Qualidade <b>*</b></span>
            <select class="bz-input" required data-qualidade>
              <option value="">Selecione</option>
              ${["Comum","Incomum","Rara","Épica","Lendária"].map((v) => `<option value="${v}" ${st.qualidade === v ? "selected" : ""}>${v}</option>`).join("")}
            </select>
          </label>
        </div>
        <div class="bz-ivs-wrap">
          <div class="bz-ivs-head">
            <span class="bz-ivs-title">Atributos obrigatórios <b>*</b> <i>(0–31)</i></span>
            <output class="bz-iv-total ${ivTotal === null ? "" : "ok"}" data-iv-total>
              ${ivTotal === null ? "IV total: preencha os 6 atributos" : `IV total: ${ivTotal}/186 ✓`}
            </output>
          </div>
          <div class="bz-ivs">
            ${IV_LABELS.map((l, i) => `<label class="bz-iv"><span>${l}</span>
              <input required type="number" min="0" max="31" data-iv="${i}" value="${esc(st.ivs[i])}" placeholder="0–31"></label>`).join("")}
          </div>
        </div>
      </div>`;
    }
    const show = st.titulo ? "" : "hidden";
    return `<div class="bz-sel-extras" ${show} data-extras>
      <label class="bz-field">
        <span>Quantidade <i>(opcional)</i></span>
        <input class="bz-input" type="number" min="1" data-qtd value="${esc(st.quantidade)}" placeholder="Ex.: 1">
      </label>
    </div>`;
  }

  function stepSelecao() {
    const modo = st.tipo; // pokemon | item | shinycard
    const acao = st.intencao === "compra" ? "procurando" : "vendendo";
    const placeholder = modo === "pokemon" ? "Buscar por nome ou nº da Pokédex…"
      : modo === "item" ? "Buscar item…" : "Buscar shiny card…";
    const gridClass = modo === "item" ? "bz-item-list" : modo === "shinycard" ? "bz-card-grid" : "bz-poke-grid";
    const resultados = modo === "pokemon" ? pokeResultsHTML() : modo === "item" ? itemResultsHTML() : cardResultsHTML();
    const selecionado = modo === "item" || modo === "shinycard" ? Boolean(st.titulo) : pokemonCompleto();

    return {
      titulo: modo === "pokemon" ? "Qual pokémon?" : modo === "item" ? "Qual item?" : "Qual shiny card?",
      sub: `Você está ${acao}. Busque e selecione.`,
      body: `
        <input class="bz-input bz-sel-busca" type="text" data-busca autocomplete="off"
               placeholder="${placeholder}" value="${esc(buscaSel)}">
        <div class="${gridClass}" data-resultados>${resultados}</div>
        ${extrasHTML()}`,
      footer: navFooter(selecionado),
      wire() {
        const busca = q("[data-busca]");
        const cont = q("[data-resultados]");
        busca.addEventListener("input", () => {
          buscaSel = busca.value;
          cont.innerHTML = modo === "pokemon" ? pokeResultsHTML() : modo === "item" ? itemResultsHTML() : cardResultsHTML();
        });
        /* sprite/arte indisponível -> selo com iniciais */
        cont.addEventListener("error", (e) => {
          const img = e.target;
          if (img.tagName !== "IMG" || !img.hasAttribute("data-fallback")) return;
          img.removeAttribute("data-fallback");
          img.replaceWith(Object.assign(document.createElement("span"), {
            className: "bz-selo-fallback", textContent: img.dataset.selo || "?", ariaHidden: "true"
          }));
        }, true);
        cont.addEventListener("click", (e) => {
          if (modo === "pokemon") {
            const b = e.target.closest("[data-dex]"); if (!b) return;
            st.dex = Number(b.dataset.dex); st.titulo = b.dataset.nome;
            st.tipos = b.dataset.tipos ? b.dataset.tipos.split(",").filter(Boolean) : []; st.img = "";
          } else if (modo === "item") {
            const b = e.target.closest("[data-item]"); if (!b) return;
            st.titulo = b.dataset.item; st.img = itemSprite(b.dataset.item); st.dex = 0; st.tipos = [];
          } else {
            const b = e.target.closest("[data-card]"); if (!b) return;
            st.titulo = b.dataset.card; st.img = b.dataset.src; st.dex = 0;
            st.tipos = []; st.shiny = false;
          }
          render();
        });
        wireExtras();
        wireFooter();
      }
    };
  }

  function wireExtras() {
    const atualizarPokemon = () => atualizarFooter(pokemonCompleto());
    const nivel = q("[data-nivel]"); if (nivel) nivel.addEventListener("input", () => { st.nivel = nivel.value; atualizarPokemon(); });
    const forma = q("[data-forma]"); if (forma) forma.addEventListener("change", () => {
      st.forma = forma.value;
      st.shiny = forma.value === "Shiny";
      atualizarPokemon();
    });
    const disponibilidade = q("[data-disponibilidade]"); if (disponibilidade) disponibilidade.addEventListener("change", () => {
      st.disponibilidade = disponibilidade.value;
      atualizarPokemon();
    });
    const qualidade = q("[data-qualidade]"); if (qualidade) qualidade.addEventListener("change", () => {
      st.qualidade = qualidade.value;
      atualizarPokemon();
    });
    const qtd = q("[data-qtd]"); if (qtd) qtd.addEventListener("input", () => { st.quantidade = qtd.value; });
    wizardEl.querySelectorAll("[data-iv]").forEach((inp) => {
      inp.addEventListener("input", () => {
        st.ivs[Number(inp.dataset.iv)] = inp.value;
        const total = q("[data-iv-total]");
        const validos = st.ivs.every((v) => v !== "" && Number(v) >= 0 && Number(v) <= 31);
        if (total) {
          total.textContent = validos
            ? `IV total: ${st.ivs.reduce((s, v) => s + Number(v), 0)}/186 ✓`
            : "IV total: preencha os 6 atributos";
          total.classList.toggle("ok", validos);
        }
        atualizarPokemon();
      });
    });
  }

  function pokemonCompleto() {
    return st.tipo !== "pokemon" || (
      st.dex > 0 && Number(st.nivel) >= 1 && Number(st.nivel) <= 1000 &&
      Boolean(st.forma) && Boolean(st.disponibilidade) && Boolean(st.qualidade) &&
      st.ivs.every((v) => v !== "" && Number(v) >= 0 && Number(v) <= 31)
    );
  }

  /* ------- passo 5: moeda e valor ------- */
  function stepMoeda() {
    const servidores = (bz.servidores || []);
    const podeAvancar = Boolean(st.moeda) && Number(st.preco) > 0;
    return {
      titulo: "Moeda e valor",
      sub: "Como você quer receber (ou pagar) e quanto.",
      body: `
        <div class="bz-moeda" data-moeda>
          <button type="button" class="bz-choice mini${st.moeda === "brl" ? " on" : ""}" data-moeda-op="brl">
            <span class="bz-choice-ic bz-pix-icon" aria-hidden="true"><i></i><i></i><i></i><i></i></span><b>PIX</b><small>Reais (R$)</small>
          </button>
          <button type="button" class="bz-choice mini${st.moeda === "diamonds" ? " on" : ""}" data-moeda-op="diamonds">
            <span class="bz-choice-ic"><img src="/assets/diamante-pokeidle-oficial.png" alt="" class="bz-diamond-icon"></span>
            <b>Diamante</b><small>Diamonds do jogo</small>
          </button>
        </div>
        <div class="bz-form-2">
          <label class="bz-field">
            <span>Valor do anúncio</span>
            <input class="bz-input" type="number" min="0" step="${st.moeda === "diamonds" ? "1" : "0.01"}"
                   data-preco value="${esc(st.preco)}" placeholder="${st.moeda === "diamonds" ? "Ex.: 500" : "Ex.: 25,00"}">
          </label>
          <label class="bz-field">
            <span>Servidor <i>(opcional)</i></span>
            <select class="bz-input" data-servidor>
              <option value="">Não informar</option>
              ${servidores.map((s) => `<option value="${esc(s)}" ${st.servidor === s ? "selected" : ""}>${esc(s)}</option>`).join("")}
            </select>
          </label>
        </div>
        <label class="bz-field">
          <span>Descrição <i>(opcional)</i></span>
          <textarea class="bz-input" data-descricao maxlength="600" rows="3"
                    placeholder="Detalhes: atributos, forma de entrega, o que vai junto…">${esc(st.descricao)}</textarea>
        </label>
        <label class="bz-check"><input type="checkbox" data-negociavel ${st.negociavel ? "checked" : ""}> Aceito propostas</label>`,
      footer: navFooter(podeAvancar),
      wire() {
        q("[data-moeda]").addEventListener("click", (e) => {
          const b = e.target.closest("[data-moeda-op]");
          if (!b) return;
          st.moeda = b.dataset.moedaOp;
          render();
        });
        const preco = q("[data-preco]"); preco.addEventListener("input", () => { st.preco = preco.value; atualizarFooter(Boolean(st.moeda) && Number(st.preco) > 0); });
        q("[data-servidor]").addEventListener("change", (e) => { st.servidor = e.target.value; });
        q("[data-descricao]").addEventListener("input", (e) => { st.descricao = e.target.value; });
        q("[data-negociavel]").addEventListener("change", (e) => { st.negociavel = e.target.checked; });
        wireFooter();
      }
    };
  }

  /* ------- passo 6: revisar e criar ------- */
  function previewHTML() {
    const arte = st.dex
      ? `<img src="${spriteUrl(st.dex)}" alt="">`
      : st.img
        ? `<img src="${esc(st.img)}" alt="">`
        : `<span class="bz-noart" aria-hidden="true">${esc((st.titulo || "VP").slice(0, 2).toUpperCase())}</span>`;
    const cat = st.tipo === "item" ? "Item" : st.tipo === "shinycard" ? "Shiny Card" : "Pokémon";
    const detalhe = st.tipo === "pokemon"
      ? (st.nivel ? `Nível ${st.nivel}` : "Pokémon")
      : (st.quantidade ? `Quantidade: ${Number(st.quantidade).toLocaleString("pt-BR")}` : cat);
    const preco = precoHTML({ preco: Number(st.preco) || 0, moeda: st.moeda });
    const selo = st.intencao === "compra" ? "Procura-se" : "À venda";
    return `
      <article class="bz-card bz-preview-card">
        <div class="bz-card-top">
          <span class="bz-plate simples ${esc(st.intencao)}">${selo}</span>
          ${st.shiny ? '<span class="bz-plate shiny">Shiny</span>' : ""}
        </div>
        <div class="bz-card-main">
          <div class="bz-sprite">${arte}</div>
          <div>
            <h3 class="bz-card-title"><span>${esc(st.titulo)}</span></h3>
            <p class="bz-card-sub">${esc(detalhe)}</p>
            ${tiposHTML(st.tipos)}
            ${st.servidor ? `<p class="bz-card-sub">Servidor: <b>${esc(st.servidor)}</b></p>` : ""}
          </div>
        </div>
        <div class="bz-card-price">
          ${preco}
          ${st.negociavel ? '<span class="bz-negociavel">Aceita<br>propostas</span>' : ""}
        </div>
      </article>`;
  }

  function stepRevisar() {
    return {
      titulo: "Revisar e publicar",
      sub: "Confira como o anúncio vai aparecer no marketplace.",
      body: `<div class="bz-preview">
          <div class="bz-preview-hint">
            <p><b>${esc(window.VPConta.contaAtual()?.nick || "Você")}</b> · ${st.intencao === "compra" ? "Comprando" : "Vendendo"}</p>
            <p class="bz-preview-note">O anúncio vai para <b>Meus anúncios</b> e aparece no
               marketplace deste navegador. Contas e publicação global chegam numa próxima fase.</p>
          </div>
          ${previewHTML()}
        </div>`,
      footer: `<div class="bz-wizard-nav">
          <span></span>
          <button type="button" class="btn-icon-label btn-whats bz-wizard-criar" data-criar>
            <span>Criar anúncio</span>
          </button>
        </div>`,
      wire() { q("[data-criar]").addEventListener("click", criarAnuncio); }
    };
  }

  /* ---------------------------------------------- rodapé de navegação */
  function navFooter(podeAvancar) {
    return `<div class="bz-wizard-nav">
        <span></span>
        <button type="button" class="btn-icon-label bz-wizard-next" data-next ${podeAvancar ? "" : "disabled"}>
          <span>Continuar</span>
        </button>
      </div>`;
  }
  function atualizarFooter(podeAvancar) {
    const next = q("[data-next]");
    if (next) next.disabled = !podeAvancar;
  }
  function wireFooter() {
    const next = q("[data-next]");
    if (next) next.addEventListener("click", () => setStep(step + 1));
  }

  /* ---------------------------------------------- criação */
  function criarAnuncio() {
    const conta = window.VPConta.contaAtual();
    if (!conta) { window.VPConta.pedirLogin().then((c) => { if (c) criarAnuncio(); }); return; }
    const selecionado = st.tipo === "pokemon" ? st.dex > 0 : Boolean(st.titulo);
    if (!st.tipo || !st.intencao || !selecionado || !st.moeda || !(Number(st.preco) > 0)) {
      setStep(!st.tipo ? 1 : !st.intencao ? 3 : !selecionado ? 4 : 5);
      return;
    }
    if (st.tipo === "pokemon" && !pokemonCompleto()) {
      setStep(4);
      return;
    }
    const ivs = st.tipo === "pokemon"
      ? st.ivs.map((v) => Math.max(0, Math.min(31, Number(v))))
      : [];
    const categoria = st.tipo === "pokemon" ? "Pokémon" : st.tipo === "shinycard" ? "Shiny Card" : "Itens";

    const id = "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const ad = {
      id, local: true, tipo: st.tipo,
      intencao: st.intencao,
      jogo: "pokeidle",
      servidor: st.servidor || "",
      categoria,
      titulo: st.titulo,
      descricao: st.descricao || "",
      dex: st.tipo === "pokemon" ? st.dex : 0,
      img: st.tipo === "pokemon" ? "" : st.img,
      nivel: st.tipo === "pokemon" && st.nivel ? Number(st.nivel) : 0,
      shiny: st.tipo === "pokemon" && st.forma === "Shiny",
      forma: st.tipo === "pokemon" ? st.forma : "",
      disponibilidade: st.tipo === "pokemon" ? st.disponibilidade : "",
      qualidade: st.tipo === "pokemon" ? st.qualidade : "",
      tipos: st.tipo === "pokemon" ? (st.tipos || []) : [],
      ivs,
      quantidade: st.tipo !== "pokemon" && st.quantidade ? Number(st.quantidade) : 0,
      moeda: st.moeda,
      preco: Number(st.preco) || 0,
      negociavel: !!st.negociavel,
      vendedor: conta.nick,
      status: "ativo",
      criadoEm: new Date().toISOString().slice(0, 10)
    };
    const arr = lerMeus();
    arr.unshift(ad);
    gravarMeus(arr);
    location.href = "meus-anuncios.html?novo=" + encodeURIComponent(id);
  }

  /* ---------------------------------------------- render principal */
  function render() {
    const passos = { 1: stepTipo, 2: stepJogo, 3: stepIntencao, 4: stepSelecao, 5: stepMoeda, 6: stepRevisar };
    const s = passos[step]();
    wizardEl.innerHTML = `
      <div class="bz-wizard-card">
        <div class="bz-wizard-head">
          ${step > 1 ? '<button type="button" class="bz-wizard-back" data-back>← Voltar</button>' : "<span></span>"}
          <span class="bz-wizard-count">Passo ${step} de ${TOTAL}</span>
        </div>
        <div class="bz-wizard-title">
          <span class="logo-wordmark" aria-hidden="true"><b>VP</b> BAZAAR</span>
          <h1>${esc(s.titulo)}</h1>
          <p>${esc(s.sub)}</p>
          <div class="ornament" aria-hidden="true"></div>
        </div>
        <div class="bz-wizard-body">${s.body}</div>
        ${s.footer || ""}
      </div>`;
    const back = q("[data-back]");
    if (back) back.addEventListener("click", () => setStep(step - 1));
    if (s.wire) s.wire();
  }

  function renderGate() {
    wizardEl.innerHTML = `
      <div class="bz-wizard-card bz-gate">
        <span class="kicker">Anunciar no VP Bazaar</span>
        <h1>Entre para anunciar</h1>
        <p>Para criar um anúncio você precisa estar logado com o seu nick do jogo.</p>
        <button type="button" class="btn-icon-label btn-whats" data-entrar><span>Entrar</span></button>
      </div>`;
    q("[data-entrar]").addEventListener("click", async () => {
      const c = await window.VPConta.pedirLogin();
      if (c) render();
    });
  }

  /* ---------------------------------------------- boot */
  (async function boot() {
    cfg = await window.vpFetchConfig();
    bz = window.vpBazaar(cfg);
    const conta = await window.VPConta.exigirConta();
    if (!conta) { renderGate(); return; }
    render();
  })();
})();
