import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { listAdminConversations, listAdminReports } from "../../../services/adminModerationService";
import { AdminOverview } from "../components/AdminOverview";
import { AdminModerationPanel } from "../components/AdminModerationPanel";
import { AdminIntermediaryPanel } from "../components/AdminIntermediaryPanel";
import { AdminWhatsAppPanel } from "../components/AdminWhatsAppPanel";
import { AdminConfigProvider } from "../config/AdminConfigContext";
import { AdminStorePanel } from "../config/AdminStorePanel";
import { AdminHubPanel } from "../config/AdminHubPanel";
import { AdminBazaarPanel } from "../config/AdminBazaarPanel";
import { AdminSaveBar } from "../config/AdminSaveBar";

// Porte fiel da tela 13 "Painel de admin": shell de duas colunas (sidebar + conteúdo).
// A sidebar troca a vista; "Visão geral" é o dashboard (AdminOverview) e "Configurações"
// reaproveita o editor de config existente. Badges vêm de contagens reais.

type Vista = "geral" | "intermedios" | "denuncias" | "anuncios" | "whatsapp" | "store" | "hub" | "config";

const SCOPED = `
.bzadminshell [data-h=nav]:hover{border-color:rgba(229,179,79,.4) !important;color:#f7eee7 !important}
.bzadminshell [data-h=sair]:hover{border-color:#c33629 !important;color:#f7d9d2 !important}
@media(max-width:900px){.bzadminshell-grid{grid-template-columns:1fr !important}}
@media(max-width:1100px){.bzadmin .admin-kpi-grid{grid-template-columns:repeat(2,1fr) !important}.bzadmin .admin-2col{grid-template-columns:1fr !important}}
`;

const NAV: Array<{ id: Vista; simbolo: string; rotulo: string }> = [
  { id: "geral", simbolo: "◧", rotulo: "Visão geral" },
  { id: "intermedios", simbolo: "⛨", rotulo: "Intermédios" },
  { id: "denuncias", simbolo: "⚠", rotulo: "Denúncias" },
  { id: "anuncios", simbolo: "☰", rotulo: "Anúncios" },
  { id: "whatsapp", simbolo: "◉", rotulo: "WhatsApp" },
  { id: "store", simbolo: "▦", rotulo: "VP Store" },
  { id: "hub", simbolo: "❖", rotulo: "VPertsz" },
  { id: "config", simbolo: "⚙", rotulo: "Configurações" },
];

const svg = (children: ReactNode) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const ICONS: Record<Vista, ReactNode> = {
  geral: svg(<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></>),
  intermedios: svg(<path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6z" />),
  denuncias: svg(<><path d="M12 3.5 21 19H3z" /><path d="M12 10v4" /><path d="M12 17h.01" /></>),
  anuncios: svg(<><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h10" /></>),
  whatsapp: svg(<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.3-.6L3 21l1.8-5.1A8.3 8.3 0 0 1 3.6 11.5 8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4Z" />),
  store: svg(<><path d="M5 8h14l-1 12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>),
  hub: svg(<path d="M12 3.2l2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4-3.9 5.6-.8z" />),
  config: svg(<><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" /></>),
};

export function AdminPage() {
  const { logout, user } = useAuth();
  const [vista, setVista] = useState<Vista>("geral");
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      listAdminConversations("intermedio-solicitado", controller.signal),
      listAdminReports("aberta", controller.signal),
    ])
      .then(([conversas, reports]) => setCounts({ intermedios: conversas.conversations.length, denuncias: reports.totalElements }))
      .catch(() => { /* badges são opcionais */ });
    return () => controller.abort();
  }, []);

  return (
    <main className="page bzadminshell">
      <style>{SCOPED}</style>
      <div className="container" style={{ maxWidth: 1500 }}>
        <div className="bzadminshell-grid" style={{ display: "grid", gridTemplateColumns: "236px minmax(0,1fr)", gap: 16, alignItems: "start" }}>

          <aside style={{ border: "1px solid rgba(229,179,79,.22)", borderRadius: 12, background: "linear-gradient(180deg,#1a1210,#120c0a)", overflow: "hidden", position: "sticky", top: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", borderBottom: "1px solid rgba(229,179,79,.16)" }}>
              <img src="/assets/logo-vp-bazaar-quadrada-oficial.webp" alt="" style={{ width: 30, height: 30, objectFit: "contain" }} />
              <div>
                <div style={{ font: "700 12.5px/1 Cinzel, serif", letterSpacing: ".06em", color: "#f7eee7" }}>Administração</div>
                <div style={{ marginTop: 5, font: "700 8.5px/1 Inter", letterSpacing: ".14em", textTransform: "uppercase", color: "#c33629" }}>Acesso restrito</div>
              </div>
            </div>
            <div style={{ padding: 8 }}>
              {NAV.map((n) => {
                const ativa = vista === n.id;
                const badge = counts[n.id];
                return (
                  <button key={n.id} data-h="nav" onClick={() => setVista(n.id)} style={navBtn(ativa)}>
                    <span style={{ flex: "none", display: "grid", placeItems: "center", width: 17, height: 17, color: "#e5b34f" }}>{ICONS[n.id]}</span>{n.rotulo}
                    {badge ? <span style={{ marginLeft: "auto", minWidth: 18, height: 18, padding: "0 5px", boxSizing: "border-box", display: "grid", placeItems: "center", borderRadius: 999, background: "linear-gradient(180deg,#c33629,#7d1a15)", font: "800 9.5px/1 Inter", color: "#fff" }}>{badge}</span> : null}
                  </button>
                );
              })}
            </div>
            <div style={{ padding: "11px 13px", borderTop: "1px solid rgba(229,179,79,.14)", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ minWidth: 0, flex: 1, font: "600 11px/1.3 Inter", color: "#b5a196", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.username}</span>
              <button type="button" data-h="sair" onClick={logout} style={{ flex: "none", padding: "6px 11px", borderRadius: 7, cursor: "pointer", border: "1px solid rgba(216,138,74,.3)", background: "rgba(10,6,5,.5)", font: "700 10px/1 Inter", letterSpacing: ".06em", textTransform: "uppercase", color: "#e6d3b4" }}>Sair</button>
            </div>
          </aside>

          <div style={{ minWidth: 0 }}>
            {vista === "geral" && <AdminOverview onNavigate={setVista} />}
            {vista === "intermedios" && <div className="an-form-wrap" style={{ maxWidth: "none" }}><AdminIntermediaryPanel /></div>}
            {vista === "denuncias" && <div className="an-form-wrap" style={{ maxWidth: "none" }}><AdminModerationPanel initialTab="reports" /></div>}
            {vista === "anuncios" && <div className="an-form-wrap" style={{ maxWidth: "none" }}><AdminModerationPanel initialTab="listings" /></div>}
            {vista === "whatsapp" && <div className="an-form-wrap" style={{ maxWidth: "none" }}><AdminWhatsAppPanel /></div>}
            {(vista === "store" || vista === "hub" || vista === "config") && (
              <AdminConfigProvider>
                <div className="an-form-wrap" style={{ maxWidth: "none" }}>
                  {vista === "store" && <ConfigHeader kicker="VP Store" titulo="Gestão da loja" sub="Catálogo de diamonds (jogos), contato de WhatsApp e mensagem de negociação da loja." />}
                  {vista === "hub" && <ConfigHeader kicker="VPertsz" titulo="Gestão do hub" sub="Banners do carrossel e contatos da comunidade exibidos na página inicial." />}
                  {vista === "config" && <ConfigHeader kicker="Configurações" titulo="Ajustes do Bazaar" sub="Disponibilidade, mensagens, servidores e categorias do marketplace." />}
                  {vista === "store" && <AdminStorePanel />}
                  {vista === "hub" && <AdminHubPanel />}
                  {vista === "config" && <AdminBazaarPanel />}
                  <AdminSaveBar />
                </div>
              </AdminConfigProvider>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function ConfigHeader({ kicker, titulo, sub }: { kicker: string; titulo: string; sub: string }) {
  return (
    <div>
      <span style={{ font: "800 10.5px/1 Inter", letterSpacing: ".2em", textTransform: "uppercase", color: "#c33629" }}>{kicker}</span>
      <h1 style={{ margin: "9px 0 0", font: "700 28px/1.05 Cinzel, serif", color: "#f7eee7" }}>{titulo}</h1>
      <p style={{ margin: "7px 0 14px", fontSize: 13, color: "#b5a196" }}>{sub}</p>
    </div>
  );
}

function navBtn(ativa: boolean): CSSProperties {
  return {
    display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 11px", borderRadius: 8, cursor: "pointer",
    border: `1px solid ${ativa ? "rgba(229,179,79,.5)" : "transparent"}`,
    background: ativa ? "rgba(229,179,79,.12)" : "transparent",
    font: "600 12.5px/1 Inter", color: ativa ? "#f7eee7" : "#b5a196", marginBottom: 4, textAlign: "left",
  };
}
