import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { HubLayout } from "./features/hub/HubLayout";
import { HubHomePage } from "./features/hub/HubHomePage";
import { ComunidadePage } from "./features/hub/ComunidadePage";
import { VplabLayout } from "./features/vplab/VplabLayout";
import { SeoManager } from "./seo";

const StoreLayout = lazy(() => import("./features/store/StoreLayout").then((m) => ({ default: m.StoreLayout })));
const StoreHomePage = lazy(() => import("./features/store/pages/StoreHomePage").then((m) => ({ default: m.StoreHomePage })));
const NegociarPage = lazy(() => import("./features/store/pages/NegociarPage").then((m) => ({ default: m.NegociarPage })));
const ContatoPage = lazy(() => import("./features/store/pages/ContatoPage").then((m) => ({ default: m.ContatoPage })));
const IntermedioPage = lazy(() => import("./features/store/pages/IntermedioPage").then((m) => ({ default: m.IntermedioPage })));
const OfflinePage = lazy(() => import("./features/store/pages/OfflinePage").then((m) => ({ default: m.OfflinePage })));
const BazaarLayout = lazy(() => import("./layouts/BazaarLayout").then((m) => ({ default: m.BazaarLayout })));
const LoginPage = lazy(() => import("./features/auth/pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const AdminPage = lazy(() => import("./features/admin/pages/AdminPage").then((m) => ({ default: m.AdminPage })));
const AnuncioPage = lazy(() => import("./features/bazaar/pages/AnuncioPage").then((m) => ({ default: m.AnuncioPage })));
const MarketplacePage = lazy(() => import("./features/bazaar/pages/MarketplacePage").then((m) => ({ default: m.MarketplacePage })));
const PerfilPage = lazy(() => import("./features/bazaar/pages/PerfilPage").then((m) => ({ default: m.PerfilPage })));
const AnunciarPage = lazy(() => import("./features/bazaar/pages/AnunciarPage").then((m) => ({ default: m.AnunciarPage })));
const MeusAnunciosPage = lazy(() => import("./features/bazaar/pages/MeusAnunciosPage").then((m) => ({ default: m.MeusAnunciosPage })));
const ChatPage = lazy(() => import("./features/bazaar/pages/ChatPage").then((m) => ({ default: m.ChatPage })));
const ComoFuncionaPage = lazy(() => import("./features/bazaar/pages/ComoFuncionaPage").then((m) => ({ default: m.ComoFuncionaPage })));
const ContaPage = lazy(() => import("./features/bazaar/pages/ContaPage").then((m) => ({ default: m.ContaPage })));
const LauncherPage = lazy(() => import("./features/launcher/LauncherPage").then((m) => ({ default: m.LauncherPage })));

const IvScannerPage = lazy(() =>
  import("./features/vplab/pages/IvScannerPage").then((module) => ({ default: module.IvScannerPage })));
const PokedexPage = lazy(() =>
  import("./features/vplab/pages/PokedexPage").then((module) => ({ default: module.PokedexPage })));
const PokeFipePage = lazy(() =>
  import("./features/vplab/pages/PokeFipePage").then((module) => ({ default: module.PokeFipePage })));
const HuntRoutePage = lazy(() =>
  import("./features/vplab/pages/HuntRoutePage").then((module) => ({ default: module.HuntRoutePage })));
const BreedingPage = lazy(() =>
  import("./features/vplab/pages/BreedingPage").then((module) => ({ default: module.BreedingPage })));
const ClanPage = lazy(() =>
  import("./features/vplab/pages/ClanPage").then((module) => ({ default: module.ClanPage })));
const ProfessionsPage = lazy(() =>
  import("./features/vplab/pages/ProfessionsPage").then((module) => ({ default: module.ProfessionsPage })));

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
    <><SeoManager /><Suspense fallback={<main className="page"><div className="container">Carregando…</div></main>}><Routes>
      {/* Hub (landing) na raiz */}
      <Route element={<HubLayout />}>
        <Route index element={<HubHomePage />} />
        <Route path="comunidade" element={<ComunidadePage />} />
      </Route>

      {/* Loja */}
      <Route path="store" element={<StoreLayout />}>
        <Route index element={<StoreHomePage />} />
        <Route path="jogos" element={<StoreHomePage />} />
        <Route path="negociar" element={<NegociarPage />} />
        <Route path="contato" element={<ContatoPage />} />
        <Route path="intermedio" element={<IntermedioPage />} />
        <Route path="offline" element={<OfflinePage />} />
        <Route path="admin" element={<Navigate to="/admin" replace />} />
        <Route path="jogos.html" element={<Navigate to="/store/jogos" replace />} />
        <Route path="offline.html" element={<Navigate to="/store/offline" replace />} />
        <Route path="intermedio.html" element={<Navigate to="/store/intermedio" replace />} />
        <Route path="admin.html" element={<Navigate to="/admin" replace />} />
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
        <Route path="anunciar" element={<Protegida><AnunciarPage /></Protegida>} />
        <Route path="anunciar/:id" element={<Protegida><AnunciarPage /></Protegida>} />
        <Route path="meus-anuncios" element={<Protegida><MeusAnunciosPage /></Protegida>} />
        <Route path="chat" element={<Protegida><ChatPage /></Protegida>} />
        <Route path="como-funciona" element={<ComoFuncionaPage />} />
        <Route path="conta" element={<Protegida><ContaPage /></Protegida>} />
        <Route path="como-funciona.html" element={<Navigate to="/bazaar/como-funciona" replace />} />
        <Route path="conta.html" element={<Navigate to="/bazaar/conta" replace />} />
      </Route>

      {/* Fallback temporário somente para as rotas Bazaar ainda não migradas. */}
      <Route path="bazaar/*" element={<BazaarRedirect />} />

      {/* Compatibilidade com links antigos; a rota oficial vive no Bazaar. */}
      <Route path="login" element={<Navigate to="/bazaar/login" replace />} />

      {/* Página pública de apresentação e download do Vperts Multi. */}
      <Route path="multi" element={<LauncherPage />} />
      <Route path="vplauncher" element={<LauncherPage />} />

      {/* Painel */}
      <Route path="admin" element={<Protegida admin><AdminPage /></Protegida>} />

      {/* O layout compartilhado mantém o cabeçalho e a navegação consistentes
          em todas as ferramentas oficiais do VPLab. */}
      <Route path="vplab" element={<VplabLayout />}>
        <Route index element={
          <Suspense fallback={<main className="page"><div className="container">Carregando Avaliar IV…</div></main>}>
            <IvScannerPage />
          </Suspense>
        } />
        <Route path="avaliar-iv" element={
          <Suspense fallback={<main className="page"><div className="container">Carregando Avaliar IV…</div></main>}>
            <IvScannerPage />
          </Suspense>
        } />
        <Route path="pokedex" element={
          <Suspense fallback={<main className="page"><div className="container">Carregando Pokédex…</div></main>}>
            <PokedexPage />
          </Suspense>
        } />
        <Route path="pokefipe" element={
          <Suspense fallback={<main className="page"><div className="container">Carregando PokeFipe…</div></main>}>
            <PokeFipePage />
          </Suspense>
        } />
        <Route path="rota" element={
          <Suspense fallback={<main className="page"><div className="container">Calculando rota…</div></main>}>
            <HuntRoutePage />
          </Suspense>
        } />
        <Route path="breeding" element={<Suspense fallback={<main className="page"><div className="container">Calculando Breeding…</div></main>}><BreedingPage /></Suspense>} />
        <Route path="clas" element={<Suspense fallback={<main className="page"><div className="container">Carregando clãs…</div></main>}><ClanPage /></Suspense>} />
        <Route path="profissoes" element={<Suspense fallback={<main className="page"><div className="container">Carregando profissões…</div></main>}><ProfessionsPage /></Suspense>} />
      </Route>
    </Routes></Suspense></>
  );
}
