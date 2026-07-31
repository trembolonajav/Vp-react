import { Link, Outlet } from "react-router-dom";
import { useConfig } from "../../hooks/useConfig";
import { Socials } from "../shared/Contatos";

export function HubLayout() {
  const { config } = useConfig();

  return (
    <>
      <div className="topbar">
        <span className="live-dot" aria-hidden="true"></span>
        <span>
          Live todos os dias, das 18h às 22h, na&nbsp;
          <a href="https://www.twitch.tv/vpertsz" target="_blank" rel="noreferrer">twitch.tv/vpertsz</a>
        </span>
      </div>

      <header>
        <nav className="container nav-shell" aria-label="Navegação principal">
          <Link className="brand" to="/" aria-label="VPertsz — Início">
            <img className="logo" src="/assets/logo-vpertsz-horizontal.webp" alt="VPertsz" />
            <span className="logo-wordmark" aria-hidden="true">VPERTSZ</span>
          </Link>
          <div className="nav-links">
            <a className="nav-link" href="/vplab/">Ferramentas</a>
            <Link className="nav-link" to="/store">VP Store</Link>
            <a className="nav-link" href="/bazaar/">VP Bazaar</a>
            <Link className="nav-link" to="/comunidade">Comunidade</Link>
          </div>
          <div className="header-actions">
            <a
              className="header-live-asset"
              href="https://www.twitch.tv/vpertsz"
              target="_blank"
              rel="noreferrer"
              aria-label="Assistir à live do VPertsz na Twitch"
            >
              <img src="/assets/btn-assistir-live.webp" alt="Assistir live" />
            </a>
          </div>
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
