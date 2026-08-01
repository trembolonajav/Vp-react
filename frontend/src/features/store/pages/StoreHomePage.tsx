import { Link } from "react-router-dom";
import { useConfig } from "../../../hooks/useConfig";
import { Handles } from "../../shared/Contatos";
import { assetUrl } from "../../../utils/assets";

export function StoreHomePage() {
  const { config, loading, error } = useConfig();
  const games = config?.games.filter((g) => g.ativo) ?? [];

  return (
    <main className="page">
      <div className="container">
        <section className="section" id="jogos">
          <div className="section-head center">
            <div>
              <span className="kicker">Escolha seu jogo</span>
              <h2>Comece sua negociação</h2>
              <p className="section-sub">Clique no jogo para comprar ou vender com atendimento direto.</p>
              <div className="ornament" aria-hidden="true"></div>
            </div>
          </div>
          <div className="games-grid">
            {loading && <p className="store-config-state" role="status">Carregando jogos…</p>}
            {error && (
              <p className="store-config-state error" role="alert">
                Não foi possível carregar os jogos agora. Tente novamente em instantes.
              </p>
            )}
            {games.map((g) => (
              <Link key={g.id} className="game-card" to={`/store/negociar?g=${encodeURIComponent(g.id)}`}>
                <div className="game-art">
                  <img src={assetUrl(g.img)} alt={g.nome} />
                </div>
                <div className="game-cta">
                  <span>{g.botao}</span>
                </div>
              </Link>
            ))}
            {!loading && !error && <div className="game-card soon" aria-hidden="true">
              <div className="soon-body">
                <img src="/assets/platform/header/vp-store-logo_quadrada.png" alt="" />
                <strong>Em breve</strong>
                <span>Novos jogos chegando à VP Store</span>
              </div>
            </div>}
          </div>
        </section>

        <section className="section">
          <div className="trust">
            <div className="trust-item"><div className="trust-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 3 14h7l-1 8L19 10h-7z" /></svg></div><div><strong>Entrega rápida</strong><span>Negociação direta, sem enrolação, durante a live ou pelo WhatsApp.</span></div></div>
            <div className="trust-item"><div className="trust-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1 3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5Zm-1.4 15.4-3.9-3.9 1.6-1.6 2.3 2.3 5.1-5.1 1.6 1.6Z" /></svg></div><div><strong>Atendimento do próprio streamer</strong><span>Você fala com o Vperts, rosto conhecido da comunidade PokeIdle.</span></div></div>
            <div className="trust-item"><div className="trust-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 11c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3Zm-8 0c1.7 0 3-1.3 3-3S9.7 5 8 5 5 6.3 5 8s1.3 3 3 3Zm0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5C15 14.2 10.3 13 8 13Zm8 0c-.3 0-.6 0-1 .1 1.2.8 2 1.9 2 3.4V19h6v-2.5c0-2.3-4.7-3.5-7-3.5Z" /></svg></div><div><strong>Comunidade ativa</strong><span>Sorteio semanal de 50 diamantes para membros do grupo.</span></div></div>
          </div>
        </section>

        <section className="section">
          <div className="streamer">
            <div className="streamer-brand">
              <img src="/assets/platform/header/vp-store-logo_quadrada.png" alt="Brasão da VP Store" />
            </div>
            <div>
              <span className="kicker">Quem está por trás da loja</span>
              <h2>A loja oficial do Vperts</h2>
              <p>
                A VP Store nasceu dentro da live. Aqui você negocia diamonds do PokeIdle World com
                quem joga todos os dias na frente de milhares de pessoas — transparência total, do
                início da conversa até a entrega.
              </p>
              {config && <Handles config={config} />}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
