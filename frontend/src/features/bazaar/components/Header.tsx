import { Link } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";

export function Header() {
  const { user, logout } = useAuth();

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
            <Link className="nav-link" to="/anunciar">
              Anunciar
            </Link>
            {user?.role === "ADMIN" && (
              <Link className="nav-link" to="/admin">
                Painel
              </Link>
            )}
          </div>
          <div className="header-actions">
            {user ? (
              <>
                <span className="nav-user">{user.username}</span>
                <button className="bz-vpertsz-link" type="button" onClick={logout}>
                  Sair
                </button>
              </>
            ) : (
              <Link className="bz-vpertsz-link" to="/login">
                Entrar
              </Link>
            )}
          </div>
        </nav>
      </header>
    </>
  );
}
