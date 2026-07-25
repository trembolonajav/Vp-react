/* ============================================================
   VP BAZAAR — conta leve (placeholder da Fase 2)
   ------------------------------------------------------------
   Ainda não há contas reais no servidor (só o login de admin). Para o fluxo de
   anunciar funcionar exigindo "estar logado", guardamos uma identidade local
   (o nick do jogo) no localStorage. Quando existir backend de contas, isso é
   substituído — os anúncios locais já carregam `local:true`.
   Depende de /config.js (vpEsc). Exposto em window.VPConta.
   ============================================================ */

(function () {
  const KEY = "vp-bazaar-conta";
  const esc = window.vpEsc || ((s) => String(s ?? ""));

  const ler = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || null; }
    catch { return null; }
  };
  const gravar = (c) => {
    try { localStorage.setItem(KEY, JSON.stringify(c)); }
    catch { /* modo privado: vale só nesta sessão */ }
  };

  function contaAtual() {
    const c = ler();
    return c && c.nick ? c : null;
  }

  function entrar(nick) {
    const limpo = String(nick || "").trim().replace(/\s+/g, " ").slice(0, 24);
    if (!limpo) return null;
    const c = { nick: limpo, criadoEm: new Date().toISOString().slice(0, 10) };
    gravar(c);
    renderHeader();
    return c;
  }

  function sair() {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    renderHeader();
  }

  /* Card de login leve (overlay). Resolve a Promise com a conta ou null. */
  function pedirLogin() {
    return new Promise((resolve) => {
      const existente = document.querySelector(".bz-login-overlay");
      if (existente) existente.remove();

      const wrap = document.createElement("div");
      wrap.className = "bz-login-overlay";
      wrap.innerHTML = `
        <div class="bz-login-card" role="dialog" aria-modal="true" aria-labelledby="bz-login-t">
          <button type="button" class="bz-login-x" data-x aria-label="Fechar">×</button>
          <span class="kicker">Entrar para anunciar</span>
          <h2 id="bz-login-t">Identifique-se</h2>
          <p class="bz-login-sub">Use o seu <b>nick no jogo</b>. É assim que a comunidade vai
             te reconhecer nos anúncios. (Sem senha por enquanto.)</p>
          <label class="bz-login-label" for="bz-login-nick">Seu nick no PokeIdle</label>
          <input class="bz-login-input" id="bz-login-nick" type="text" maxlength="24"
                 placeholder="Ex.: VpertsZ" autocomplete="off">
          <p class="bz-login-err" data-err hidden>Digite um nick para continuar.</p>
          <button type="button" class="btn-icon-label btn-whats bz-login-ok" data-ok>
            <span>Entrar</span>
          </button>
        </div>`;
      document.body.appendChild(wrap);

      const input = wrap.querySelector("[id=bz-login-nick]");
      const err = wrap.querySelector("[data-err]");
      const fechar = (conta) => { wrap.remove(); resolve(conta); };
      const confirmar = () => {
        const c = entrar(input.value);
        if (!c) { err.hidden = false; input.focus(); return; }
        fechar(c);
      };

      wrap.querySelector("[data-ok]").addEventListener("click", confirmar);
      wrap.querySelector("[data-x]").addEventListener("click", () => fechar(null));
      wrap.addEventListener("click", (e) => { if (e.target === wrap) fechar(null); });
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") confirmar(); });
      setTimeout(() => input.focus(), 30);
    });
  }

  /* Garante conta: se não houver, abre o login e espera. Resolve com a conta
     ou null se o usuário desistiu. */
  async function exigirConta() {
    return contaAtual() || (await pedirLogin());
  }

  /* Estado da conta no header (slot [data-conta]). */
  function renderHeader() {
    document.querySelectorAll("[data-conta]").forEach((el) => {
      const c = contaAtual();
      el.innerHTML = c
        ? `<span class="bz-conta">
             <span class="bz-conta-nick" title="Conta local">${esc(c.nick)}</span>
             <button type="button" class="bz-conta-sair" data-conta-sair>Sair</button>
           </span>`
        : `<button type="button" class="bz-conta-entrar" data-conta-entrar>Entrar</button>`;
    });
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-conta-sair]")) sair();
    else if (e.target.closest("[data-conta-entrar]")) pedirLogin();
  });
  document.addEventListener("DOMContentLoaded", renderHeader);
  if (document.readyState !== "loading") renderHeader();

  window.VPConta = { contaAtual, entrar, sair, pedirLogin, exigirConta, renderHeader };
})();
