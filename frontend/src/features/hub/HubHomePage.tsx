import { Link } from "react-router-dom";
import { useConfig } from "../../hooks/useConfig";
import { Carousel } from "../shared/Carousel";
import { Handles } from "../shared/Contatos";
import { Icon } from "../shared/Icon";

export function HubHomePage() {
  const { config } = useConfig();

  return (
    <main className="page">
      <div className="container">
        <section className="hub-intro" aria-labelledby="hub-title">
          <div className="hub-intro-copy">
            <h1 id="hub-title">O ponto de encontro da comunidade Vpertsz.</h1>
            <p>Live, ferramentas para PokeIdle, marketplace, loja e os canais oficiais da comunidade.</p>
            <div className="hub-intro-actions">
              <a className="btn-icon-label btn-twitch" href="https://www.twitch.tv/vpertsz" target="_blank" rel="noreferrer" aria-label="Assistir à live do VPertsz na Twitch">
                <Icon name="twitch" />
                <span>Assistir à live</span>
              </a>
              <Link className="hub-community-btn" to="/comunidade">Grupos e canais</Link>
            </div>
          </div>
          <div className="hub-feature">
            <span className="hub-feature-label">Destaques da live</span>
            <Carousel banners={config?.banners ?? []} />
          </div>
        </section>

        <section className="services-strip" id="servicos">
          <p className="services-title">O que você procura?</p>
          <div className="services-grid">
            <Link className="asset-service-card" to="/store" aria-label="Acessar VP Store">
              <img src="/assets/tool-store.webp" alt="VP Store" width="620" height="506" loading="lazy" decoding="async" />
              <span>Compra e venda com atendimento direto.</span>
            </Link>
            <a className="asset-service-card" href="/bazaar/" aria-label="Acessar VP Bazaar">
              <img src="/assets/tool-bazaar.webp" alt="VP Bazaar" width="620" height="502" loading="lazy" decoding="async" />
              <span>Veja anúncios e negocie com outros jogadores.</span>
            </a>
            <a className="asset-service-card" href="/vplab/" aria-label="Acessar VPLab">
              <img src="/assets/tool-vplab.webp" alt="VPLab" width="620" height="463" loading="lazy" decoding="async" />
              <span>Pokédex, avaliação de IV, hunts e outras utilidades.</span>
            </a>
          </div>
        </section>

        <section className="section">
          <div className="streamer">
            <div className="streamer-brand">
              <img src="/assets/logo-vpertsz-quadrada.webp" alt="Emblema do VPertsz" width="760" height="760" loading="lazy" decoding="async" />
            </div>
            <div>
              <span className="kicker">Quem é o VPertsz</span>
              <h2>Streamer, criador e host da comunidade</h2>
              <p>
                O VPertsz joga PokeIdle World todos os dias ao vivo na frente de milhares de pessoas.
                Aqui você acompanha a live, entra nos grupos, usa as ferramentas e negocia com
                transparência — tudo com o rosto conhecido da comunidade.
              </p>
              {config && <Handles config={config} />}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
