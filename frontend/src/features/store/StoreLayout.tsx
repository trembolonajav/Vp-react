import { Link, Outlet } from "react-router-dom";
import { useConfig } from "../../hooks/useConfig";
import { Socials } from "../shared/Contatos";
import { Icon } from "../shared/Icon";
import { waLink } from "../../utils/whatsapp";

export function StoreLayout() {
  const { config } = useConfig();
  const wa = config
    ? waLink(config.whatsapp, "Olá, VP Store! Preciso de atendimento e gostaria de falar com a equipe da loja.")
    : "#";

  return (
    <>
      <header>
        <nav className="container nav-shell" aria-label="Navegação principal">
          <Link to="/store" aria-label="VP Store — Início">
            <img className="logo" src="/assets/logo-vp-store-horizontal.webp" alt="VP Store" />
          </Link>
          <div className="nav-links">
            <Link className="nav-link" to="/store">Jogos</Link>
            <Link className="nav-link" to="/store/negociar">Comprar &amp; Vender</Link>
            <Link className="nav-link" to="/store/intermedio">Intermédio</Link>
            <Link className="nav-link" to="/store/contato">Contato</Link>
          </div>
          <div className="header-actions">
            <Link className="store-hub-link" to="/">VPERTSZ</Link>
            <a className="btn-icon-label btn-twitch" href="https://www.twitch.tv/vpertsz" target="_blank" rel="noreferrer">
              <Icon name="twitch" />
              <span>Live</span>
            </a>
            <a className="btn-icon-label btn-whats" href={wa} target="_blank" rel="noreferrer">
              <Icon name="whatsapp" />
              Negociar
            </a>
          </div>
        </nav>
      </header>

      <Outlet />

      <footer>
        <div className="container">
          <div className="footer-grid">
            <div className="footer-about">
              <img className="footer-logo" src="/assets/logo-vp-store-horizontal.webp" alt="VP Store" />
              <p>Compra e venda de diamonds do PokeIdle World, intermédio e atendimento comercial oficial.</p>
            </div>
            <div>
              <div className="footer-title">Navegação</div>
              <div className="footer-links">
                <Link to="/store">Início</Link>
                <Link to="/store/negociar">Comprar &amp; Vender</Link>
                <Link to="/store/intermedio">Intermédio</Link>
                <Link to="/store/contato">Contato</Link>
                <Link to="/">VPertsz</Link>
              </div>
            </div>
            <div className="footer-social-column">
              <div className="footer-title">Acompanhe o VPertsz</div>
              {config && <Socials config={config} />}
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 VP Store — todos os direitos reservados.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
