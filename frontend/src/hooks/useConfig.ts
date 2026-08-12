import { useEffect, useState } from "react";
import { getConfig } from "../services/configService";
import type { SiteConfig } from "../types/config";

let cachedConfig: SiteConfig | null = null;
let configRequest: Promise<SiteConfig> | null = null;

function loadConfig(): Promise<SiteConfig> {
  if (cachedConfig) return Promise.resolve(cachedConfig);
  if (!configRequest) {
    configRequest = getConfig()
      .then((config) => {
        cachedConfig = config;
        return config;
      })
      .catch((error) => {
        configRequest = null;
        throw error;
      });
  }
  return configRequest;
}

interface ConfigState {
  config: SiteConfig | null;
  loading: boolean;
  error: string | null;
}

/** Carrega a configuração pública do site uma vez. */
export function useConfig(): ConfigState {
  const [config, setConfig] = useState<SiteConfig | null>(cachedConfig);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadConfig()
      .then((value) => { if (active) setConfig(value); })
      .catch((err: Error) => {
        if (active) setError(err.message);
      });
    return () => { active = false; };
  }, []);

  return { config, loading: config === null && error === null, error };
}
