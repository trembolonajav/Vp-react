export interface Listing {
  id: string;
  titulo: string;
  jogo: string;
  servidor: string;
  categoria: string;
  tipo: string;
  intencao: string;
  moeda: string;
  preco: number;
  negociavel: boolean;
  destaque: boolean;
  status: string;
  img: string;
  descricao: string;
  vendedor: string;
  criadoEm: string;
  dex: number;
  nivel: number;
  poder: number;
  tipos: string[];
  shiny: boolean;
  quantidade: number;
  aceitaTroca: boolean;
  natureza: string;
  habilidade: string;
  genero: string;
  forma: string;
  qualidade: number;
  disponibilidade: string;
  ivs: number[];
  moves: string[];
  regras: string;
  vendedorVerificado: boolean;
  vendedorOnline: boolean;
  vendedorNota: number;
  vendedorVendas: number;
  vendedorResposta: string;
  vendedorAvatar: string;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export type SortKey = "recentes" | "preco-asc" | "preco-desc" | "titulo";

export interface ListingFilters {
  q: string;
  tipo: string;
  intencao: string;
  moeda: string;
  categoria: string;
  precoMin: string;
  precoMax: string;
  ivMin: string;
  ivMax: string;
  qualidadeMin: string;
  qualidadeMax: string;
  nivelMin: string;
  nivelMax: string;
  poderMin: string;
  poderMax: string;
  tipos: string[];
  sort: SortKey;
  page: number;
}

export const EMPTY_FILTERS: ListingFilters = {
  q: "",
  tipo: "",
  intencao: "",
  moeda: "",
  categoria: "",
  precoMin: "",
  precoMax: "",
  ivMin: "",
  ivMax: "",
  qualidadeMin: "",
  qualidadeMax: "",
  nivelMin: "",
  nivelMax: "",
  poderMin: "",
  poderMax: "",
  tipos: [],
  sort: "recentes",
  page: 1,
};
