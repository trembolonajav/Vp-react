import { apiGet, apiPut } from "./api";
import type { AdminConfigRequest, SiteConfig } from "../types/config";

export function getConfig(signal?: AbortSignal): Promise<SiteConfig> {
  return apiGet<SiteConfig>("/api/v1/config", signal);
}

export function saveConfig(body: AdminConfigRequest): Promise<SiteConfig> {
  return apiPut<SiteConfig>("/api/v1/admin/config", body);
}
