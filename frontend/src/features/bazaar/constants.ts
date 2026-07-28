export const TYPE_LABEL: Record<string, string> = {
  normal: "Normal", fire: "Fogo", water: "Água", electric: "Elétrico", grass: "Planta",
  ice: "Gelo", fighting: "Lutador", poison: "Veneno", ground: "Terra", flying: "Voador",
  psychic: "Psíquico", bug: "Inseto", rock: "Pedra", ghost: "Fantasma", dragon: "Dragão",
  dark: "Sombrio", steel: "Aço", fairy: "Fada",
};

export const TYPE_COLOR: Record<string, string> = {
  normal: "#9a9a7c", fire: "#e0742f", water: "#5680d8", electric: "#d8b220", grass: "#6da33e",
  ice: "#7fc4c4", fighting: "#a5342a", poison: "#8f3f8f", ground: "#c9a952", flying: "#8d7fd8",
  psychic: "#dd4f7f", bug: "#93a021", rock: "#a89232", ghost: "#5f5390", dragon: "#5f3cc9",
  dark: "#584538", steel: "#8a8aa0", fairy: "#c96f9e",
};

/** Ordem das tipagens na grade de filtro (igual ao redesign). */
export const TIPOS_ORDEM: string[] = [
  "normal", "fire", "water", "grass", "electric", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy",
];

export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "recentes", label: "Mais recentes" },
  { value: "preco-asc", label: "Menor preço" },
  { value: "preco-desc", label: "Maior preço" },
  { value: "titulo", label: "Título (A–Z)" },
];
