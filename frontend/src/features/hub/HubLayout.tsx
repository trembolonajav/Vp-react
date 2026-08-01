import { Link, Outlet, useLocation } from "react-router-dom";
import { useConfig } from "../../hooks/useConfig";
import { Socials } from "../shared/Contatos";

export function HubLayout() {
  const { config } = useConfig();
  const location = useLocation();
  const communityActive = location.pathname === "/comunidade";

  return (
    <>
      <div className="topbar">
        <span className="live-dot" aria-hidden="true"></span>
        <span>
          Live todos os dias, das 18h às 22h, na&nbsp;
          <a href="https://www.twitch.tv/vpertsz" target="_blank" rel="noreferrer">twitch.tv/vpertsz</a>
        </span>
      </div>

      <header className="hub-header">
        <nav className="container hub-nav-shell" aria-label="Navegação principal">
          <Link className="hub-brand" to="/" aria-label="VPertsz — Início">
            <img src="/assets/hub/header/vpertsz.png" alt="VPertsz" />
          </Link>
          <div className="hub-family-links">
            <a href="/vplab/"><img src="/assets/hub/header/vplab.png" alt="" /><span>Ferramentas</span></a>
            <Link to="/store"><img src="/assets/hub/header/vp-store.png" alt="" /><span>VP Store</span></Link>
            <a href="/bazaar/"><img src="/assets/hub/header/vp-bazaar.png" alt="" /><span>VP Bazaar</span></a>
            <Link className={!communityActive ? "active" : ""} to="/"><img src="/assets/hub/header/vpertsz.png" alt="" /><span>VPertsz</span></Link>
          </div>
          <div className="hub-header-actions">
            <a
              className="header-live-asset"
              href="https://www.twitch.tv/vpertsz"
              target="_blank"
              rel="noreferrer"
              aria-label="Assistir à live do VPertsz na Twitch"
            >
              <img src="/assets/hub/header/assistir-live.png" alt="Assistir live" />
            </a>
          </div>
        </nav>
        <nav className="hub-subnav" aria-label="Seções do VPertsz">
          <div className="container"><Link className={communityActive ? "active" : ""} to="/comunidade">Comunidade</Link></div>
        </nav>
      </header>

      <Outlet />

      <footer>
        <div className="container">
          <div className="footer-grid">
            <div className="footer-about">
              <img className="footer-logo" src="/assets/logo-vpertsz-horizontal.webp" alt="VPertsz" />
              <p>
                O hub oficial do streamer VPertsz: ferramentas, comunidade e a live diária do
                PokeIdle World. Negociação transparente e comunidade ativa todos os dias.
              </p>
            </div>
            <div>
              <div className="footer-title">Navegação</div>
              <div className="footer-links">
                <a href="/vplab/">Ferramentas</a>
                <Link to="/store">VP Store</Link>
                <a href="/bazaar/">VP Bazaar</a>
                <Link to="/comunidade">Comunidade</Link>
              </div>
            </div>
            <div className="footer-social-column">
              <div className="footer-title">Acompanhe o VPertsz</div>
              {config && <Socials config={config} />}
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 VPertsz — todos os direitos reservados.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
