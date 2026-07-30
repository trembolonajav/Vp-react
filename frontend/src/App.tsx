import { useEffect, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { HubLayout } from "./features/hub/HubLayout";
import { HubHomePage } from "./features/hub/HubHomePage";
import { StoreLayout } from "./features/store/StoreLayout";
import { StoreHomePage } from "./features/store/pages/StoreHomePage";
import { NegociarPage } from "./features/store/pages/NegociarPage";
import { ContatoPage } from "./features/store/pages/ContatoPage";
import { BazaarLayout } from "./layouts/BazaarLayout";
import { AnuncioPage } from "./features/bazaar/pages/AnuncioPage";
import { MarketplacePage } from "./features/bazaar/pages/MarketplacePage";
import { PerfilPage } from "./features/bazaar/pages/PerfilPage";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { AdminPage } from "./features/admin/pages/AdminPage";

function Protegida({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  return <ProtectedRoute requireAdmin={admin}>{children}</ProtectedRoute>;
}

function BazaarRedirect() {
  useEffect(() => {
    window.location.replace("/bazaar/");
  }, []);
  return null;
}

export function App() {
  return (
    <Routes>
      {/* Hub (landing) na raiz */}
      <Route element={<HubLayout />}>
        <Route index element={<HubHomePage />} />
      </Route>

      {/* Loja */}
      <Route path="store" element={<StoreLayout />}>
        <Route index element={<StoreHomePage />} />
        <Route path="negociar" element={<NegociarPage />} />
        <Route path="contato" element={<ContatoPage />} />
      </Route>

      {/* Primeira rota do Bazaar ativada isoladamente. As demais continuam no
          fallback legado até passarem pela própria validação de paridade. */}
      <Route path="bazaar" element={<BazaarLayout />}>
        <Route index element={<MarketplacePage />} />
        <Route path="anuncio/:id" element={<AnuncioPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="cadastro" element={<LoginPage />} />
        <Route path="perfil" element={<Protegida><PerfilPage /></Protegida>} />
        <Route path="perfil/:username" element={<PerfilPage />} />
      </Route>

      {/* Fallback temporário somente para as rotas Bazaar ainda não migradas. */}
      <Route path="bazaar/*" element={<BazaarRedirect />} />

      {/* Compatibilidade com links antigos; a rota oficial vive no Bazaar. */}
      <Route path="login" element={<Navigate to="/bazaar/login" replace />} />

      {/* Painel */}
      <Route path="admin" element={<Protegida admin><AdminPage /></Protegida>} />
    </Routes>
  );
}
