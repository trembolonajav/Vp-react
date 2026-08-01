// Base da API: vazio em dev (proxy /api do Vite) e configurável por ambiente.
const API_BASE = import.meta.env.VITE_API_URL ?? "";
const TOKEN_KEY = "vp-bazaar-token";
export const AUTH_EXPIRED_EVENT = "vp-auth-expired";

/** Guarda o JWT no localStorage (uso apropriado ao navegador). */
export const tokenStore = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function toError(response: Response): Promise<ApiError> {
  try {
    const body = await response.json();
    return new ApiError(response.status, body?.message ?? response.statusText);
  } catch {
    return new ApiError(response.status, response.statusText);
  }
}

interface RequestOptions {
  body?: unknown;
  signal?: AbortSignal;
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: string | undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body,
    signal: options.signal,
  });

  if (response.status === 401 && token) {
    tokenStore.clear();
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }

  if (response.status === 204) return undefined as T;
  if (!response.ok) throw await toError(response);
  return response.json() as Promise<T>;
}

export const apiGet = <T>(path: string, signal?: AbortSignal): Promise<T> =>
  request<T>("GET", path, { signal });

export const apiPost = <T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> =>
  request<T>("POST", path, { body, signal });

export const apiPut = <T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> =>
  request<T>("PUT", path, { body, signal });

export const apiPatch = <T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> =>
  request<T>("PATCH", path, { body, signal });

export const apiDelete = (path: string, signal?: AbortSignal): Promise<void> =>
  request<void>("DELETE", path, { signal });
