/* Registra o Service Worker apenas em produção.
   No dev-server local (localhost/127.0.0.1) fica desligado para não
   cachear nada durante o desenvolvimento. Precisa ser arquivo externo
   porque a CSP do site não permite <script> inline. */
(function () {
  var host = location.hostname;
  var isLocal = host === "localhost" || host === "127.0.0.1" || host === "";
  if (isLocal || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/sw.js").catch(function () {});
  });
})();
