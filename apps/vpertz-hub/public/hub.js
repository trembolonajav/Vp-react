/* ============================================================
   VPERTSZ — hub (página inicial)
   A configuração vem do servidor (/api/config); dados.js é o
   fallback offline. Depende de /config.js (vpFetchConfig, vpEsc,
   vpIcon, vpWaLink).
   ============================================================ */

(async () => {

const CFG = await vpFetchConfig();
const esc = vpEsc;

const isExternal = (url) => /^https?:\/\//i.test(url);
const contactHref = (c) => (c.url && c.url.trim()) ? c.url : vpWaLink(CFG, CFG.msgNegociar);
const targetAttr = (url) => isExternal(url) ? ' target="_blank" rel="noreferrer"' : "";

/* Links de banner vêm da config da loja e podem apontar para páginas que
   agora vivem em /store/ (ou para a comunidade, aqui no hub). */
const normalizeLink = (link) => {
  const l = String(link || "").trim();
  if (!l) return "#";
  if (l === "contato.html") return "/comunidade.html";
  if (/^(https?:|\/|#|mailto:)/i.test(l)) return l;
  return "/store/" + l.replace(/^\.?\//, "");
};

/* ---------------------------------------------- marca (logo -> wordmark) */
document.querySelectorAll(".brand").forEach((brand) => {
  const img = brand.querySelector(".logo");
  if (!img) return;
  const falhou = () => brand.classList.add("no-art");
  if (img.complete && img.naturalWidth === 0) falhou();
  img.addEventListener("error", falhou);
});

/* ---------------------------------------------- carrossel */
const carousel = document.querySelector(".carousel");
if (carousel) {
  const slidesEl = carousel.querySelector(".slides");
  const dotsEl = carousel.querySelector(".dots");
  const banners = Array.isArray(CFG.banners) ? CFG.banners : [];

  slidesEl.innerHTML = banners.map((b) => {
    const link = normalizeLink(b.link);
    return `<a class="slide" href="${esc(link)}"${targetAttr(link)}>
      <img src="${esc(b.img)}" alt="${esc(b.alt || "Destaque VPertsz")}">
    </a>`;
  }).join("");

  dotsEl.innerHTML = banners.map((_, i) =>
    `<button class="dot${i === 0 ? " active" : ""}" aria-label="Banner ${i + 1}"></button>`).join("");

  const dots = [...dotsEl.children];
  let current = 0;
  let timer = null;

  if (banners.length < 2) {
    carousel.querySelectorAll(".carousel-btn").forEach((b) => (b.style.display = "none"));
    dotsEl.style.display = "none";
  } else {
    const show = (i) => {
      current = (i + dots.length) % dots.length;
      slidesEl.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, n) => d.classList.toggle("active", n === current));
      restart();
    };
    const restart = () => {
      clearInterval(timer);
      timer = setInterval(() => show(current + 1), 6000);
    };

    carousel.querySelector(".prev").addEventListener("click", () => show(current - 1));
    carousel.querySelector(".next").addEventListener("click", () => show(current + 1));
    dots.forEach((d, i) => d.addEventListener("click", () => show(i)));
    carousel.addEventListener("mouseenter", () => clearInterval(timer));
    carousel.addEventListener("mouseleave", restart);

    let startX = null;
    carousel.addEventListener("pointerdown", (e) => { startX = e.clientX; }, { passive: true });
    carousel.addEventListener("pointerup", (e) => {
      if (startX === null) return;
      const delta = e.clientX - startX;
      if (Math.abs(delta) > 45) show(current + (delta < 0 ? 1 : -1));
      startX = null;
    }, { passive: true });

    show(0);
  }
}

/* ---------------------------------------------- grade de ferramentas
   Cada ferramenta é uma placa (a arte já traz o nome). Exibida com
   mix-blend-mode:screen sobre o card escuro. Se a arte faltar, cai no
   wordmark de texto (.no-art). */
const TOOLS = [
  { nome: "VP Store",  href: "/store/",  art: "/assets/tool-store.webp" },
  { nome: "VP Bazaar", href: "/bazaar/", art: "/assets/tool-bazaar.webp" },
  { nome: "VPLab",     href: "/vplab/",  art: "/assets/tool-vplab.webp" }
];

document.querySelectorAll("[data-tools-grid]").forEach((grid) => {
  grid.innerHTML = TOOLS.map((t) => `
    <a class="tool-card" href="${esc(t.href)}" aria-label="Acessar ${esc(t.nome)}">
      <img alt="${esc(t.nome)}" src="${esc(t.art)}" data-tool-art>
      <b class="tool-name">${esc(t.nome)}</b>
    </a>`).join("");

  /* se a arte da placa não existir, mostra o wordmark de texto */
  grid.querySelectorAll("[data-tool-art]").forEach((img) => {
    const card = img.closest(".tool-card");
    const falhou = () => card.classList.add("no-art");
    if (img.complete && img.naturalWidth === 0) falhou();
    img.addEventListener("error", falhou);
  });
});

/* ---------------------------------------------- chips do streamer */
document.querySelectorAll("[data-handles]").forEach((box) => {
  box.innerHTML = (CFG.contatos || []).map((c) => `
    <a class="handle" href="${esc(contactHref(c))}"${targetAttr(contactHref(c))}>
      ${vpIcon(c.icone)}${esc(c.info || c.nome)}
    </a>`).join("");
});

/* ---------------------------------------------- redes do rodapé */
document.querySelectorAll("[data-socials]").forEach((box) => {
  box.innerHTML = (CFG.contatos || []).map((c) => `
    <a class="social" href="${esc(contactHref(c))}"${targetAttr(contactHref(c))} aria-label="${esc(c.nome)}${esc(c.info ? " " + c.info : "")}">
      ${vpIcon(c.icone)}
    </a>`).join("");
});

})();
