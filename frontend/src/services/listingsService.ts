import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./api";
import type { Listing, ListingFilters, ListingWriteRequest, Page } from "../types/listing";

const PAGE_SIZE = 12;

/** Traduz o estado de filtros da UI em query params da API. */
function toQuery(filters: ListingFilters): string {
  const params = new URLSearchParams();
  const put = (key: string, value: string) => {
    if (value !== "") params.set(key, value);
  };
  put("q", filters.q.trim());
  put("jogo", filters.jogo);
  put("tipo", filters.tipo);
  put("intencao", filters.intencao);
  put("moeda", filters.moeda);
  put("categoria", filters.categoria);
  put("precoMin", filters.precoMin);
  put("precoMax", filters.precoMax);
  put("ivMin", filters.ivMin);
  put("ivMax", filters.ivMax);
  put("qualidadeMin", filters.qualidadeMin);
  put("qualidadeMax", filters.qualidadeMax);
  put("nivelMin", filters.nivelMin);
  put("nivelMax", filters.nivelMax);
  put("poderMin", filters.poderMin);
  put("poderMax", filters.poderMax);
  if (filters.tipos.length > 0) params.set("tipos", filters.tipos.join(","));
  params.set("sort", filters.sort);
  params.set("page", String(filters.page));
  params.set("size", String(PAGE_SIZE));
  return params.toString();
}

export function listListings(
  filters: ListingFilters,
  signal?: AbortSignal,
): Promise<Page<Listing>> {
  return apiGet<Page<Listing>>(`/api/v1/listings?${toQuery(filters)}`, signal);
}

export function getListing(publicId: string, signal?: AbortSignal): Promise<Listing> {
  return apiGet<Listing>(`/api/v1/listings/${encodeURIComponent(publicId)}`, signal);
}

export function listMine(signal?: AbortSignal): Promise<Listing[]> {
  return apiGet<Listing[]>("/api/v1/listings/mine", signal);
}

export function createListing(body: ListingWriteRequest): Promise<Listing> {
  return apiPost<Listing>("/api/v1/listings", body);
}

export function updateListing(publicId: string, body: ListingWriteRequest): Promise<Listing> {
  return apiPut<Listing>(`/api/v1/listings/${encodeURIComponent(publicId)}`, body);
}

export function updateListingStatus(publicId: string, status: string): Promise<Listing> {
  return apiPatch<Listing>(`/api/v1/listings/${encodeURIComponent(publicId)}/status`, { status });
}

export function deleteListing(publicId: string): Promise<void> {
  return apiDelete(`/api/v1/listings/${encodeURIComponent(publicId)}`);
}
