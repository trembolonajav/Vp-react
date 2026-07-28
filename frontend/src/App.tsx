import type { ReactNode } from "react";
import { Route, Routes } from "react-router-dom";
import { BazaarLayout } from "./layouts/BazaarLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MarketplacePage } from "./features/bazaar/pages/MarketplacePage";
import { AnuncioPage } from "./features/bazaar/pages/AnuncioPage";
import { AnunciarPage } from "./features/bazaar/pages/AnunciarPage";
import { MeusAnunciosPage } from "./features/bazaar/pages/MeusAnunciosPage";
import { PerfilPage } from "./features/bazaar/pages/PerfilPage";
import { ChatPage } from "./features/bazaar/pages/ChatPage";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { AdminPage } from "./features/admin/pages/AdminPage";

function Protegida({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  return <ProtectedRoute requireAdmin={admin}>{children}</ProtectedRoute>;
}

export function App() {
  return (
    <Routes>
      <Route element={<BazaarLayout />}>
        <Route index element={<MarketplacePage />} />
        <Route path="anuncio/:id" element={<AnuncioPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="anunciar" element={<Protegida><AnunciarPage /></Protegida>} />
        <Route path="anunciar/:id" element={<Protegida><AnunciarPage /></Protegida>} />
        <Route path="meus-anuncios" element={<Protegida><MeusAnunciosPage /></Protegida>} />
        <Route path="perfil" element={<Protegida><PerfilPage /></Protegida>} />
        <Route path="chat" element={<Protegida><ChatPage /></Protegida>} />
      </Route>
      <Route path="admin" element={<Protegida admin><AdminPage /></Protegida>} />
    </Routes>
  );
}
