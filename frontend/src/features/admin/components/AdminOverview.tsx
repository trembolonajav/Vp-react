import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import {
  listAdminConversations,
  listAdminListings,
  listAdminReports,
  moderateListing,
  reviewReport,
} from "../../../services/adminModerationService";
import type { AdminReport } from "../../../services/adminModerationService";
import type { ConversationSummary } from "../../../types/conversation";
import type { Listing } from "../../../types/listing";
import { brl, DIAMANTE, numeroBR } from "../../../utils/format";

// Porte fiel da área "Visão geral" da tela 13 "Painel de admin".
// KPIs, fila de intermédio, denúncias e anúncios para revisar vêm dos endpoints
// reais de admin; métricas sem fonte (negociações hoje, novos usuários) ficam "—".

type Vista = "geral" | "intermedios" | "denuncias" | "anuncios" | "config";
const GRAVE = /golpe|fraude|pagamento|fora da plataforma/i;

const SCOPED = `
.bzadmin [data-h=assumir]:hover,.bzadmin [data-h=suspender]:hover{filter:brightness(1.13)}
.bzadmin [data-h=verchat]:hover,.bzadmin [data-h=analisar]:hover,.bzadmin [data-h=dots]:hover{border-color:#e5b34f !important;color:#f7eee7 !important}
.bzadmin [data-h=arquivar]:hover,.bzadmin [data-h=aprovar]:hover{border-color:#4ec97c !important}
.bzadmin [data-h=remover]:hover{color:#ffc9ba !important}
.bzadmin [data-h=fila]:hover,.bzadmin [data-h=drow]:hover,.bzadmin [data-h=rrow]:hover{background:rgba(229,179,79,.06)}
.bzadmin a[data-h=vertodas]:hover,.bzadmin a[data-h=vend]:hover{color:#e5b34f}
`;

function desde(iso: string): string {
  const diff = Date.now() - +new Date(iso);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "ontem" : `há ${d} dias`;
}

const isDiamante = (moeda: string) => moeda === "diamonds" || moeda === "diamante";

export function AdminOverview({ onNavigate }: { onNavigate: (v: Vista) => void }) {
  const [fila, setFila] = useState<ConversationSummary[]>([]);
  const [denuncias, setDenuncias] = useState<AdminReport[]>([]);
  const [revisar, setRevisar] = useState<Listing[]>([]);
  const [totais, setTotais] = useState({ denuncias: 0, anuncios: 0 });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      listAdminConversations("intermedio-solicitado", controller.signal),
      listAdminReports("aberta", controller.signal),
      listAdminListings("ativo", "", controller.signal),
    ])
      .then(([conversas, reports, listings]) => {
        setFila(conversas.conversations);
        setDenuncias(reports.content);
        setRevisar(listings.content.slice(0, 4));
        setTotais({ denuncias: reports.totalElements, anuncios: listings.totalElements });
      })
      .catch((err: Error) => { if (err.name !== "AbortError") setError(err.message); });
    return () => controller.abort();
  }, []);

  const suspender = async (r: AdminReport) => {
    setBusy(r.id); setError(null);
    try {
      if (r.adId) await moderateListing(r.adId, "removido");
      await reviewReport(r.id, "resolvida", "Anúncio suspenso pela moderação.");
      setDenuncias((prev) => prev.filter((x) => x.id !== r.id));
      setTotais((t) => ({ ...t, denuncias: Math.max(0, t.denuncias - 1) }));
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(null); }
  };
  const arquivar = async (r: AdminReport) => {
    setBusy(r.id); setError(null);
    try {
      await reviewReport(r.id, "rejeitada", "Denúncia arquivada.");
      setDenuncias((prev) => prev.filter((x) => x.id !== r.id));
      setTotais((t) => ({ ...t, denuncias: Math.max(0, t.denuncias - 1) }));
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(null); }
  };
  const moderar = async (l: Listing, status: string) => {
    setBusy(l.id); setError(null);
    try {
      await moderateListing(l.id, status);
      setRevisar((prev) => prev.filter((x) => x.id !== l.id));
      if (status !== "ativo") setTotais((t) => ({ ...t, anuncios: Math.max(0, t.anuncios - 1) }));
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(null); }
  };

  const atividade = [
    ...denuncias.map((d) => ({ simbolo: "⚠", texto: `Denúncia: ${d.reason}`, iso: d.createdAt, cor: "#e8b4a8", corFundo: "rgba(195,54,41,.12)", corBorda: "rgba(195,54,41,.34)" })),
    ...fila.map((f) => ({ simbolo: "⛨", texto: `Intermédio solicitado em ${f.conversation.title}`, iso: f.conversation.updatedAt, cor: "#f0d194", corFundo: "rgba(229,179,79,.12)", corBorda: "rgba(229,179,79,.32)" })),
    ...revisar.map((r) => ({ simbolo: "☰", texto: `Anúncio ativo: ${r.titulo}`, iso: r.criadoEm, cor: "#b5a196", corFundo: "rgba(216,138,74,.1)", corBorda: "rgba(216,138,74,.24)" })),
  ].sort((a, b) => +new Date(b.iso) - +new Date(a.iso)).slice(0, 5);

  const kpis = [
    { rotulo: "Intermédios na fila", valor: String(fila.length), nota: "aguardando atendimento", simbolo: "⛨", cor: "#f0d194", borda: "rgba(229,179,79,.4)" },
    { rotulo: "Denúncias abertas", valor: String(totais.denuncias), nota: "para revisar", simbolo: "⚠", cor: "#e8654a", borda: "rgba(195,54,41,.42)" },
    { rotulo: "Anúncios ativos", valor: String(totais.anuncios), nota: "no bazaar", simbolo: "☰", cor: "#f7eee7", borda: "rgba(216,138,74,.24)" },
    { rotulo: "Negociações hoje", valor: "—", nota: "não rastreado", simbolo: "◈", cor: "#8ea1e1", borda: "rgba(114,137,218,.32)" },
    { rotulo: "Novos usuários", valor: "—", nota: "não rastreado", simbolo: "☺", cor: "#7fd9a2", borda: "rgba(78,201,124,.32)" },
  ];

  return (
    <div className="bzadmin" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <style>{SCOPED}</style>

      {/* heading */}
      <div>
        <span style={{ font: "800 10.5px/1 Inter", letterSpacing: ".2em", textTransform: "uppercase", color: "#c33629" }}>Visão geral</span>
        <h1 style={{ margin: "9px 0 0", font: "700 28px/1.05 Cinzel, serif", color: "#f7eee7" }}>Painel de administração</h1>
        <p style={{ margin: "7px 0 0", fontSize: 13, color: "#b5a196" }}>O que exige ação humana primeiro: intermédios na fila e denúncias abertas.</p>
      </div>

      {error && <p style={{ color: "#f0a58f", fontSize: 13, margin: 0 }}>{error}</p>}

      {/* KPIs */}
      <div className="admin-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
        {kpis.map((k) => (
          <div key={k.rotulo} style={{ padding: "13px 14px", borderRadius: 10, border: `1px solid ${k.borda}`, background: "linear-gradient(180deg,#1d1411,#150e0c)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ font: "700 9px/1 Inter", letterSpacing: ".14em", textTransform: "uppercase", color: "#8a7a70" }}>{k.rotulo}</span>
              <span style={{ fontSize: 12, color: k.cor }}>{k.simbolo}</span>
            </div>
            <div style={{ marginTop: 10, font: "700 26px/1 Cinzel, serif", color: k.cor }}>{k.valor}</div>
            <div style={{ marginTop: 7, font: "600 10.5px/1 Inter", color: "#7d6d64" }}>{k.nota}</div>
          </div>
        ))}
      </div>

      {/* 2 colunas */}
      <div className="admin-2col" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.25fr) minmax(0,1fr)", gap: 14, alignItems: "start" }}>

        {/* fila de intermédio */}
        <div style={{ border: "1px solid rgba(229,179,79,.26)", borderRadius: 12, background: "linear-gradient(180deg,#1c1310,#120c0a)", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 15px", borderBottom: "1px solid rgba(229,179,79,.16)", background: "linear-gradient(90deg,rgba(120,26,26,.3),transparent)" }}>
            <span style={{ font: "600 11px/1 Cinzel, serif", letterSpacing: ".16em", textTransform: "uppercase", color: "#e5b34f" }}>Fila de intermédio</span>
            <span style={{ padding: "4px 9px", borderRadius: 999, border: "1px solid rgba(195,54,41,.45)", background: "rgba(195,54,41,.12)", font: "800 9px/1 Inter", letterSpacing: ".1em", textTransform: "uppercase", color: "#e8b4a8" }}>{fila.length} aguardando</span>
          </div>
          {fila.length === 0 ? (
            <div style={{ padding: "22px 15px", color: "#8a7a70", fontSize: 12.5 }}>Nenhum intermédio aguardando.</div>
          ) : fila.map(({ conversation: c }, i) => (
            <div key={c.id} data-h="fila" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 15px", borderBottom: "1px solid rgba(229,179,79,.09)", borderLeft: `3px solid ${i === 0 ? "#c33629" : "rgba(229,179,79,.4)"}` }}>
              <i style={{ flex: "none", width: 42, height: 42, borderRadius: 8, border: "1px solid rgba(229,179,79,.16)", background: `radial-gradient(58% 58% at 50% 44%, rgba(195,54,41,.26), rgba(10,6,5,.9))${c.image ? `, url(${c.image})` : ""}`, backgroundSize: "cover, 76%", backgroundPosition: "center, center", backgroundRepeat: "no-repeat, no-repeat", imageRendering: "pixelated" }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ font: "700 12.5px/1.15 Inter", color: "#f7eee7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</div>
                <div style={{ marginTop: 5, fontSize: 11, color: "#b5a196" }}>{c.buyer} <span style={{ color: "#5d4c3c" }}>→</span> {c.seller}</div>
                <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 8 }}>
                  {c.price > 0 && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, font: "700 11px/1 Inter", color: "#e5b34f" }}>
                      {isDiamante(c.currency) && <img src={DIAMANTE} alt="" style={{ width: 12, height: 12, objectFit: "contain" }} />}
                      {isDiamante(c.currency) ? numeroBR(c.price) : brl(c.price)}
                    </span>
                  )}
                  <span style={{ padding: "2px 6px", borderRadius: 4, border: `1px solid ${i === 0 ? "rgba(195,54,41,.45)" : "rgba(229,179,79,.34)"}`, font: "800 8.5px/1.4 Inter", letterSpacing: ".1em", textTransform: "uppercase", color: i === 0 ? "#e8b4a8" : "#f0d194" }}>esperando {desde(c.updatedAt)}</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "none" }}>
                <button data-h="assumir" onClick={() => onNavigate("intermedios")} style={{ padding: "8px 13px", borderRadius: 7, cursor: "pointer", border: "1px solid rgba(240,200,130,.5)", background: "linear-gradient(180deg,#a51f22,#6a1215)", font: "700 10.5px/1 Cinzel, serif", letterSpacing: ".08em", textTransform: "uppercase", color: "#fff" }}>Assumir</button>
                <button data-h="verchat" onClick={() => onNavigate("intermedios")} style={{ textAlign: "center", padding: "7px 13px", borderRadius: 7, cursor: "pointer", border: "1px solid rgba(216,138,74,.28)", background: "none", font: "700 10.5px/1 Inter", letterSpacing: ".06em", textTransform: "uppercase", color: "#b5a196" }}>Ver chat</button>
              </div>
            </div>
          ))}
        </div>

        {/* coluna direita: denúncias + atividade */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ border: "1px solid rgba(195,54,41,.34)", borderRadius: 12, background: "linear-gradient(180deg,#211310,#150d0b)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 15px", borderBottom: "1px solid rgba(195,54,41,.24)" }}>
              <span style={{ font: "600 11px/1 Cinzel, serif", letterSpacing: ".16em", textTransform: "uppercase", color: "#d8503c" }}>Denúncias abertas</span>
              <button data-h="vertodas" onClick={() => onNavigate("denuncias")} style={{ border: 0, background: "none", cursor: "pointer", font: "700 10.5px/1 Inter", letterSpacing: ".06em", color: "#e5b34f" }}>Ver todas</button>
            </div>
            {denuncias.length === 0 ? (
              <div style={{ padding: "20px 15px", color: "#8a7a70", fontSize: 12.5 }}>Nenhuma denúncia aberta.</div>
            ) : denuncias.slice(0, 3).map((d) => {
              const grave = GRAVE.test(d.reason);
              return (
                <div key={d.id} data-h="drow" style={{ padding: "11px 15px", borderBottom: "1px solid rgba(195,54,41,.14)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ padding: "2px 7px", borderRadius: 4, border: `1px solid ${grave ? "rgba(195,54,41,.45)" : "rgba(229,179,79,.34)"}`, font: "800 8.5px/1.4 Inter", letterSpacing: ".1em", textTransform: "uppercase", color: grave ? "#e8654a" : "#f0d194" }}>{grave ? "Grave" : "Média"}</span>
                    <span style={{ font: "700 12px/1.15 Inter", color: "#f7eee7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.reason}</span>
                    <span style={{ marginLeft: "auto", flex: "none", fontSize: 10, color: "#7d6d64" }}>{desde(d.createdAt)}</span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, color: "#8a7a70" }}>{d.seller || "Usuário"} · anúncio {d.title || d.adId}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 9 }}>
                    <button data-h="suspender" disabled={busy === d.id} onClick={() => void suspender(d)} style={acaoDen("rgba(195,54,41,.45)", "rgba(195,54,41,.12)", "#e8b4a8")}>Suspender</button>
                    <button data-h="analisar" onClick={() => onNavigate("denuncias")} style={acaoDen("rgba(216,138,74,.28)", "rgba(10,6,5,.5)", "#b5a196")}>Analisar</button>
                    <button data-h="arquivar" disabled={busy === d.id} onClick={() => void arquivar(d)} style={acaoDen("rgba(78,201,124,.34)", "rgba(78,201,124,.08)", "#7fd9a2")}>Arquivar</button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ border: "1px solid rgba(229,179,79,.24)", borderRadius: 12, background: "linear-gradient(180deg,#1c1310,#120c0a)", padding: "13px 15px 15px" }}>
            <div style={{ font: "600 11px/1 Cinzel, serif", letterSpacing: ".16em", textTransform: "uppercase", color: "#e5b34f" }}>Atividade recente</div>
            <div style={{ display: "flex", flexDirection: "column", marginTop: 11 }}>
              {atividade.length === 0 ? (
                <div style={{ padding: "8px 0", color: "#8a7a70", fontSize: 12 }}>Sem atividade recente.</div>
              ) : atividade.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid rgba(229,179,79,.08)" }}>
                  <span style={{ flex: "none", width: 22, height: 22, display: "grid", placeItems: "center", borderRadius: 6, border: `1px solid ${a.corBorda}`, background: a.corFundo, fontSize: 10, color: a.cor }}>{a.simbolo}</span>
                  <div style={{ minWidth: 0, flex: 1, font: "600 12px/1.35 Inter", color: "#e0d0c4" }}>{a.texto}</div>
                  <span style={{ flex: "none", fontSize: 10, color: "#7d6d64" }}>{desde(a.iso)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* anúncios para revisar */}
      <div style={{ border: "1px solid rgba(229,179,79,.24)", borderRadius: 12, background: "linear-gradient(180deg,#1c1310,#120c0a)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 15px", borderBottom: "1px solid rgba(229,179,79,.16)" }}>
          <span style={{ font: "600 11px/1 Cinzel, serif", letterSpacing: ".16em", textTransform: "uppercase", color: "#e5b34f" }}>Anúncios para revisar</span>
          <span style={{ font: "700 10px/1 Inter", letterSpacing: ".1em", textTransform: "uppercase", color: "#7d6d64" }}>Publicados recentemente</span>
        </div>
        <div className="admin-rev-head" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) 120px 130px 110px 160px", gap: 12, alignItems: "center", padding: "9px 15px", borderBottom: "1px solid rgba(229,179,79,.14)", background: "rgba(10,6,5,.5)", font: "800 9px/1 Inter", letterSpacing: ".16em", textTransform: "uppercase", color: "#7d6d64" }}>
          <span>Anúncio</span><span>Vendedor</span><span>Preço</span><span>Sinal</span><span style={{ textAlign: "right" }}>Ações</span>
        </div>
        {revisar.length === 0 ? (
          <div style={{ padding: "20px 15px", color: "#8a7a70", fontSize: 12.5 }}>Nenhum anúncio na fila de revisão.</div>
        ) : revisar.map((r) => (
          <div key={r.id} data-h="rrow" className="admin-rev-row" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) 120px 130px 110px 160px", gap: 12, alignItems: "center", padding: "10px 15px", borderBottom: "1px solid rgba(229,179,79,.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <i style={{ flex: "none", width: 38, height: 38, borderRadius: 7, border: "1px solid rgba(229,179,79,.16)", background: `radial-gradient(58% 58% at 50% 44%, rgba(195,54,41,.24), rgba(10,6,5,.9))${r.img ? `, url(${r.img})` : ""}`, backgroundSize: "cover, 76%", backgroundPosition: "center, center", backgroundRepeat: "no-repeat, no-repeat", imageRendering: "pixelated" }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ font: "700 12.5px/1.15 Inter", color: "#f7eee7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.titulo}</div>
                <div style={{ marginTop: 4, fontSize: 10.5, color: "#7d6d64" }}>{r.categoria || r.tipo || "Anúncio"} · {desde(r.criadoEm)}</div>
              </div>
            </div>
            <Link to={`/bazaar/anuncio/${r.id}`} data-h="vend" style={{ font: "600 12px/1 Inter", color: "#e0d0c4", textDecoration: "none" }}>{r.vendedor || "—"}</Link>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {r.preco > 0 && isDiamante(r.moeda) && <img src={DIAMANTE} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />}
              <span style={{ font: "700 14px/1 Cinzel, serif", color: "#e5b34f" }}>{!r.preco ? "A combinar" : isDiamante(r.moeda) ? numeroBR(r.preco) : brl(r.preco)}</span>
            </div>
            <span style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(229,179,79,.34)", font: "800 9px/1.4 Inter", letterSpacing: ".08em", textTransform: "uppercase", color: "#f0d194" }}>Revisar</span>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
              <button data-h="aprovar" disabled={busy === r.id} onClick={() => void moderar(r, "ativo")} style={acaoRev("rgba(78,201,124,.34)", "rgba(78,201,124,.08)", "#7fd9a2")}>Aprovar</button>
              <button data-h="remover" disabled={busy === r.id} onClick={() => void moderar(r, "removido")} style={acaoRev("rgba(195,54,41,.4)", "rgba(195,54,41,.1)", "#e8b4a8")}>Remover</button>
              <button data-h="dots" onClick={() => onNavigate("anuncios")} title="Abrir moderação" style={{ width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: 7, cursor: "pointer", border: "1px solid rgba(216,138,74,.26)", background: "rgba(10,6,5,.5)", font: "700 13px/1 Inter", color: "#b5a196" }}>⋯</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function acaoDen(borda: string, fundo: string, cor: string): CSSProperties {
  return { padding: "6px 11px", borderRadius: 6, cursor: "pointer", border: `1px solid ${borda}`, background: fundo, font: "700 10px/1 Inter", letterSpacing: ".06em", textTransform: "uppercase", color: cor };
}
function acaoRev(borda: string, fundo: string, cor: string): CSSProperties {
  return { padding: "7px 12px", borderRadius: 7, cursor: "pointer", border: `1px solid ${borda}`, background: fundo, font: "700 10.5px/1 Inter", letterSpacing: ".06em", textTransform: "uppercase", color: cor };
}
