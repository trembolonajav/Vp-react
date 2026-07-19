/* VP Store — Service Worker
   Objetivo: deixar o site instalável (PWA) e com um fallback offline.
   Estratégia: NETWORK FIRST — sempre tenta a rede; só usa cache quando offline.
   NÃO intercepta a API (/api/*) nem chamadas que mudam estado.
   NÃO cacheia dinamicamente — evita servir conteúdo velho no navegador. */

const CACHE_NAME = "vp-shell-v1";
const OFFLINE_URL = "/offline.html";

/* Só o mínimo garantido que existe — se um item falhar, o install falha. */
const SHELL_ASSETS = [
  "/",
  "/offline.html",
  "/manifest.json",
  "/icon-192.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  /* Não mexe em: API, outra origem, extensões. */
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.protocol === "chrome-extension:"
  ) {
    return;
  }

  /* Só GET. Uploads/logins (POST/PUT) passam direto pela rede. */
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request).catch(() => {
      if (event.request.mode === "navigate") return caches.match(OFFLINE_URL);
      return caches.match(event.request);
    })
  );
});
