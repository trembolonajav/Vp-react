import type { IvScanFields } from "../types/ivScanner";

export interface PokemonDexEntry {
  n: number;
  s: string;
  m: string;
  bs: [number, number, number, number, number, number];
}

export interface IvAnalysis {
  species: PokemonDexEntry;
  ivs: number[];
  ranges: Array<{ low: number; high: number }>;
  total: { low: number; likely: number; high: number };
  confidence: number;
  potential: number;
  calculatedPower: number;
  powerDifference: number | null;
  warnings: string[];
}

const EXPONENTS = [0.95, 0.8, 0.8, 0.8, 0.8, 0.95];
let catalogPromise: Promise<PokemonDexEntry[]> | null = null;
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));

export function normalizeSpecies(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "").toLowerCase();
}

export function loadPokemonCatalog() {
  catalogPromise ??= fetch("/vplab-data/vplab-dex.json").then((response) => {
    if (!response.ok) throw new Error("Não foi possível carregar a Pokédex do avaliador.");
    return response.json() as Promise<PokemonDexEntry[]>;
  });
  return catalogPromise;
}

export function findSpecies(catalog: PokemonDexEntry[], name: string) {
  const normalized = normalizeSpecies(name);
  return catalog.find((entry) =>
    normalizeSpecies(entry.m) === normalized || normalizeSpecies(entry.s) === normalized);
}

export function analyzeIv(fields: IvScanFields, species: PokemonDexEntry): IvAnalysis | null {
  const level = Number(fields.level);
  const quality = Number(fields.quality);
  const stats = fields.stats.map(Number);
  if (!level || !quality || stats.some((stat) => !Number.isFinite(stat) || stat <= 0)) return null;

  const raw = (shown: number, index: number) =>
    (shown / ((level / 100) * quality ** EXPONENTS[index]) - species.bs[index]) / 2;
  const rawMid = stats.map(raw);
  const rawLow = stats.map((stat, index) => raw(stat - 0.5, index));
  const rawHigh = stats.map((stat, index) => raw(stat + 0.5, index));
  const ivs = rawMid.map((value) => Math.round(clamp(value, 0, 32)));
  const ranges = rawMid.map((_, index) => ({
    low: Math.floor(clamp(rawLow[index], 0, 32)),
    high: Math.ceil(clamp(rawHigh[index], 0, 32)),
  }));
  const total = {
    low: Math.floor(rawLow.reduce((sum, value) => sum + clamp(value, 0, 32), 0)),
    likely: ivs.reduce((sum, value) => sum + value, 0),
    high: Math.ceil(rawHigh.reduce((sum, value) => sum + clamp(value, 0, 32), 0)),
  };
  const impossible = rawMid.some((value) => value < -0.35 || value > 32.35);
  const saturated = rawMid.filter((value) => value >= 31.9).length;
  const spread = rawHigh.reduce((sum, value, index) => sum + value - rawLow[index], 0);
  let confidence = clamp(100 - spread * 2.2, 35, 99);
  if (saturated >= 3) confidence = Math.min(confidence, 62);
  if (impossible) confidence = Math.min(confidence, 40);

  const physical = species.bs[1] ** 4;
  const special = species.bs[3] ** 4;
  const offensive = physical + special || 1;
  const weights = [0.11, 0.695 * physical / offensive, 0.09, 0.695 * special / offensive, 0.09, 0.015];
  const potential = clamp(
    ivs.reduce((sum, iv, index) => sum + (iv / 32) * weights[index], 0) *
      (quality / 1.8) ** 1.15 * 100, 0, 400);
  const calculatedPower = Math.round(stats.reduce((sum, value) => sum + value, 0) * quality);
  const shownPower = Number(fields.power);
  const warnings: string[] = [];
  if (impossible) warnings.push("Há atributos incompatíveis com espécie, nível ou qualidade. Revise o OCR.");
  if (fields.ivTotal && Math.abs(Number(fields.ivTotal) - total.likely) > 2) {
    warnings.push(`O card informa IV ${fields.ivTotal}, mas os atributos indicam aproximadamente ${total.likely}.`);
  }
  return {
    species, ivs, ranges, total, confidence: Math.round(confidence),
    potential: Math.round(potential * 10) / 10, calculatedPower,
    powerDifference: shownPower ? shownPower - calculatedPower : null, warnings,
  };
}
