import { Link, Outlet, useLocation } from "react-router-dom";
import { useConfig } from "../../hooks/useConfig";
import { Socials } from "../shared/Contatos";
import { PlatformHeader } from "../shared/PlatformHeader";

export function HubLayout() {
  const { config } = useConfig();
  const location = useLocation();
  const communityActive = location.pathname === "/comunidade";

  return (
    <>
      <PlatformHeader activeArea="hub" subnavLabel="Seções do VPertsz">
        <Link className={communityActive ? "active" : ""} to="/comunidade">Comunidade</Link>
      </PlatformHeader>

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
