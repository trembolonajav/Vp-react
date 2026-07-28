import { Link } from "react-router-dom";
import { useConfig } from "../../../hooks/useConfig";
import { Handles } from "../../shared/Contatos";

export function StoreHomePage() {
  const { config } = useConfig();
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
            {games.map((g) => (
              <Link key={g.id} className="game-card" to={`/store/negociar?g=${encodeURIComponent(g.id)}`}>
                <div className="game-art">
                  <img src={g.img} alt={g.nome} />
                </div>
                <div className="game-cta">
                  <span>{g.botao}</span>
                </div>
              </Link>
            ))}
            <div className="game-card soon" aria-hidden="true">
              <div className="soon-body">
                <img src="/assets/logo-vp-store-quadrada.webp" alt="" />
                <strong>Em breve</strong>
                <span>Novos jogos chegando à VP Store</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="streamer">
            <div className="streamer-brand">
              <img src="/assets/logo-vp-store-quadrada.webp" alt="Brasão da VP Store" />
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
