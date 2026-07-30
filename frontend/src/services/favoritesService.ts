import { apiDelete, apiGet, apiPost } from "./api";

export const listFavorites = (signal?: AbortSignal): Promise<string[]> =>
  apiGet<string[]>("/api/v1/favorites", signal);

export const addFavorite = (listingId: string): Promise<void> =>
  apiPost<void>(`/api/v1/favorites/${encodeURIComponent(listingId)}`);

export const removeFavorite = (listingId: string): Promise<void> =>
  apiDelete(`/api/v1/favorites/${encodeURIComponent(listingId)}`);
