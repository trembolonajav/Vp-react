import { Link } from "react-router-dom";

export function OfflinePage() {
  return (
    <main className="page store-offline-page">
      <section className="store-offline-card" aria-labelledby="store-offline-title">
        <img src="/assets/logo-vp-store-quadrada.webp" alt="VP Store" />
        <h1 id="store-offline-title">Você está sem conexão</h1>
        <p>Não foi possível carregar a VP Store agora. Verifique sua internet e tente novamente.</p>
        <Link className="btn primary" to="/store">Tentar de novo</Link>
      </section>
    </main>
  );
}
