import { Link, Outlet, useLocation } from "react-router-dom";
import { PlatformHeader } from "../shared/PlatformHeader";
import { PlatformFooter } from "../shared/PlatformFooter";

export function StoreLayout() {
  const location = useLocation();
  const active = (path:string) => location.pathname === path || (path !== "/store" && location.pathname.startsWith(path));

  return (
    <>
      <PlatformHeader activeArea="store" subnavLabel="Seções da VP Store">
        <Link className={active("/store") ? "active" : ""} to="/store">Jogos</Link><Link className={active("/store/negociar") ? "active" : ""} to="/store/negociar">Comprar &amp; Vender</Link><Link className={active("/store/intermedio") ? "active" : ""} to="/store/intermedio">Intermédio</Link><Link className={active("/store/contato") ? "active" : ""} to="/store/contato">Contato</Link>
      </PlatformHeader>

      <Outlet />

      <PlatformFooter />
    </>
  );
}
