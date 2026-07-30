import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const app = fs.readFileSync("frontend/src/App.tsx", "utf8");
const legacyMarketplace = fs.readFileSync("apps/vpertz-bazaar/public/bazaar.js", "utf8");
const nginx = fs.readFileSync("frontend/nginx.conf", "utf8");

test("detalhe do anúncio usa a página React antes do fallback legado", () => {
  assert.match(app, /path="bazaar" element=\{<BazaarLayout \/>}/);
  assert.match(app, /path="anuncio\/:id" element=\{<AnuncioPage \/>}/);
  assert.match(app, /path="bazaar\/\*" element=\{<BazaarRedirect \/>}/);

  const detailRoute = app.indexOf('path="anuncio/:id"');
  const legacyFallback = app.indexOf('path="bazaar/*"');
  assert.ok(detailRoute >= 0 && detailRoute < legacyFallback);
});

test("marketplace ativo encaminha o detalhe para a rota React limpa", () => {
  assert.match(
    legacyMarketplace,
    /const linkAnuncio = \(id\) => `\/bazaar\/anuncio\/\$\{encodeURIComponent\(id\)\}`/,
  );
  assert.doesNotMatch(legacyMarketplace, /const linkAnuncio = \(id\) => `anuncio\.html/);
});

test("Marketplace React é a rota index e as páginas pendentes são pontes explícitas", () => {
  assert.match(app, /<Route index element=\{<MarketplacePage \/>\} \/>/);
  assert.match(nginx, /location = \/bazaar\/\s*\{\s*try_files \/index\.html =404;/);

  const page = fs.readFileSync("frontend/src/features/bazaar/pages/MarketplacePage.tsx", "utf8");
  const header = fs.readFileSync("frontend/src/features/bazaar/components/Header.tsx", "utf8");

  assert.match(page, /to="\/bazaar\/anunciar"/);
  assert.match(page, /href="\/bazaar\/como-funciona\.html"/);
  assert.match(header, /to="\/bazaar\/anunciar"/);
  assert.doesNotMatch(page, /anunciar\.html/);
  assert.doesNotMatch(header, /anunciar\.html/);
});

test("contadores e grade do Marketplace usam a API Spring, não config.bazaar.anuncios", () => {
  const page = fs.readFileSync("frontend/src/features/bazaar/pages/MarketplacePage.tsx", "utf8");
  const stats = fs.readFileSync("frontend/src/hooks/useMarketplaceStats.ts", "utf8");
  const listings = fs.readFileSync("frontend/src/services/listingsService.ts", "utf8");

  assert.doesNotMatch(page, /config\?\.bazaar\.anuncios/);
  assert.match(stats, /listListings\(EMPTY_FILTERS/);
  assert.match(stats, /intencao: "venda"/);
  assert.match(stats, /intencao: "compra"/);
  assert.match(listings, /\/api\/v1\/listings\?/);
});

test("login e cadastro são rotas React oficiais dentro do Bazaar", () => {
  const loginPage = fs.readFileSync("frontend/src/features/auth/pages/LoginPage.tsx", "utf8");
  const protectedRoute = fs.readFileSync("frontend/src/components/ProtectedRoute.tsx", "utf8");
  const authService = fs.readFileSync("frontend/src/services/authService.ts", "utf8");

  assert.match(app, /<Route path="login" element=\{<LoginPage \/>\} \/>/);
  assert.match(app, /<Route path="cadastro" element=\{<LoginPage \/>\} \/>/);
  assert.match(app, /<Navigate to="\/bazaar\/login" replace \/>/);
  assert.match(nginx, /location = \/bazaar\/login\s*\{\s*try_files \/index\.html =404;/);
  assert.match(nginx, /location = \/bazaar\/cadastro\s*\{\s*try_files \/index\.html =404;/);
  assert.match(loginPage, /location\.pathname\.endsWith\("\/cadastro"\)/);
  assert.match(loginPage, /to="\/bazaar\/login"/);
  assert.match(loginPage, /to="\/bazaar\/cadastro"/);
  assert.match(protectedRoute, /to="\/bazaar\/login"/);
  assert.match(authService, /\/api\/v1\/auth\/login/);
  assert.match(authService, /\/api\/v1\/auth\/register/);
  assert.match(authService, /\/api\/v1\/auth\/me/);
});

test("perfil próprio e público usam React e a API Spring", () => {
  const profilePage = fs.readFileSync("frontend/src/features/bazaar/pages/PerfilPage.tsx", "utf8");
  const profileService = fs.readFileSync("frontend/src/services/profileService.ts", "utf8");
  const detail = fs.readFileSync("frontend/src/features/bazaar/pages/AnuncioPage.tsx", "utf8");

  assert.match(app, /path="perfil" element=\{<Protegida><PerfilPage \/><\/Protegida>\}/);
  assert.match(app, /path="perfil\/:username" element=\{<PerfilPage \/>\}/);
  assert.match(nginx, /location = \/bazaar\/perfil\s*\{\s*try_files \/index\.html =404;/);
  assert.match(profilePage, /const \{ username \} = useParams\(\)/);
  assert.match(profilePage, /updateMyProfile/);
  assert.match(profileService, /\/api\/v1\/profiles\/\$\{encodeURIComponent\(username\)\}/);
  assert.match(profileService, /\/api\/v1\/profiles\/me/);
  assert.match(detail, /to=\{`\/bazaar\/perfil\/\$\{encodeURIComponent\(listing\.vendedor\)\}`\}/);
  assert.doesNotMatch(detail, /perfil\.html/);
});

test("criar, editar e gerenciar anúncios usam React e a API Spring", () => {
  const form = fs.readFileSync("frontend/src/features/bazaar/pages/AnunciarPage.tsx", "utf8");
  const mine = fs.readFileSync("frontend/src/features/bazaar/pages/MeusAnunciosPage.tsx", "utf8");
  const listings = fs.readFileSync("frontend/src/services/listingsService.ts", "utf8");

  assert.match(app, /path="anunciar" element=\{<Protegida><AnunciarPage \/><\/Protegida>\}/);
  assert.match(app, /path="anunciar\/:id" element=\{<Protegida><AnunciarPage \/><\/Protegida>\}/);
  assert.match(app, /path="meus-anuncios" element=\{<Protegida><MeusAnunciosPage \/><\/Protegida>\}/);
  assert.match(nginx, /location = \/bazaar\/anunciar\s*\{\s*try_files \/index\.html =404;/);
  assert.match(nginx, /location = \/bazaar\/meus-anuncios\s*\{\s*try_files \/index\.html =404;/);
  assert.match(form, /status: form\.status/);
  assert.match(form, /max="1000"/);
  assert.match(mine, /updateListingStatus/);
  assert.match(listings, /\/api\/v1\/listings\/\$\{encodeURIComponent\(publicId\)\}\/status/);
});

test("chat e denúncias usam rotas React e dados autoritativos do Spring", () => {
  const chat = fs.readFileSync("frontend/src/features/bazaar/pages/ChatPage.tsx", "utf8");
  const detail = fs.readFileSync("frontend/src/features/bazaar/pages/AnuncioPage.tsx", "utf8");
  const reportModal = fs.readFileSync("frontend/src/features/bazaar/components/ReportModal.tsx", "utf8");
  const reports = fs.readFileSync("frontend/src/services/reportsService.ts", "utf8");

  assert.match(app, /path="chat" element=\{<Protegida><ChatPage \/><\/Protegida>\}/);
  assert.match(nginx, /location = \/bazaar\/chat\s*\{\s*try_files \/index\.html =404;/);
  assert.match(chat, /searchParams\.get\("conversation"\)/);
  assert.match(chat, /\/api\/v1\/conversations|listConversations/);
  assert.match(detail, /chat\?conversation=/);
  assert.match(detail, /ReportModal/);
  assert.match(reportModal, /createReport/);
  assert.match(reports, /\/api\/v1\/reports/);
});

test("favoritos pertencem à conta e usam Spring/PostgreSQL", () => {
  const card = fs.readFileSync("frontend/src/features/bazaar/components/ProductCard.tsx", "utf8");
  const grid = fs.readFileSync("frontend/src/features/bazaar/components/ProductGrid.tsx", "utf8");
  const service = fs.readFileSync("frontend/src/services/favoritesService.ts", "utf8");
  const migration = fs.readFileSync("backend/src/main/resources/db/migration/V6__favorites.sql", "utf8");

  assert.doesNotMatch(card, /localStorage/);
  assert.match(grid, /listFavorites/);
  assert.match(grid, /addFavorite/);
  assert.match(grid, /removeFavorite/);
  assert.match(service, /\/api\/v1\/favorites/);
  assert.match(migration, /CREATE TABLE favorites/);
  assert.match(migration, /UNIQUE \(user_id, listing_public_id\)/);
});

test("compartilhamento usa Open Graph gerado pelo Spring", () => {
  const detail = fs.readFileSync("frontend/src/features/bazaar/pages/AnuncioPage.tsx", "utf8");
  const controller = fs.readFileSync("backend/src/main/java/com/vpertz/sharing/ShareController.java", "utf8");
  const config = fs.readFileSync("backend/src/main/resources/application.yml", "utf8");

  assert.match(detail, /\/api\/v1\/share\/\$\{encodeURIComponent\(listing\.id\)\}/);
  assert.match(controller, /property="og:title"/);
  assert.match(controller, /name="twitter:card"/);
  assert.match(controller, /image\.png/);
  assert.match(controller, /\/bazaar\/anuncio\//);
  assert.match(config, /public-base-url:/);
});

test("uploads usam MinIO e mantêm metadados no PostgreSQL", () => {
  const compose = fs.readFileSync("docker-compose.yml", "utf8");
  const storage = fs.readFileSync("backend/src/main/java/com/vpertz/media/S3StorageService.java", "utf8");
  const media = fs.readFileSync("backend/src/main/java/com/vpertz/media/MediaService.java", "utf8");
  const migration = fs.readFileSync("backend/src/main/resources/db/migration/V7__media_assets.sql", "utf8");

  assert.match(compose, /minio\/minio:/);
  assert.match(compose, /STORAGE_TYPE: s3/);
  assert.match(storage, /PutObjectArgs/);
  assert.match(storage, /GetObjectArgs/);
  assert.match(media, /SHA-256/);
  assert.match(media, /saveAndFlush/);
  assert.match(migration, /CREATE TABLE media_assets/);
  assert.match(migration, /uploaded_by[^\\n]+REFERENCES users/);
});

test("administração modera denúncias e anúncios pelo Spring", () => {
  const panel = fs.readFileSync("frontend/src/features/admin/components/AdminModerationPanel.tsx", "utf8");
  const service = fs.readFileSync("frontend/src/services/adminModerationService.ts", "utf8");
  const controller = fs.readFileSync("backend/src/main/java/com/vpertz/admin/AdminController.java", "utf8");
  const listingController = fs.readFileSync("backend/src/main/java/com/vpertz/listings/ListingController.java", "utf8");
  const migration = fs.readFileSync("backend/src/main/resources/db/migration/V8__report_moderation.sql", "utf8");

  assert.match(panel, /reviewReport/);
  assert.match(panel, /moderateListing/);
  assert.match(service, /api\/v1\/admin\/reports/);
  assert.match(service, /api\/v1\/admin\/listings/);
  assert.match(controller, /@GetMapping\("\/reports"\)/);
  assert.match(controller, /@PatchMapping\("\/listings\/\{publicId\}\/status"\)/);
  assert.match(listingController, /ListingFilter[\s\S]*"ativo"\);/);
  assert.match(migration, /reviewed_by/);
  assert.match(migration, /resolution_note/);
});
