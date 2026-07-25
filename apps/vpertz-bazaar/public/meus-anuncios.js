/* ============================================================
   VP BAZAAR — Meus anúncios (Fase 2)
   ------------------------------------------------------------
   Lista e gerencia os anúncios criados pelo usuário no wizard, guardados
   localmente (localStorage "vp-bazaar-meus"). Exige conta (window.VPConta).
   Reutiliza globais do bazaar.js: spriteUrl, precoHTML, tiposHTML, toast.
   ============================================================ */

(function () {
  const cont = document.querySelector("[data-meus]");
  if (!cont) return;

  const esc = window.vpEsc;
  const KEY = "vp-bazaar-meus";
  const ler = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const gravar = (arr) => { try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch { /* cheio/privado */ } };
  const aviso = (m) => (typeof toast === "function" ? toast(m) : null);

  const STATUS = { ativo: "Ativo", pausado: "Pausado", vendido: "Concluído" };

  function detalhe(a) {
    if (a.dex) return a.nivel ? `Nível ${a.nivel}` : "Pokémon";
    return a.quantidade ? `Quantidade: ${Number(a.quantidade).toLocaleString("pt-BR")}` : (a.categoria || "Item");
  }

  function cardMeu(a) {
    const arte = a.dex
      ? `<img src="${spriteUrl(a.dex)}" alt="" loading="lazy" data-fallback>`
      : a.img
        ? `<img src="${esc(a.img)}" alt="" loading="lazy" data-fallback>`
        : `<span class="bz-noart" aria-hidden="true">${esc((a.titulo || "VP").slice(0, 2).toUpperCase())}</span>`;
    const acoes = a.status === "vendido"
      ? `<button type="button" class="a-btn small" data-reativar="${esc(a.id)}">Reabrir</button>
         <button type="button" class="a-btn small danger" data-remover="${esc(a.id)}">Remover</button>`
      : `<a class="a-btn small" href="anuncio.html?id=${encodeURIComponent(a.id)}">Ver</a>
         <button type="button" class="a-btn small" data-pausar="${esc(a.id)}">${a.status === "pausado" ? "Reativar" : "Pausar"}</button>
         <button type="button" class="a-btn small gold" data-vendido="${esc(a.id)}">Marcar vendido</button>
         <button type="button" class="a-btn small danger" data-remover="${esc(a.id)}">Remover</button>`;

    return `
      <article class="bz-meu-card status-${esc(a.status)}">
        <div class="bz-meu-top">
          <span class="bz-meu-status">${esc(STATUS[a.status] || a.status)}</span>
          <span class="bz-plate simples ${esc(a.intencao)}">${a.intencao === "compra" ? "Procura-se" : "À venda"}</span>
        </div>
        <div class="bz-meu-main">
          <div class="bz-sprite">${arte}</div>
          <div>
            <h3 class="bz-card-title"><span>${esc(a.titulo)}</span>${a.shiny ? '<span class="bz-star">★</span>' : ""}</h3>
            <p class="bz-card-sub">${esc(detalhe(a))}</p>
            ${tiposHTML(a.tipos || [])}
            ${a.servidor ? `<p class="bz-card-sub">Servidor: <b>${esc(a.servidor)}</b></p>` : ""}
          </div>
        </div>
        <div class="bz-card-price">${precoHTML(a)}</div>
        <div class="bz-meu-acoes">${acoes}</div>
      </article>`;
  }

  function gateHTML() {
    return `
      <div class="bz-wizard-card bz-gate">
        <span class="kicker">Meus anúncios</span>
        <h1>Entre para ver seus anúncios</h1>
        <p>Seus anúncios ficam ligados ao seu nick do jogo, salvos neste navegador.</p>
        <button type="button" class="btn-icon-label btn-whats" data-entrar><span>Entrar</span></button>
      </div>`;
  }

  function render() {
    const conta = window.VPConta.contaAtual();
    if (!conta) {
      cont.innerHTML = gateHTML();
      cont.querySelector("[data-entrar]").addEventListener("click", async () => {
        const c = await window.VPConta.pedirLogin();
        if (c) render();
      });
      return;
    }

    const arr = ler();
    const ativos = arr.filter((a) => a.status === "ativo" || a.status === "pausado");
    const concluidos = arr.filter((a) => a.status === "vendido");

    cont.innerHTML = `
      <div class="bz-meus-head">
        <div>
          <span class="kicker">Conta local · ${esc(conta.nick)}</span>
          <h1>Meus anúncios</h1>
          <p class="section-sub">Os anúncios que você cria aparecem aqui e no marketplace deste
             navegador. Publicação global e contas na nuvem chegam numa próxima fase.</p>
        </div>
        <a class="btn-icon-label btn-whats" href="anunciar.html"><span>Novo anúncio</span></a>
      </div>

      <h2 class="bz-meus-sub">Ativos no marketplace</h2>
      ${ativos.length
        ? `<div class="bz-meus-grid">${ativos.map(cardMeu).join("")}</div>`
        : `<p class="bz-meus-vazio">Você ainda não tem anúncios ativos. <a href="anunciar.html">Criar o primeiro →</a></p>`}

      <h2 class="bz-meus-sub">Concluídos</h2>
      ${concluidos.length
        ? `<div class="bz-meus-grid">${concluidos.map(cardMeu).join("")}</div>`
        : `<p class="bz-meus-vazio">Nenhum anúncio concluído.</p>`}`;

    /* sprite indisponível -> selo */
    cont.addEventListener("error", (e) => {
      const img = e.target;
      if (img.tagName !== "IMG" || !img.hasAttribute("data-fallback")) return;
      img.removeAttribute("data-fallback");
      img.replaceWith(Object.assign(document.createElement("span"), {
        className: "bz-noart", textContent: "VP", ariaHidden: "true"
      }));
    }, true);
  }

  function mutar(id, fn) {
    const arr = ler();
    const a = arr.find((x) => x.id === id);
    if (!a) return;
    fn(a, arr);
    gravar(arr);
    render();
  }

  cont.addEventListener("click", (e) => {
    const pausar = e.target.closest("[data-pausar]");
    const vendido = e.target.closest("[data-vendido]");
    const reativar = e.target.closest("[data-reativar]");
    const remover = e.target.closest("[data-remover]");
    if (pausar) mutar(pausar.dataset.pausar, (a) => { a.status = a.status === "pausado" ? "ativo" : "pausado"; aviso(a.status === "pausado" ? "Anúncio pausado" : "Anúncio reativado"); });
    else if (vendido) mutar(vendido.dataset.vendido, (a) => { a.status = "vendido"; aviso("Marcado como vendido"); });
    else if (reativar) mutar(reativar.dataset.reativar, (a) => { a.status = "ativo"; aviso("Anúncio reaberto"); });
    else if (remover) {
      if (!confirm("Remover este anúncio? Esta ação não pode ser desfeita.")) return;
      mutar(remover.dataset.remover, (a, arr) => { arr.splice(arr.indexOf(a), 1); aviso("Anúncio removido"); });
    }
  });

  render();
  if (new URLSearchParams(location.search).get("novo")) aviso("Anúncio criado!");
})();
