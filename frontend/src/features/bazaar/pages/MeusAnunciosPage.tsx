import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteListing, listMine } from "../../../services/listingsService";
import { ApiError } from "../../../services/api";
import type { Listing } from "../../../types/listing";
import { brl, numeroBR } from "../../../utils/format";

const STATUS_LABEL: Record<string, string> = {
  ativo: "Ativo",
  pausado: "Pausado",
  vendido: "Vendido",
};

export function MeusAnunciosPage() {
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState<string | null>(null);

  const carregar = () => {
    const controller = new AbortController();
    listMine(controller.signal)
      .then(setListings)
      .catch((err: Error) => {
        if (err.name !== "AbortError") setError(err.message);
      });
    return () => controller.abort();
  };

  useEffect(carregar, []);

  const excluir = async (l: Listing) => {
    if (!window.confirm(`Excluir o anúncio "${l.titulo}"?`)) return;
    setRemovendo(l.id);
    try {
      await deleteListing(l.id);
      setListings((prev) => (prev ? prev.filter((x) => x.id !== l.id) : prev));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao excluir.");
    } finally {
      setRemovendo(null);
    }
  };

  const preco = (l: Listing) =>
    !l.preco
      ? "A combinar"
      : l.moeda === "diamonds"
        ? `◆ ${numeroBR(l.preco)}`
        : brl(l.preco);

  return (
    <main className="page">
      <div className="container an-form-wrap">
        <div className="admin-head">
          <h1 className="bz-form-title">Meus anúncios</h1>
          <Link className="bz-vpertsz-link" to="/anunciar">
            + Novo anúncio
          </Link>
        </div>

        {error && <p className="bz-form-error">{error}</p>}

        {!listings ? (
          <div className="bz-empty">
            <strong>Carregando…</strong>
          </div>
        ) : listings.length === 0 ? (
          <div className="bz-empty">
            <strong>Você ainda não tem anúncios</strong>
            <p>
              <Link to="/anunciar">Criar meu primeiro anúncio</Link>
            </p>
          </div>
        ) : (
          <div className="mine-list">
            {listings.map((l) => (
              <div key={l.id} className="mine-row">
                <div className="mine-info">
                  <strong>{l.titulo}</strong>
                  <span className={`mine-status mine-status-${l.status}`}>
                    {STATUS_LABEL[l.status] ?? l.status}
                  </span>
                  <span className="mine-preco">{preco(l)}</span>
                </div>
                <div className="mine-actions">
                  <Link className="bz-clear" to={`/anuncio/${l.id}`}>Ver</Link>
                  <Link className="bz-clear" to={`/anunciar/${l.id}`}>Editar</Link>
                  <button
                    type="button"
                    className="bz-clear mine-del"
                    disabled={removendo === l.id}
                    onClick={() => excluir(l)}
                  >
                    {removendo === l.id ? "Excluindo…" : "Excluir"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
