import { apiGet } from "./api";
import type { SiteConfig } from "../types/config";

export function getConfig(signal?: AbortSignal): Promise<SiteConfig> {
  return apiGet<SiteConfig>("/api/v1/config", signal);
}
