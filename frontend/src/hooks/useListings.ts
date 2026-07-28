import { useEffect, useState } from "react";
import { listListings } from "../services/listingsService";
import type { Listing, ListingFilters, Page } from "../types/listing";

interface ListingsState {
  page: Page<Listing> | null;
  loading: boolean;
  error: string | null;
}

/** Busca anúncios na API sempre que os filtros mudam (server-side). */
export function useListings(filters: ListingFilters): ListingsState {
  const [page, setPage] = useState<Page<Listing> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = JSON.stringify(filters);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    listListings(filters, controller.signal)
      .then((result) => {
        setPage(result);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => controller.abort();
    // key resume o objeto de filtros para o comparador de dependências.
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return { page, loading, error };
}
