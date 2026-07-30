import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useListings } from "../../../hooks/useListings";
import { useMarketplaceStats } from "../../../hooks/useMarketplaceStats";
import { EMPTY_FILTERS } from "../../../types/listing";
import type { ListingFilters, SortKey } from "../../../types/listing";
import { Filters } from "../components/Filters";
import { ProductGrid } from "../components/ProductGrid";
import { Pagination } from "../components/Pagination";
import { SORT_OPTIONS } from "../constants";

export function MarketplacePage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<ListingFilters>(() => ({
    ...EMPTY_FILTERS,
    categoria: searchParams.get("categoria") ?? "",
  }));
  const [collapsed, setCollapsed] = useState(true);

  const { page, loading, error } = useListings(filters);
  const { stats, loading: statsLoading } = useMarketplaceStats();

  // Ao mexer em qualquer filtro a paginação volta ao início; só "page" preserva.
  const patch = (change: Partial<ListingFilters>) =>
    setFilters((prev) => ({ ...prev, ...change, page: "page" in change ? change.page! : 1 }));

  const total = page?.totalElements ?? 0;
  const inicio = total === 0 ? 0 : (filters.page - 1) * (page?.size ?? 12) + 1;
  const fim = inicio + (page?.content.length ?? 0) - 1;

  return (
    <main className="page">
      <div className="container">
        <section className="bz-hero">
          <div>
            <span className="kicker">Marketplace da comunidade</span>
            <h1>VP Bazaar</h1>
            <p>
              Itens, pokémons, shiny cards e diamonds anunciados por jogadores da
              comunidade. A VP acompanha a negociação do começo ao fim.
            </p>
            <div className="bz-hero-actions">
              <a className="bz-hero-primary" href="/bazaar/anunciar.html">Criar anúncio</a>
              <a className="bz-hero-secondary" href="/bazaar/como-funciona.html">Como funciona</a>
            </div>
          </div>
          <div className="bz-stats">
            <div className="bz-stat">
              <b>{statsLoading ? "—" : stats.total}</b>
              <span>Anúncios</span>
            </div>
            <div className="bz-stat">
              <b>{statsLoading ? "—" : stats.vendendo}</b>
              <span>À venda</span>
            </div>
            <div className="bz-stat">
              <b>{statsLoading ? "—" : stats.procurando}</b>
              <span>Procura-se</span>
            </div>
          </div>
        </section>

        <div className="bz-layout">
          <Filters filters={filters} onPatch={patch} onClear={() => setFilters(EMPTY_FILTERS)} collapsed={collapsed} />

          <div>
            <div className="bz-toolbar">
              <button
                className="bz-filter-toggle"
                type="button"
                aria-expanded={!collapsed}
                onClick={() => setCollapsed((c) => !c)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                  <path d="M3 5h18v2l-7 7v5l-4 2v-7L3 7z" />
                </svg>
                Filtros
              </button>
              <span className="bz-count">
                {error
                  ? "Não foi possível carregar os anúncios"
                  : total === 0
                    ? "Nenhum anúncio corresponde aos filtros"
                    : `Exibindo ${inicio}–${fim} de ${total} ${total === 1 ? "anúncio" : "anúncios"}`}
              </span>
              <div className="bz-sort">
                <label htmlFor="f-sort">Ordenar</label>
                <select
                  className="bz-select"
                  id="f-sort"
                  value={filters.sort}
                  onChange={(e) => patch({ sort: e.target.value as SortKey })}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error ? (
              <div className="bz-empty">
                <strong>Erro ao carregar</strong>
                <p>{error}</p>
              </div>
            ) : loading && !page ? (
              <div className="bz-empty">
                <strong>Carregando anúncios…</strong>
              </div>
            ) : (
              <>
                <ProductGrid listings={page?.content ?? []} />
                <Pagination
                  page={filters.page}
                  totalPages={page?.totalPages ?? 1}
                  onChange={(p) => {
                    patch({ page: p });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
