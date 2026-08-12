import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import {
  listAdminListings,
  listAdminReports,
  moderateListing,
  reviewReport,
} from "../../../services/adminModerationService";
import type { AdminReport } from "../../../services/adminModerationService";
import type { Listing } from "../../../types/listing";
import { ApiError } from "../../../services/api";
import { brl, DIAMANTE, ivTotal, numeroBR, spriteUrl } from "../../../utils/format";
import { tierQualidade } from "../../bazaar/pages/profileShared";

// Telas ricas de moderação (Denúncias e Anúncios) no padrão visual do dashboard.
// `initialTab` fixa o modo (a sidebar do painel já separa as duas vistas).

type Tab = "reports" | "listings";
const GRAVE = /golpe|fraude|pagamento|fora da plataforma/i;

const SCOPED = `
.bzmod [data-h=pill]:hover{border-color:rgba(229,179,79,.5) !important}
.bzmod input:focus,.bzmod select:focus,.bzmod textarea:focus{outline:none;border-color:#e5b34f !important}
.bzmod input::placeholder,.bzmod textarea::placeholder{color:#7d6d64}
.bzmod [data-h=row]:hover{background:rgba(229,179,79,.05)}
.bzmod [data-h=b]:hover{filter:brightness(1.12)}
.bzmod a[data-h=lnk]:hover{color:#f6d68f}
.bzmod-scroll{overflow-x:auto}
.bzmod-scroll .bzmod-grid{min-width:700px}
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

const REPORT_STATUS: Record<string, { rotulo: string; cor: string; borda: string; fundo: string }> = {
  aberta: { rotulo: "Aberta", cor: "#f0d194", borda: "rgba(229,179,79,.4)", fundo: "rgba(229,179,79,.1)" },
  resolvida: { rotulo: "Resolvida", cor: "#7fd9a2", borda: "rgba(78,201,124,.4)", fundo: "rgba(78,201,124,.1)" },
  rejeitada: { rotulo: "Rejeitada", cor: "#c98d84", borda: "rgba(195,54,41,.35)", fundo: "rgba(195,54,41,.08)" },
};
const LISTING_STATUS: Record<string, { rotulo: string; cor: string; borda: string; fundo: string }> = {
  ativo: { rotulo: "Ativo", cor: "#7fd9a2", borda: "rgba(78,201,124,.34)", fundo: "rgba(78,201,124,.1)" },
  pausado: { rotulo: "Pausado", cor: "#f0d194", borda: "rgba(229,179,79,.34)", fundo: "rgba(229,179,79,.1)" },
  vendido: { rotulo: "Vendido", cor: "#8a7a70", borda: "rgba(216,138,74,.24)", fundo: "rgba(216,138,74,.08)" },
  removido: { rotulo: "Removido", cor: "#e8b4a8", borda: "rgba(195,54,41,.4)", fundo: "rgba(195,54,41,.1)" },
};

export function AdminModerationPanel({ initialTab = "reports" }: { initialTab?: Tab } = {}) {
  const mode = initialTab;
  const [reportStatus, setReportStatus] = useState("aberta");
  const [listingStatus, setListingStatus] = useState("todos");
  const [query, setQuery] = useState("");
  const [busca, setBusca] = useState("");
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback((signal?: AbortSignal) => {
    setError("");
    if (mode === "reports") {
      return listAdminReports(reportStatus, signal).then((p) => { setReports(p.content); setTotal(p.totalElements); });
    }
    return listAdminListings(listingStatus, query.trim(), signal).then((p) => { setListings(p.content); setTotal(p.totalElements); });
  }, [mode, reportStatus, listingStatus, query]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).catch((e: Error) => { if (e.name !== "AbortError") setError(e.message); });
    return () => controller.abort();
  }, [load]);

  // debounce da busca de anúncios
  useEffect(() => { const t = setTimeout(() => setQuery(busca), 350); return () => clearTimeout(t); }, [busca]);

  const resolverReport = async (r: AdminReport, status: string, notaPadrao: string) => {
    setBusy(r.id); setError("");
    try {
      const nota = notes[r.id]?.trim() || notaPadrao;
      if (status === "suspender") {
        if (r.adId) await moderateListing(r.adId, "removido");
        await reviewReport(r.id, "resolvida", nota || "Anúncio suspenso pela moderação.");
      } else {
        await reviewReport(r.id, status, nota);
      }
      setReports((items) => reportStatus === "todas"
        ? items.map((x) => x.id === r.id ? { ...x, status: status === "suspender" ? "resolvida" : status } : x)
        : items.filter((x) => x.id !== r.id));
      if (reportStatus !== "todas") setTotal((n) => Math.max(0, n - 1));
    } catch (e) { setError(e instanceof ApiError ? e.message : "Não foi possível tratar a denúncia."); }
    finally { setBusy(""); }
  };

  const setStatus = async (l: Listing, status: string) => {
    setBusy(l.id); setError("");
    try {
      const upd = await moderateListing(l.id, status);
      setListings((items) => items.map((x) => x.id === upd.id ? upd : x));
    } catch (e) { setError(e instanceof ApiError ? e.message : "Não foi possível moderar o anúncio."); }
    finally { setBusy(""); }
  };

  return (
    <div className="bzmod">
      <style>{SCOPED}</style>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
        <div>
          <span style={{ font: "800 10.5px/1 Inter", letterSpacing: ".2em", textTransform: "uppercase", color: "#c33629" }}>Moderação</span>
          <h1 style={{ margin: "9px 0 0", font: "700 28px/1.05 Cinzel, serif", color: "#f7eee7" }}>{mode === "reports" ? "Denúncias" : "Anúncios"}</h1>
          <p style={{ margin: "7px 0 0", fontSize: 13, color: "#b5a196" }}>
            {mode === "reports" ? "Ocorrências enviadas pela comunidade — trate as abertas primeiro." : "Todos os anúncios do marketplace, com moderação de situação."}
          </p>
        </div>
        <span style={{ padding: "5px 11px", borderRadius: 999, border: "1px solid rgba(216,138,74,.3)", font: "800 10px/1 Inter", letterSpacing: ".08em", textTransform: "uppercase", color: "#b5a196" }}>{total} no total</span>
      </div>

      {/* filtros */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap", marginBottom: 12 }}>
        {mode === "reports"
          ? ([["aberta", "Abertas"], ["resolvida", "Resolvidas"], ["rejeitada", "Rejeitadas"], ["todas", "Todas"]] as const).map(([id, label]) => {
              const on = reportStatus === id;
              return <button key={id} data-h="pill" onClick={() => setReportStatus(id)} style={pill(on)}>{label}</button>;
            })
          : (<>
              {([["todos", "Todos"], ["ativo", "Ativos"], ["pausado", "Pausados"], ["vendido", "Vendidos"], ["removido", "Removidos"]] as const).map(([id, label]) => {
                const on = listingStatus === id;
                return <button key={id} data-h="pill" onClick={() => setListingStatus(id)} style={pill(on)}>{label}</button>;
              })}
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por título…"
                style={{ marginLeft: "auto", width: 230, padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(216,138,74,.22)", background: "rgba(10,6,5,.6)", color: "#f7eee7", fontSize: 12.5 }} />
            </>)}
      </div>

      {error && <p style={{ color: "#f0a58f", fontSize: 13 }}>{error}</p>}

      {/* ---- DENÚNCIAS ---- */}
      {mode === "reports" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reports.map((r) => {
            const grave = GRAVE.test(r.reason);
            const st = REPORT_STATUS[r.status] ?? REPORT_STATUS.aberta;
            return (
              <div key={r.id} style={{ border: `1px solid ${grave ? "rgba(195,54,41,.34)" : "rgba(229,179,79,.24)"}`, borderRadius: 12, background: grave ? "linear-gradient(180deg,#211310,#150d0b)" : "linear-gradient(180deg,#1c1310,#120c0a)", padding: "13px 15px 15px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                  <span style={{ padding: "2px 8px", borderRadius: 4, border: `1px solid ${grave ? "rgba(195,54,41,.45)" : "rgba(229,179,79,.34)"}`, font: "800 8.5px/1.4 Inter", letterSpacing: ".1em", textTransform: "uppercase", color: grave ? "#e8654a" : "#f0d194" }}>{grave ? "Grave" : "Média"}</span>
                  <span style={{ font: "700 14px/1.2 Inter", color: "#f7eee7" }}>{r.reason}</span>
                  <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ fontSize: 10.5, color: "#7d6d64" }}>{desde(r.createdAt)}</span>
                    <span style={{ padding: "3px 9px", borderRadius: 999, border: `1px solid ${st.borda}`, background: st.fundo, font: "800 8.5px/1 Inter", letterSpacing: ".08em", textTransform: "uppercase", color: st.cor }}>{st.rotulo}</span>
                  </span>
                </div>
                <div style={{ marginTop: 7, fontSize: 12, color: "#b5a196" }}>
                  <b style={{ color: "#e0d0c4" }}>{r.seller || "Usuário"}</b> · anúncio <Link data-h="lnk" to={`/bazaar/anuncio/${encodeURIComponent(r.adId)}`} style={{ color: "#e5b34f", textDecoration: "none" }}>{r.title || r.adId}</Link>
                </div>
                {r.details && <div style={{ marginTop: 9, padding: "9px 12px", borderRadius: 8, borderLeft: "3px solid rgba(216,138,74,.4)", background: "rgba(10,6,5,.5)", fontSize: 12, color: "#d3c3b5" }}>{r.details}</div>}

                {r.status === "aberta" ? (
                  <>
                    <textarea rows={2} maxLength={600} value={notes[r.id] ?? ""} onChange={(e) => setNotes((v) => ({ ...v, [r.id]: e.target.value }))}
                      placeholder="Nota interna da decisão (opcional)"
                      style={{ width: "100%", boxSizing: "border-box", marginTop: 11, padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(216,138,74,.22)", background: "#0b0706", color: "#f7eee7", font: "400 12.5px/1.4 Inter", resize: "vertical" }} />
                    <div style={{ display: "flex", gap: 7, marginTop: 9, flexWrap: "wrap" }}>
                      <Link data-h="lnk" to={`/bazaar/anuncio/${encodeURIComponent(r.adId)}`} style={{ padding: "8px 13px", borderRadius: 7, border: "1px solid rgba(216,138,74,.3)", font: "700 10.5px/1 Inter", letterSpacing: ".05em", textTransform: "uppercase", color: "#e5b34f", textDecoration: "none" }}>Ver anúncio</Link>
                      <span style={{ flex: 1 }} />
                      <button data-h="b" disabled={busy === r.id} onClick={() => void resolverReport(r, "suspender", "")} style={btn("rgba(195,54,41,.45)", "rgba(195,54,41,.12)", "#e8b4a8")}>Suspender anúncio</button>
                      <button data-h="b" disabled={busy === r.id} onClick={() => void resolverReport(r, "rejeitada", "Arquivada.")} style={btn("rgba(216,138,74,.3)", "rgba(10,6,5,.5)", "#b5a196")}>Arquivar</button>
                      <button data-h="b" disabled={busy === r.id} onClick={() => void resolverReport(r, "resolvida", "Resolvida.")} style={btn("rgba(78,201,124,.4)", "rgba(78,201,124,.1)", "#7fd9a2")}>Resolver</button>
                    </div>
                  </>
                ) : r.resolutionNote && (
                  <div style={{ marginTop: 9, fontSize: 11.5, color: "#8a7a70" }}>
                    <b style={{ color: "#a4937e" }}>Decisão:</b> {r.resolutionNote}{r.reviewedBy ? ` — ${r.reviewedBy}` : ""}{r.reviewedAt ? `, ${desde(r.reviewedAt)}` : ""}
                  </div>
                )}
              </div>
            );
          })}
          {reports.length === 0 && <div style={vazio}>Nenhuma denúncia nesta situação.</div>}
        </div>
      )}

      {/* ---- ANÚNCIOS ---- */}
      {mode === "listings" && (
        <div className="bzmod-scroll" style={{ border: "1px solid rgba(229,179,79,.22)", borderRadius: 12, background: "linear-gradient(180deg,#1a1210,#120c0a)" }}>
          <div className="bzmod-grid" style={{ ...gridCols, padding: "9px 15px", borderBottom: "1px solid rgba(229,179,79,.16)", background: "rgba(10,6,5,.5)", font: "800 9px/1 Inter", letterSpacing: ".16em", textTransform: "uppercase", color: "#7d6d64" }}>
            <span>Anúncio</span><span>Vendedor</span><span>Preço</span><span>Situação</span><span style={{ textAlign: "right" }}>Ações</span>
          </div>
          {listings.map((l) => {
            const tier = tierQualidade(l.qualidade);
            const iv = ivTotal(l.ivs);
            const st = LISTING_STATUS[l.status] ?? LISTING_STATUS.ativo;
            const sprite = l.dex ? spriteUrl(l.dex, l.shiny) : l.img;
            return (
              <div key={l.id} data-h="row" className="bzmod-grid" style={{ ...gridCols, padding: "11px 15px", borderBottom: "1px solid rgba(229,179,79,.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                  <i style={{ flex: "none", width: 40, height: 40, borderRadius: 8, border: "1px solid rgba(229,179,79,.18)", background: `radial-gradient(58% 58% at 50% 44%, rgba(195,54,41,.24), rgba(10,6,5,.9))${sprite ? `, url(${sprite})` : ""}`, backgroundSize: "cover, 76%", backgroundPosition: "center, center", backgroundRepeat: "no-repeat, no-repeat", imageRendering: "pixelated" }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ font: "700 13px/1.15 Inter", color: "#f7eee7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.titulo}</div>
                    <div style={{ marginTop: 4, display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: "#7d6d64" }}>{l.categoria || l.tipo || "Anúncio"}</span>
                      {tier && <span style={{ padding: "1px 5px", borderRadius: 4, border: "1px solid rgba(229,179,79,.3)", font: "800 8px/1.4 Inter", color: "#f0d194" }}>{tier.texto}</span>}
                      {iv != null && <span style={{ padding: "1px 5px", borderRadius: 4, border: "1px solid rgba(78,201,124,.32)", font: "800 8px/1.4 Inter", color: "#7fd9a2" }}>IV {iv}</span>}
                    </div>
                  </div>
                </div>
                <Link data-h="lnk" to={`/bazaar/perfil/${encodeURIComponent(l.vendedor || "")}`} style={{ font: "600 12px/1 Inter", color: "#e0d0c4", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.vendedor || "—"}</Link>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {l.preco > 0 && l.moeda === "diamonds" && <img src={DIAMANTE} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />}
                  <span style={{ font: "700 14px/1 Cinzel, serif", color: "#e5b34f" }}>{!l.preco ? "A combinar" : l.moeda === "diamonds" ? numeroBR(l.preco) : brl(l.preco)}</span>
                </div>
                <span style={{ justifySelf: "start", display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 9px", borderRadius: 999, border: `1px solid ${st.borda}`, background: st.fundo, font: "800 8.5px/1 Inter", letterSpacing: ".08em", textTransform: "uppercase", color: st.cor }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: st.cor }} />{st.rotulo}</span>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 7 }}>
                  <Link data-h="lnk" to={`/bazaar/anuncio/${l.id}`} style={{ padding: "8px 12px", borderRadius: 7, border: "1px solid rgba(229,179,79,.4)", font: "700 10.5px/1 Inter", letterSpacing: ".05em", textTransform: "uppercase", color: "#e5b34f", textDecoration: "none" }}>Ver</Link>
                  <select value={l.status} disabled={busy === l.id} onChange={(e) => void setStatus(l, e.target.value)}
                    style={{ padding: "8px 10px", borderRadius: 7, border: "1px solid rgba(216,138,74,.3)", background: "rgba(10,6,5,.6)", color: "#f7eee7", font: "600 11.5px/1 Inter", cursor: "pointer" }}>
                    <option value="ativo">Ativo</option>
                    <option value="pausado">Pausado</option>
                    <option value="vendido">Vendido</option>
                    <option value="removido">Removido</option>
                  </select>
                </div>
              </div>
            );
          })}
          {listings.length === 0 && <div style={{ padding: "22px 15px", textAlign: "center", color: "#8a7a70", fontSize: 13 }}>Nenhum anúncio encontrado.</div>}
        </div>
      )}
    </div>
  );
}

const gridCols: CSSProperties = { display: "grid", gridTemplateColumns: "minmax(0,1.6fr) 120px 130px 110px 200px", gap: 12, alignItems: "center" };

function pill(on: boolean): CSSProperties {
  return { padding: "8px 14px", borderRadius: 8, cursor: "pointer", border: `1px solid ${on ? "rgba(229,179,79,.5)" : "rgba(216,138,74,.2)"}`, background: on ? "rgba(229,179,79,.12)" : "rgba(10,6,5,.5)", font: "700 12px/1 Inter", color: on ? "#f7eee7" : "#b5a196" };
}
function btn(borda: string, fundo: string, cor: string): CSSProperties {
  return { padding: "8px 13px", borderRadius: 7, cursor: "pointer", border: `1px solid ${borda}`, background: fundo, font: "700 10.5px/1 Inter", letterSpacing: ".05em", textTransform: "uppercase", color: cor };
}
const vazio: CSSProperties = { padding: "36px 20px", textAlign: "center", border: "1px solid rgba(229,179,79,.18)", borderRadius: 12, background: "linear-gradient(180deg,#1a1210,#120c0a)", color: "#8a7a70", fontSize: 13 };
