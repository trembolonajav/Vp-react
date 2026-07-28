export const brl = (value: number): string =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const numeroBR = (value: number): string => value.toLocaleString("pt-BR");

export const DIAMANTE = "/assets/diamante-pokeidle-oficial.png";

/** Mesma fonte de sprites que o app atual usa (PokeAPI). */
export function spriteUrl(dex: number, shiny: boolean): string {
  const base = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
  return shiny ? `${base}/shiny/${dex}.png` : `${base}/${dex}.png`;
}

export const ivTotal = (ivs: number[]): number | null =>
  ivs.length === 6 ? ivs.reduce((sum, n) => sum + n, 0) : null;
