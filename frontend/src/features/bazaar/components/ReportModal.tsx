import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { ApiError } from "../../../services/api";
import { createReport } from "../../../services/reportsService";
import type { Listing } from "../../../types/listing";

const REASONS = [
  "Anúncio falso ou enganoso",
  "Preço ou informações incorretas",
  "Item proibido ou duplicado",
  "Tentativa de golpe",
  "Outro motivo",
];

export function ReportModal({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      navigate("/bazaar/login", { state: { from: `/bazaar/anuncio/${listing.id}` } });
      return;
    }
    const data = new FormData(event.currentTarget);
    setSubmitting(true);
    setStatus("");
    try {
      await createReport({
        adId: listing.id,
        title: listing.titulo,
        seller: listing.vendedor,
        reason: String(data.get("reason") || ""),
        details: String(data.get("details") || ""),
      });
      setSuccess(true);
      setStatus("Denúncia enviada. Obrigado por ajudar a comunidade.");
    } catch (error) {
      setStatus(error instanceof ApiError ? error.message : "Não foi possível enviar a denúncia.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bz-action-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="bz-action-modal bz-report-modal" role="dialog" aria-modal="true" aria-labelledby="report-title">
        <button className="bz-action-close" type="button" onClick={onClose} aria-label="Fechar">×</button>
        <span className="kicker">Moderação do Bazaar</span>
        <h2 id="report-title">Denunciar anúncio</h2>
        <p>A denúncia será enviada para a administração. O vendedor não recebe seus dados.</p>
        <form onSubmit={submit}>
          <fieldset>
            <legend>Qual é o problema?</legend>
            {REASONS.map((reason, index) => (
              <label key={reason}>
                <input type="radio" name="reason" value={reason} required={index === 0} />
                {reason}
              </label>
            ))}
          </fieldset>
          <label className="bz-report-details">
            Detalhes <small>(opcional)</small>
            <textarea name="details" maxLength={600} rows={4} />
          </label>
          {status && <p className={`bz-report-status ${success ? "ok" : ""}`}>{status}</p>}
          <div className="bz-report-actions">
            <button type="button" onClick={onClose}>Cancelar</button>
            <button type="submit" disabled={submitting || success}>
              {submitting ? "Enviando…" : "Enviar denúncia"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
