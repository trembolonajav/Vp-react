/** Monta o link do WhatsApp higienizando a mensagem (mesma lógica do app atual). */
export function waLink(whatsapp: string, msg: string): string {
  const safe = String(msg ?? "")
    .replace(/�/g, "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(safe)}`;
}

/** URL de um contato: usa a url própria ou cai no WhatsApp da loja. */
export function contatoHref(whatsapp: string, msgNegociar: string, url: string): string {
  return url && url.trim() ? url : waLink(whatsapp, msgNegociar);
}

export const isExternal = (url: string): boolean => /^https?:\/\//i.test(url);
