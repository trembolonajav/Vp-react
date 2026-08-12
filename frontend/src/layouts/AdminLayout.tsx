import { Outlet } from "react-router-dom";
import { PlatformHeader } from "../features/shared/PlatformHeader";
import { PlatformFooter } from "../features/shared/PlatformFooter";

// O painel administrativo gerencia todas as áreas (Bazaar, Store, Hub), então usa
// o cabeçalho/rodapé padrão da plataforma para não parecer "outro site".
export function AdminLayout() {
  return (
    <>
      <PlatformHeader activeArea="hub" subnavLabel="Administração" />
      <Outlet />
      <PlatformFooter />
    </>
  );
}
