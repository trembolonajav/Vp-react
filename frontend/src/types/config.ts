import type { Listing } from "./listing";

export interface Banner {
  img: string;
  alt: string;
  link: string;
}

export interface Game {
  id: string;
  nome: string;
  item: string;
  unidade: string;
  botao: string;
  img: string;
  icone: string;
  precoCompra: number;
  precoVenda: number;
  min: number;
  max: number;
  ativo: boolean;
}

export interface Contact {
  icone: string;
  nome: string;
  info: string;
  url: string;
}

export interface BazaarConfig {
  ativo: boolean;
  msgInteresse: string;
  msgAnunciar: string;
  servidores: string[];
  categorias: string[];
  anuncios: Listing[];
}

export interface SiteConfig {
  whatsapp: string;
  msgNegociar: string;
  banners: Banner[];
  games: Game[];
  bazaar: BazaarConfig;
  contatos: Contact[];
}
