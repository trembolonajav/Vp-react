import { ApiError, tokenStore } from "./api";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

/** Envia uma imagem (multipart) e devolve a URL /media/... salva no servidor. */
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const token = tokenStore.get();

  const response = await fetch(`${API_BASE}/api/v1/media`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      message = (await response.json())?.message ?? message;
    } catch {
      /* corpo não-JSON */
    }
    throw new ApiError(response.status, message);
  }
  const data = (await response.json()) as { url: string };
  return data.url;
}
