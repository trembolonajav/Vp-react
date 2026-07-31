(() => {
  "use strict";

  const path = location.pathname.toLowerCase();
  const active = path.startsWith("/store") ? "store"
    : path.startsWith("/bazaar") ? "bazaar"
    : path.startsWith("/vplab") ? "lab"
    : "hub";

  const products = {
    hub: {
      href: "/",
      label: "VPertsz",
      square: "/assets/logo-vpertsz-quadrada.webp",
      horizontal: "/assets/logo-vpertsz-horizontal.webp"
    },
    store: {
      href: "/store/",
      label: "VP Store",
      square: "/assets/logo-vp-store-quadrada.webp",
      horizontal: "/assets/logo-vp-store-horizontal.webp"
    },
    bazaar: {
      href: "/bazaar/",
      label: "VP Bazaar",
      square: "/assets/logo-vp-bazaar-quadrada-oficial.webp",
      horizontal: "/assets/logo-vp-bazaar-horizontal-oficial.webp"
    },
    lab: {
      href: "/vplab/",
      label: "Ferramentas",
      square: "/vplab/assets/logo-vplab.webp",
      horizontal: "/vplab/assets/logo-vplab.webp"
    }
  };
  const productOrder = ["lab", "store", "bazaar", "hub"];
  const current = products[active];

  const oldTopbar = document.querySelector(".topbar");
  const liveNotice = document.createElement("div");
  liveNotice.className = "vp-live-notice";
  liveNotice.innerHTML = `
    <span aria-hidden="true"></span>
    <p>Live todos os dias, das 18h às 22h, na
      <a href="https://www.twitch.tv/vpertsz" target="_blank" rel="noreferrer">twitch.tv/vpertsz</a>
    </p>`;
  if (oldTopbar) oldTopbar.replaceWith(liveNotice);
  else document.body.insertBefore(liveNotice, document.body.firstChild);

  const localHeader = document.querySelector("body > header");
  if (!localHeader) return;
  localHeader.classList.add("vp-local-header");

  const globalHeader = document.createElement("div");
  globalHeader.className = `vp-global-header vp-global-header--${active}`;
  globalHeader.innerHTML = `
    <div class="vp-global-shell">
      <a class="vp-current-brand" href="${current.href}" aria-label="${current.label} — início">
        <img src="${current.horizontal}" alt="${current.label}">
      </a>
      <nav class="vp-products" aria-label="Áreas do ecossistema VPertsz">
        ${productOrder.map((key) => {
          const item = products[key];
          const selected = key === active;
          return `<a href="${item.href}" class="${selected ? "is-active" : ""}"
            ${selected ? 'aria-current="page"' : ""}>
            <img src="${item.square}" alt="">
            <span>${item.label}</span>
          </a>`;
        }).join("")}
      </nav>
      <a class="vp-live-button" href="https://www.twitch.tv/vpertsz" target="_blank"
        rel="noreferrer" aria-label="Assistir à live do VPertsz">
        <img src="/assets/btn-assistir-live.webp" alt="Assistir live">
      </a>
    </div>`;
  localHeader.parentNode.insertBefore(globalHeader, localHeader);

  /* A terceira faixa contém apenas ações pertencentes ao produto atual. */
  const localNav = localHeader.querySelector(".nav-shell");
  localNav?.querySelector(":scope > .brand, :scope > a:not(.nav-link), :scope > .logo-lockup")?.classList.add("vp-hidden-local-brand");

  if (active === "hub") {
    localHeader.querySelectorAll(".nav-links .nav-link").forEach((link) => {
      if (!link.getAttribute("href")?.includes("comunidade")) link.remove();
    });
    localHeader.querySelector(".header-actions")?.remove();
  }
  if (active === "store") {
    localHeader.querySelectorAll(".store-hub-link,.btn-twitch").forEach((node) => node.remove());
    const storeLinks = localHeader.querySelector(".nav-links");
    if (storeLinks && !storeLinks.querySelector('[href*="contato.html"]')) {
      const contact = document.createElement("a");
      contact.className = "nav-link";
      contact.href = "/store/contato.html";
      contact.textContent = "Contato";
      storeLinks.appendChild(contact);
    }
    const attendance = localHeader.querySelector(".btn-whats");
    if (attendance) {
      attendance.setAttribute("aria-label", "Atendimento da VP Store");
      attendance.classList.add("vp-store-attendance");
    }
    if (path.includes("/store/contato")) {
      storeLinks?.querySelectorAll(".nav-link").forEach((link) => link.classList.remove("active"));
      storeLinks?.querySelector('[href*="contato.html"]')?.classList.add("active");
    }
  }
  if (active === "bazaar") {
    localHeader.querySelectorAll(".bz-vpertsz-link,.bz-live-asset,.vp-bazaar-cta").forEach((node) => node.remove());
  }
  if (active === "lab") {
    localHeader.querySelectorAll(".btn-home,#store-link,.btn-twitch").forEach((node) => node.remove());
  }

  const css = document.createElement("style");
  css.textContent = `
    .vp-live-notice{position:relative;z-index:82;height:30px;display:flex;align-items:center;justify-content:center;gap:8px;padding:0 14px;background:#250b08;border-bottom:1px solid rgba(226,75,53,.28);font:600 11px/1.2 Inter,system-ui,sans-serif;color:#cbb8ab}
    .vp-live-notice>span{width:7px;height:7px;border-radius:50%;background:#e54a32;box-shadow:0 0 10px rgba(229,74,50,.7)}
    .vp-live-notice p{margin:0}.vp-live-notice a{color:#e5b34f;font-weight:800;text-decoration:none}.vp-live-notice a:hover{text-decoration:underline}

    .vp-global-header{position:relative;z-index:81;background:#080504;border-bottom:1px solid rgba(216,138,74,.2)}
    .vp-global-shell{width:min(1200px,calc(100% - 44px));height:74px;margin:auto;display:grid;grid-template-columns:220px minmax(0,1fr) 205px;align-items:center;gap:20px}
    .vp-current-brand{display:flex;width:190px;height:60px;align-items:center;justify-content:flex-start}
    .vp-current-brand img{display:block;max-width:190px;max-height:58px;width:auto;height:auto;object-fit:contain;filter:drop-shadow(0 4px 7px rgba(0,0,0,.8))}
    .vp-global-header--lab .vp-current-brand img{max-width:160px;max-height:62px}
    .vp-products{display:flex;align-items:center;justify-content:center;gap:5px;min-width:0}
    .vp-products a{position:relative;display:flex;align-items:center;gap:7px;min-height:46px;padding:0 13px;border:1px solid transparent;border-radius:11px;color:#b9a9a0;text-decoration:none;font:750 12px/1 Inter,system-ui,sans-serif;white-space:nowrap;transition:.18s ease}
    .vp-products a img{width:25px;height:25px;object-fit:contain;filter:drop-shadow(0 2px 4px #000)}
    .vp-products a:hover{color:#fff;background:rgba(255,255,255,.035)}
    .vp-products a.is-active{color:#f5d277;background:linear-gradient(180deg,#25100c,#160a08);border-color:rgba(216,80,48,.08)}
    .vp-products a.is-active::after{content:"";position:absolute;left:15px;right:15px;bottom:0;height:3px;border-radius:5px;background:linear-gradient(90deg,#e44b34,#e5b34f)}
    .vp-live-button{justify-self:end;display:flex!important;flex:0 0 196px!important;width:196px!important;min-width:196px!important;max-width:196px!important;height:54px!important;min-height:54px!important;max-height:54px!important;padding:0!important;align-items:center;justify-content:center;border-radius:10px;transition:transform .2s ease,filter .2s ease}
    .vp-live-button img{display:block!important;width:196px!important;max-width:none!important;height:49px!important;object-fit:contain}
    .vp-live-button:hover{transform:translateY(-2px) scale(1.015);filter:brightness(1.12) drop-shadow(0 8px 18px rgba(145,70,255,.3))}

    body>.vp-local-header{position:sticky!important;top:0!important;z-index:80!important;min-height:50px;background:linear-gradient(180deg,rgba(22,12,11,.985),rgba(13,8,7,.99))!important;border-bottom:1px solid rgba(216,138,74,.15)!important;box-shadow:0 12px 25px -25px #000!important;backdrop-filter:blur(12px)}
    body>.vp-local-header .nav-shell{position:relative!important;inset:auto!important;width:min(1200px,calc(100% - 44px))!important;min-height:50px!important;height:auto!important;margin:auto!important;padding:5px 0!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:14px!important;background:none!important;border:0!important;box-shadow:none!important}
    body>.vp-local-header .vp-hidden-local-brand{display:none!important}
    body>.vp-local-header .nav-links,body>.vp-local-header .main-tabs{position:static!important;inset:auto!important;order:initial!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;min-height:0!important;padding:0!important;background:none!important;border:0!important;box-shadow:none!important}
    body>.vp-local-header .header-actions{position:static!important;margin:0!important;display:flex!important;align-items:center!important;gap:7px!important}
    body>.vp-local-header .nav-link,body>.vp-local-header .main-tab{min-height:38px!important;padding:8px 13px!important;border-radius:9px!important;font-size:11px!important}
    body>.vp-local-header .main-tab::before{display:none!important}
    body>.vp-local-header .main-tab img,body>.vp-local-header .main-tab svg{width:22px!important;height:22px!important}
    body>.vp-local-header+.page{padding-top:24px!important}
    body>.vp-local-header .vp-store-attendance{flex:none!important;width:142px!important;height:42px!important;min-width:142px!important;min-height:42px!important;padding:0!important;background-size:contain!important;filter:saturate(.88) brightness(.96)!important}
    body>.vp-local-header .vp-store-attendance:hover{filter:saturate(.96) brightness(1.05)!important}

    @media(max-width:920px){
      .vp-global-shell{grid-template-columns:150px minmax(0,1fr) 145px;width:min(100% - 24px,1200px);gap:8px}
      .vp-current-brand{width:145px}.vp-current-brand img{max-width:145px}
      .vp-products a{padding:0 9px}.vp-products a span{display:none}.vp-products a img{width:30px;height:30px}
      .vp-live-button{flex-basis:140px!important;width:140px!important;min-width:140px!important;max-width:140px!important}
      .vp-live-button img{width:140px!important;height:35px!important}
    }
    @media(max-width:620px){
      .vp-live-notice{height:28px;font-size:9px}
      .vp-global-shell{height:62px;grid-template-columns:105px 1fr 96px;width:calc(100% - 16px)}
      .vp-current-brand{width:104px;height:52px}.vp-current-brand img{max-width:104px;max-height:49px}
      .vp-products{justify-content:flex-start;overflow-x:auto}.vp-products a{min-width:38px;padding:0 4px}.vp-products a img{width:27px;height:27px}
      .vp-live-button{flex-basis:94px!important;width:94px!important;min-width:94px!important;max-width:94px!important;height:40px!important;min-height:40px!important;max-height:40px!important}
      .vp-live-button img{width:94px!important;height:24px!important}
      body>.vp-local-header .nav-shell{width:100%!important;justify-content:flex-start!important;overflow-x:auto!important;padding:5px 10px!important}
      body>.vp-local-header .nav-links,body>.vp-local-header .main-tabs{justify-content:flex-start!important;flex:none!important}
    }
  `;
  document.head.appendChild(css);
})();
