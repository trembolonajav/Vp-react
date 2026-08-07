import { Link, Outlet, useLocation } from "react-router-dom";
import { PlatformHeader } from "../shared/PlatformHeader";
import { PlatformFooter } from "../shared/PlatformFooter";

export function HubLayout() {
  const location = useLocation();
  const communityActive = location.pathname === "/comunidade";

  return (
    <>
      <PlatformHeader activeArea="hub" subnavLabel="Seções do VPertsz">
        <Link className={communityActive ? "active" : ""} to="/comunidade">Comunidade</Link>
      </PlatformHeader>

      <Outlet />

      <PlatformFooter />
    </>
  );
}
