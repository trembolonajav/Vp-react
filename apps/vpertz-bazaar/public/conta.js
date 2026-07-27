(function () {
  const esc = window.vpEsc || ((s) => String(s ?? ""));
  let atual = null;
  let hydration = null;

  async function request(body) {
    const res = await fetch("/api/bazaar/auth", {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Não foi possível continuar.");
    return data;
  }

  function contaAtual() { return atual; }

  async function sair() {
    await request({ action: "logout" });
    atual = null;
    renderHeader();
  }

  async function carregarResumo() {
    if (!atual) return { conversations: [], unread: 0 };
    try {
      const res = await fetch("/api/bazaar/chat", { credentials: "same-origin" });
      if (!res.ok) return { conversations: [], unread: 0 };
      const resumo = await res.json();
      const config = await window.vpFetchConfig();
      const anuncios = window.vpBazaar(config).anuncios || [];
      resumo.conversations = resumo.conversations.map((conversation) => {
        const anuncio = anuncios.find((item) => String(item.id) === String(conversation.adId))
          || anuncios.find((item) => String(item.titulo).toLowerCase() === String(conversation.title).toLowerCase());
        return anuncio ? {
          ...conversation,
          image: anuncio.imagem || conversation.image,
          title: anuncio.titulo || conversation.title
        } : conversation;
      });
      return resumo;
    } catch { return { conversations: [], unread: 0 }; }
  }

  function tempoRelativo(value) {
    const elapsed = Date.now() - new Date(value || Date.now()).getTime();
    const minutes = Math.max(0, Math.floor(elapsed / 60000));
    if (minutes < 1) return "agora";
    if (minutes < 60) return `há ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours} h`;
    const days = Math.floor(hours / 24);
    return days === 1 ? "ontem" : `há ${days} dias`;
  }

  function textoNotificacao(conversation) {
    const other = conversation.buyer === atual.username ? conversation.seller : conversation.buyer;
    if (conversation.status === "intermedio-solicitado") return `Intermédio da VP solicitado por ${other}`;
    if (conversation.status === "encerrada") return `${other} encerrou a negociação`;
    if (conversation.lastMessage) return `Nova mensagem de ${conversation.lastMessage.author || other}`;
    return `${other} abriu uma negociação com você`;
  }

  function pedirLogin() {
    return new Promise((resolve) => {
      document.querySelector(".bz-login-overlay")?.remove();
      const wrap = document.createElement("div");
      wrap.className = "bz-login-overlay";
      wrap.innerHTML = `
        <div class="bz-login-card" role="dialog" aria-modal="true" aria-labelledby="bz-login-t">
          <button type="button" class="bz-login-x" data-x aria-label="Fechar">×</button>
          <img class="bz-login-brand" src="/assets/logo-vp-bazaar-quadrada-oficial.webp" alt="VP Bazaar">
          <span class="kicker">Sua conta no VP Bazaar</span>
          <h2 id="bz-login-t">Acesse para negociar</h2>
          <p class="bz-login-sub">Entre para anunciar, negociar e acompanhar suas conversas com segurança.</p>
          <div class="bz-login-tabs" role="tablist">
            <button type="button" class="bz-login-tab on" data-mode="login">Entrar</button>
            <button type="button" class="bz-login-tab" data-mode="register">Criar conta</button>
          </div>
          <form data-auth-form>
            <div data-login-fields>
              <label class="bz-login-label">Usuário ou e-mail</label>
              <input class="bz-login-input" name="login" autocomplete="username" required>
            </div>
            <div data-register-fields hidden>
              <label class="bz-login-label">Nome de usuário</label>
              <input class="bz-login-input" name="username" minlength="3" maxlength="24" autocomplete="username">
              <label class="bz-login-label">E-mail</label>
              <input class="bz-login-input" name="email" type="email" autocomplete="email">
            </div>
            <label class="bz-login-label">Senha</label>
            <input class="bz-login-input" name="password" type="password" minlength="8" autocomplete="current-password" required>
            <div data-register-fields hidden>
              <label class="bz-login-label">Repetir senha</label>
              <input class="bz-login-input" name="repeat" type="password" minlength="8" autocomplete="new-password">
            </div>
            <p class="bz-login-err" data-err hidden></p>
            <button class="bz-login-ok" type="submit" data-submit>Entrar no Bazaar</button>
          </form>
          <p class="bz-login-note">Conta de teste: <b>moonlight</b> · senha <b>Bazaar2026!</b></p>
          <div class="bz-login-safe"><span>🔒</span><span>Sua senha do Bazaar é independente da senha da sua conta no jogo.</span></div>
        </div>`;
      document.body.appendChild(wrap);
      let mode = "login";
      const form = wrap.querySelector("[data-auth-form]");
      const err = wrap.querySelector("[data-err]");
      const close = (user) => { wrap.remove(); resolve(user); };
      wrap.querySelector(".bz-login-tabs").addEventListener("click", (e) => {
        const tab = e.target.closest("[data-mode]"); if (!tab) return;
        mode = tab.dataset.mode;
        wrap.querySelectorAll("[data-mode]").forEach((b) => b.classList.toggle("on", b === tab));
        wrap.querySelectorAll("[data-register-fields]").forEach((el) => { el.hidden = mode !== "register"; });
        wrap.querySelector("[data-login-fields]").hidden = mode === "register";
        wrap.querySelector("[data-submit]").textContent = mode === "register" ? "Criar conta" : "Entrar no Bazaar";
      });
      form.addEventListener("submit", async (e) => {
        e.preventDefault(); err.hidden = true;
        const data = Object.fromEntries(new FormData(form));
        if (mode === "register" && data.password !== data.repeat) {
          err.textContent = "As senhas não coincidem."; err.hidden = false; return;
        }
        try {
          const result = await request({ action: mode, ...data });
          atual = result.user; renderHeader(); close(atual);
        } catch (error) { err.textContent = error.message; err.hidden = false; }
      });
      wrap.querySelector("[data-x]").addEventListener("click", () => close(null));
      wrap.addEventListener("click", (e) => { if (e.target === wrap) close(null); });
    });
  }

  async function exigirConta() {
    if (hydration) await hydration;
    return atual || await pedirLogin();
  }

  let ultimoResumo = { conversations: [], unread: 0 };
  async function renderHeader() {
    const resumo = await carregarResumo();
    ultimoResumo = resumo;
    const initials = (atual?.username || "").slice(0, 2).toUpperCase();
    document.querySelectorAll("[data-conta]").forEach((el) => {
      el.innerHTML = atual
        ? `<span class="bz-userbar">
            <button class="bz-notif-btn" type="button" data-notif-toggle aria-label="Notificações">
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 6-2 7-2 7h16s-2-1-2-7"></path><path d="M13.7 20a2 2 0 0 1-3.4 0"></path></svg>${resumo.unread ? `<b>${resumo.unread}</b>` : ""}
            </button>
            <span class="bz-user-pop bz-notif-pop" data-notif-pop hidden>
              <span class="bz-notif-title"><strong>Notificações</strong><button type="button" data-read-all>Marcar todas como lidas</button></span>
              ${resumo.conversations.length ? resumo.conversations.slice(0, 5).map((c) => `
                <a class="bz-notif-item ${c.unread ? "unread" : ""}" href="chat.html?id=${encodeURIComponent(c.id)}">
                  <i class="bz-notif-art">${c.image ? `<img src="${esc(c.image)}" alt="">` : esc(c.title.slice(0,2).toUpperCase())}<b>${c.status === "intermedio-solicitado" ? "◇" : c.status === "encerrada" ? "×" : "✦"}</b></i>
                  <span><strong>${esc(textoNotificacao(c))}</strong><small>${esc(tempoRelativo(c.lastMessage?.createdAt || c.updatedAt || c.createdAt))} · ${esc(c.title)}</small></span>
                  ${c.unread ? `<em></em>` : ""}
                </a>`).join("") : "<em class=\"bz-notif-none\">Nenhuma notificação ainda.</em>"}
              <a class="bz-pop-all" href="chat.html">Ver todas as notificações →</a>
            </span>
            <button class="bz-profile-btn" type="button" data-profile-toggle><i>${esc(initials)}</i><span>${esc(atual.username)}</span><b>▾</b></button>
            <span class="bz-user-pop bz-profile-pop" data-profile-pop hidden>
              <span class="bz-pop-identity"><i>${esc(initials)}</i><span><strong>${esc(atual.username)}</strong><small>Conta do VP Bazaar</small></span></span>
              <a href="chat.html">♢ Minhas conversas ${resumo.unread ? `<b>${resumo.unread}</b>` : ""}</a>
              <a href="meus-anuncios.html">▤ Meus anúncios</a>
              <a href="conta.html">⚙ Minha conta</a>
              <a href="perfil.html?user=${encodeURIComponent(atual.username)}">◎ Perfil público</a>
              <button type="button" data-conta-sair>⏻ Sair da conta</button>
            </span>
          </span>`
        : `<button type="button" class="bz-conta-entrar" data-conta-entrar>Login / Registrar</button>`;
    });
  }

  async function hydrate() {
    try {
      const res = await fetch("/api/bazaar/auth", { credentials: "same-origin" });
      atual = (await res.json()).user || null;
    } catch { atual = null; }
    renderHeader();
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-conta-sair]")) sair();
    else if (e.target.closest("[data-read-all]")) {
      Promise.all(ultimoResumo.conversations.filter((c) => c.unread).map((c) => fetch("/api/bazaar/chat", { method:"POST", credentials:"same-origin", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"read", id:c.id }) }))).then(renderHeader);
    }
    else if (e.target.closest("[data-conta-entrar]")) pedirLogin();
    else if (e.target.closest("[data-notif-toggle]")) {
      const pop = e.target.closest(".bz-userbar").querySelector("[data-notif-pop]");
      pop.hidden = !pop.hidden;
      e.target.closest(".bz-userbar").querySelector("[data-profile-pop]").hidden = true;
    } else if (e.target.closest("[data-profile-toggle]")) {
      const pop = e.target.closest(".bz-userbar").querySelector("[data-profile-pop]");
      pop.hidden = !pop.hidden;
      e.target.closest(".bz-userbar").querySelector("[data-notif-pop]").hidden = true;
    } else if (!e.target.closest(".bz-userbar")) {
      document.querySelectorAll(".bz-user-pop").forEach((pop) => { pop.hidden = true; });
    }
  });
  const start = () => { if (!hydration) hydration = hydrate(); return hydration; };
  document.addEventListener("DOMContentLoaded", start);
  if (document.readyState !== "loading") start();
  window.VPConta = { contaAtual, sair, pedirLogin, exigirConta, renderHeader, ready: start };
})();
