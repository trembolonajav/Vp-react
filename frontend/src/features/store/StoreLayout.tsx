import { Link, Outlet } from "react-router-dom";
import { useConfig } from "../../hooks/useConfig";
import { Socials } from "../shared/Contatos";
import { PlatformHeader } from "../shared/PlatformHeader";

export function StoreLayout() {
  const { config } = useConfig();

  return (
    <>
      <PlatformHeader activeArea="store" subnavLabel="Seções da VP Store">
        <Link to="/store">Jogos</Link><Link to="/store/negociar">Comprar &amp; Vender</Link><Link to="/store/intermedio">Intermédio</Link><Link to="/store/contato">Contato</Link>
      </PlatformHeader>

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
