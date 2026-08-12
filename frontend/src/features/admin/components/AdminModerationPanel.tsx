import { useCallback, useEffect, useState } from "react";
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

type Tab = "reports" | "listings";

export function AdminModerationPanel({ initialTab = "reports" }: { initialTab?: Tab } = {}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [reportStatus, setReportStatus] = useState("aberta");
  const [listingStatus, setListingStatus] = useState("todos");
  const [query, setQuery] = useState("");
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback((signal?: AbortSignal) => {
    setError("");
    if (tab === "reports") {
      return listAdminReports(reportStatus, signal).then((page) => setReports(page.content));
    }
    return listAdminListings(listingStatus, query.trim(), signal).then((page) => setListings(page.content));
  }, [tab, reportStatus, listingStatus, query]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).catch((err: Error) => {
      if (err.name !== "AbortError") setError(err.message);
    });
    return () => controller.abort();
  }, [load]);

  const resolve = async (report: AdminReport, status: "resolvida" | "rejeitada") => {
    setBusy(report.id);
    setError("");
    try {
      const updated = await reviewReport(report.id, status, notes[report.id] ?? "");
      setReports((items) => reportStatus === "todas"
        ? items.map((item) => item.id === updated.id ? updated : item)
        : items.filter((item) => item.id !== updated.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível tratar a denúncia.");
    } finally {
      setBusy("");
    }
  };

  const setStatus = async (listing: Listing, status: string) => {
    setBusy(listing.id);
    setError("");
    try {
      const updated = await moderateListing(listing.id, status);
      setListings((items) => items.map((item) => item.id === updated.id ? updated : item));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível moderar o anúncio.");
    } finally {
      setBusy("");
    }
  };

  return (
    <section className="admin-moderation" aria-labelledby="admin-moderation-title">
      <div className="admin-section-head">
        <div>
          <span className="kicker">Moderação</span>
          <h2 id="admin-moderation-title" className="an-block-title">Denúncias e anúncios</h2>
        </div>
        <div className="admin-tabs" role="tablist">
          <button type="button" className={tab === "reports" ? "active" : ""}
            onClick={() => setTab("reports")}>Denúncias</button>
          <button type="button" className={tab === "listings" ? "active" : ""}
            onClick={() => setTab("listings")}>Anúncios</button>
        </div>
      </div>

      {tab === "reports" ? (
        <>
          <label className="admin-filter">Situação
            <select className="bz-select" value={reportStatus} onChange={(e) => setReportStatus(e.target.value)}>
              <option value="aberta">Abertas</option>
              <option value="resolvida">Resolvidas</option>
              <option value="rejeitada">Rejeitadas</option>
              <option value="todas">Todas</option>
            </select>
          </label>
          <div className="admin-moderation-list">
            {reports.map((report) => (
              <article className="admin-case" key={report.id}>
                <div className="admin-case-head">
                  <div><strong>{report.reason}</strong><span>{report.title || report.adId}</span></div>
                  <span className={`admin-status status-${report.status}`}>{report.status}</span>
                </div>
                {report.details && <p>{report.details}</p>}
                <small>Vendedor: {report.seller || "—"} · Enviada em {new Date(report.createdAt).toLocaleString("pt-BR")}</small>
                {report.status === "aberta" ? (
                  <>
                    <textarea className="bz-input" rows={2} maxLength={600}
                      placeholder="Nota interna da decisão"
                      value={notes[report.id] ?? ""}
                      onChange={(e) => setNotes((value) => ({ ...value, [report.id]: e.target.value }))} />
                    <div className="admin-case-actions">
                      <Link to={`/bazaar/anuncio/${encodeURIComponent(report.adId)}`}>Ver anúncio</Link>
                      <button type="button" disabled={busy === report.id} onClick={() => resolve(report, "rejeitada")}>Rejeitar</button>
                      <button type="button" disabled={busy === report.id} onClick={() => resolve(report, "resolvida")}>Resolver</button>
                    </div>
                  </>
                ) : report.resolutionNote && <p className="admin-resolution">{report.resolutionNote}</p>}
              </article>
            ))}
            {reports.length === 0 && <p className="bz-empty">Nenhuma denúncia nesta situação.</p>}
          </div>
        </>
      ) : (
        <>
          <div className="admin-listing-filters">
            <input className="bz-input" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por título" />
            <select className="bz-select" value={listingStatus} onChange={(e) => setListingStatus(e.target.value)}>
              <option value="todos">Todos</option><option value="ativo">Ativos</option>
              <option value="pausado">Pausados</option><option value="vendido">Vendidos</option>
              <option value="removido">Removidos</option>
            </select>
          </div>
          <div className="admin-moderation-list">
            {listings.map((listing) => (
              <article className="admin-case admin-listing-case" key={listing.id}>
                <div><strong>{listing.titulo}</strong><small>{listing.vendedor || "Sem vendedor"} · #{listing.id}</small></div>
                <Link to={`/bazaar/anuncio/${encodeURIComponent(listing.id)}`}>Abrir</Link>
                <select className="bz-select" value={listing.status} disabled={busy === listing.id}
                  onChange={(e) => setStatus(listing, e.target.value)}>
                  <option value="ativo">Ativo</option><option value="pausado">Pausado</option>
                  <option value="vendido">Vendido</option><option value="removido">Removido</option>
                </select>
              </article>
            ))}
            {listings.length === 0 && <p className="bz-empty">Nenhum anúncio encontrado.</p>}
          </div>
        </>
      )}
      {error && <p className="bz-form-error">{error}</p>}
    </section>
  );
}
