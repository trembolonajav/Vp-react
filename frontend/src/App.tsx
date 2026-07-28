import { Route, Routes } from "react-router-dom";
import { BazaarLayout } from "./layouts/BazaarLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MarketplacePage } from "./features/bazaar/pages/MarketplacePage";
import { AnuncioPage } from "./features/bazaar/pages/AnuncioPage";
import { AnunciarPage } from "./features/bazaar/pages/AnunciarPage";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { AdminPage } from "./features/admin/pages/AdminPage";

export function App() {
  return (
    <Routes>
      <Route element={<BazaarLayout />}>
        <Route index element={<MarketplacePage />} />
        <Route path="anuncio/:id" element={<AnuncioPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route
          path="anunciar"
          element={
            <ProtectedRoute>
              <AnunciarPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route
        path="admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
