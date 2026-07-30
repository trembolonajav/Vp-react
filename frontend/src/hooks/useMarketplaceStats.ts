import { useEffect, useState } from "react";
import { listListings } from "../services/listingsService";
import { EMPTY_FILTERS } from "../types/listing";

export interface MarketplaceStats {
  total: number;
  vendendo: number;
  procurando: number;
}

const EMPTY_STATS: MarketplaceStats = { total: 0, vendendo: 0, procurando: 0 };

/**
 * Os indicadores do hero vêm da mesma API Spring/PostgreSQL usada pela grade.
 * O endpoint ainda não possui uma projeção de contadores, então consultamos
 * somente os metadados das três páginas (12 itens no máximo por resposta).
 */
export function useMarketplaceStats() {
  const [stats, setStats] = useState<MarketplaceStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      listListings(EMPTY_FILTERS, controller.signal),
      listListings({ ...EMPTY_FILTERS, intencao: "venda" }, controller.signal),
      listListings({ ...EMPTY_FILTERS, intencao: "compra" }, controller.signal),
    ])
      .then(([all, selling, buying]) => {
        setStats({
          total: all.totalElements,
          vendendo: selling.totalElements,
          procurando: buying.totalElements,
        });
        setLoading(false);
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return { stats, loading };
}
