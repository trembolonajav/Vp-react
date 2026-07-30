import type { PokemonDexEntry } from "./ivCalculator";

export const DIAMOND_BRL = 0.12;
export const LEVEL_BRL = 0.03;
export const LEVEL_CUT = 400;
export const LEVEL_BRL_AFTER = 0.08;
export const UPDATED_AT = "28/07/2026";
const DEFAULT_BASE = 4;
const QUICK_FACTOR = 0.85;
const LIST_FACTOR = 1.10;

const MARKET: Record<string, [number, string]> = {
  abra:[5,"Média"], alakazam:[6,"Média"], blastoise:[5.5,"Alta"], charizard:[4.5,"Alta"],
  charmander:[4,"Baixa"], dragonite:[5,"Baixa"], electabuzz:[4.5,"Baixa"], flareon:[5.5,"Baixa"],
  gastly:[3,"Baixa"], gengar:[5.5,"Alta"], geodude:[4,"Média"], golem:[4.5,"Alta"],
  granbull:[4,"Baixa"], grimer:[2.5,"Baixa"], growlithe:[6,"Baixa"], kadabra:[4.5,"Baixa"],
  kakuna:[1.5,"Baixa"], lapras:[4,"Baixa"], magmar:[4,"Baixa"], marowak:[4,"Baixa"],
  oddish:[2,"Baixa"], paras:[2,"Baixa"], parasect:[3.5,"Baixa"], pichu:[4,"Baixa"],
  pidgey:[1.5,"Baixa"], poliwrath:[4.5,"Baixa"], primeape:[4,"Baixa"], rattata:[1.5,"Baixa"],
  rhydon:[4,"Baixa"], scizor:[5,"Baixa"], shellder:[1,"Baixa"], spearow:[1.5,"Baixa"],
  tentacool:[2.5,"Baixa"], victreebel:[5.5,"Média"],
};

const VALUE_RANGES: Array<[number, number, number, string]> = [
  [0,169,-2.5,"Resultado muito baixo"],[170,189,-2.5,"Penalidade relevante"],[190,199,0,"Faixa neutra"],
  [200,209,.3,"Bônus leve"],[210,219,.6,"Bônus leve"],[220,229,.9,"Bônus moderado"],
  [230,239,1.2,"Bônus moderado"],[240,249,1.5,"Bônus bom"],[250,259,1.8,"Bônus bom"],
  [260,269,2.1,"Bônus alto"],[270,279,2.4,"Bônus alto"],[280,289,2.7,"Bônus alto"],
  [290,309,3,"Bônus muito alto"],[310,329,3.5,"Bônus muito alto"],[330,349,4,"Bônus excepcional"],
  [350,999,4.5,"Teto provisório"],
];
const round2 = (value: number) => Math.round(value * 100) / 100;

export function levelValue(level: number) {
  const value = Math.max(1, Math.floor(level));
  return round2(value <= LEVEL_CUT
    ? (value - 1) * LEVEL_BRL
    : (LEVEL_CUT - 1) * LEVEL_BRL + (value - LEVEL_CUT) * LEVEL_BRL_AFTER);
}

export interface FipeResult {
  valid: boolean;
  reason?: string;
  score?: number;
  species?: PokemonDexEntry;
  confidence?: string;
  band?: { min:number; max:number; bonus:number; label:string };
  base?: number;
  levelValue?: number;
  fair?: number;
  quick?: number;
  list?: number;
  diamondsMin?: number;
  diamondsMax?: number;
}

export function calculateFipe(input: {
  species?: PokemonDexEntry; iv: string | number; multiplier: string | number; level: string | number;
}): FipeResult {
  const iv = Number(input.iv), multiplier = Number(input.multiplier), level = Number(input.level);
  if (!(iv > 0) || !(multiplier > 0) || !(level > 0)) {
    return { valid:false, reason:"Preencha IV, multiplicador e nível com valores maiores que zero." };
  }
  const score = Math.round(iv * multiplier);
  const range = VALUE_RANGES.find(([min,max]) => score >= min && score <= max) ?? VALUE_RANGES[VALUE_RANGES.length - 1];
  const market = input.species ? MARKET[input.species.s] : undefined;
  const base = market?.[0] ?? DEFAULT_BASE;
  const confidence = market?.[1] ?? "Provisória";
  const levelAmount = levelValue(level);
  const fair = round2(Math.max(base + range[2] + levelAmount, 0));
  const quick = round2(fair * QUICK_FACTOR);
  const list = round2(fair * LIST_FACTOR);
  return {
    valid:true, score, species:input.species, confidence,
    band:{min:range[0],max:range[1],bonus:range[2],label:range[3]},
    base, levelValue:levelAmount, fair, quick, list,
    diamondsMin:Math.round(quick / DIAMOND_BRL), diamondsMax:Math.round(list / DIAMOND_BRL),
  };
}
