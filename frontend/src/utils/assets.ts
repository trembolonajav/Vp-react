/**
 * Normaliza caminhos de imagem vindos da config/anúncios. Valores como
 * "assets/x.webp" (relativos) quebram fora da raiz (ex.: /store, /bazaar);
 * aqui viram "/assets/x.webp". URLs http(s), /uploads e /media passam intactas.
 */
export function assetUrl(path: string | undefined): string {
  if (!path) return "";
  return path.startsWith("assets/") ? `/${path}` : path;
}
