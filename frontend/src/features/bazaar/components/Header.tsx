import { Link } from "react-router-dom";

export function Header() {
  return (
    <>
      <div className="topbar">
        <span className="live-dot" aria-hidden="true"></span>
        <span>
          Negociação com intermédio da VP — fale sempre pelos&nbsp;
          <a href="#seguranca">canais oficiais</a>
        </span>
      </div>

      <header>
        <nav className="container nav-shell" aria-label="Navegação principal">
          <Link className="brand" to="/" aria-label="VP Bazaar — Início">
            <img
              className="logo"
              src="/assets/logo-vp-bazaar-horizontal-oficial.webp"
              alt="VP Bazaar"
            />
            <span className="logo-wordmark" aria-hidden="true">
              <b>VP</b> BAZAAR
            </span>
          </Link>
          <div className="nav-links">
            <Link className="nav-link active" to="/">
              Marketplace
            </Link>
            <a className="nav-link" href="#anunciar">
              Anunciar
            </a>
          </div>
          <div className="header-actions">
            <a className="bz-vpertsz-link" href="/">
              VPERTSZ
            </a>
          </div>
        </nav>
      </header>
    </>
  );
}
