import { apiGet, apiPatch } from "./api";
import type { Listing, Page } from "../types/listing";

export interface AdminReport {
  id: string;
  adId: string;
  title: string;
  seller: string;
  reason: string;
  details: string;
  reporterId: string;
  status: string;
  createdAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  resolutionNote: string | null;
}

export function listAdminReports(status: string, signal?: AbortSignal): Promise<Page<AdminReport>> {
  return apiGet<Page<AdminReport>>(
    `/api/v1/admin/reports?status=${encodeURIComponent(status)}&page=1&size=50`,
    signal,
  );
}

export function reviewReport(id: string, status: string, note: string): Promise<AdminReport> {
  return apiPatch<AdminReport>(`/api/v1/admin/reports/${encodeURIComponent(id)}`, { status, note });
}

export function listAdminListings(status: string, query: string, signal?: AbortSignal): Promise<Page<Listing>> {
  const params = new URLSearchParams({ status, q: query, page: "1", size: "50" });
  return apiGet<Page<Listing>>(`/api/v1/admin/listings?${params}`, signal);
}

export function moderateListing(publicId: string, status: string): Promise<Listing> {
  return apiPatch<Listing>(
    `/api/v1/admin/listings/${encodeURIComponent(publicId)}/status`,
    { status },
  );
}
