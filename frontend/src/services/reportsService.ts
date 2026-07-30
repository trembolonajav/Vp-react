import { apiPost } from "./api";

export interface ReportRequest {
  adId: string;
  title: string;
  seller: string;
  reason: string;
  details?: string;
}

export function createReport(body: ReportRequest): Promise<{ id: string }> {
  return apiPost<{ id: string }>("/api/v1/reports", body);
}
