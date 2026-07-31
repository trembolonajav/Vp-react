(function () {
  const esc = window.vpEsc || ((s) => String(s ?? ""));
  const form = document.querySelector("[data-profile-form]");
  async function fetchProfile(user = "") {
    const res = await fetch(`/api/bazaar/profile${user ? `?user=${encodeURIComponent(user)}` : ""}`, { credentials: "same-origin" });
    const data = await res.json(); if (!res.ok) throw new Error(data.error || "Perfil indisponível."); return data.profile;
  }
  if (form) {
    let selectedAvatar = "initial";
    window.VPConta.ready().then(async () => {
      try {
        const p = await fetchProfile();
        ["username", "email", "preferredContact", "contact", "bio"].forEach((key) => { if (form.elements[key]) form.elements[key].value = p[key] || ""; });
        selectedAvatar = p.avatar || "initial";
        const hero = document.querySelector("[data-account-avatar]");
        const src = window.VPConta.avatarUrl(p);
        hero.innerHTML = src ? `<img src="${esc(src)}" alt="">` : esc(p.username.slice(0, 2).toUpperCase());
        document.querySelector("[data-avatar-copy]").textContent = p.username.slice(0, 2).toUpperCase();
        document.querySelectorAll("[data-avatar]").forEach((button) => button.classList.toggle("active", button.dataset.avatar === selectedAvatar));
      } catch { location.href = "index.html"; }
    });
    document.querySelector(".bz-avatar-picker")?.addEventListener("click", (e) => {
      const button = e.target.closest("[data-avatar]"); if (!button) return;
      selectedAvatar = button.dataset.avatar;
      document.querySelectorAll("[data-avatar]").forEach((item) => item.classList.toggle("active", item === button));
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault(); const status = form.querySelector("[data-profile-status]");
      const payload = { ...Object.fromEntries(new FormData(form)), avatar: selectedAvatar };
      const res = await fetch("/api/bazaar/profile", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json(); status.textContent = res.ok ? "Alterações salvas." : data.error; status.classList.toggle("ok", res.ok);
      if (res.ok) {
        window.VPConta.contaAtual().avatar = data.profile.avatar;
        window.VPConta.renderHeader();
      }
    });
  }
  const root = document.querySelector("[data-public-profile]");
  if (root) {
    window.VPConta.ready().then(async () => {
      const requested = new URLSearchParams(location.search).get("user") || window.VPConta.contaAtual()?.username || "";
      try {
        const p = await fetchProfile(requested);
        const src = window.VPConta.avatarUrl(p);
        root.innerHTML = `<div class="bz-profile-hero"><i>${src ? `<img src="${esc(src)}" alt="">` : esc(p.username.slice(0,2).toUpperCase())}</i><div><span class="kicker">Perfil público</span><h1>${esc(p.username)}</h1><p>${esc(p.bio || "Membro da comunidade VP Bazaar.")}</p><small>Membro desde ${new Date(p.createdAt).toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}</small></div></div>`;
      } catch (e) { root.innerHTML = `<div class="bz-empty"><strong>${esc(e.message)}</strong><a href="index.html">Voltar ao marketplace</a></div>`; }
    });
  }
})();
