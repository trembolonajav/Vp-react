import { useEffect, useState } from "react";
import { getConfig } from "../services/configService";
import type { SiteConfig } from "../types/config";

interface ConfigState {
  config: SiteConfig | null;
  loading: boolean;
  error: string | null;
}

/** Carrega a configuração pública do site uma vez. */
export function useConfig(): ConfigState {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getConfig(controller.signal)
      .then(setConfig)
      .catch((err: Error) => {
        if (err.name !== "AbortError") setError(err.message);
      });
    return () => controller.abort();
  }, []);

  return { config, loading: config === null && error === null, error };
}
