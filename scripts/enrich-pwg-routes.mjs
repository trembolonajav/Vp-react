import { readFile, writeFile } from "node:fs/promises";

const dataPath = new URL("../frontend/public/vplab-data/pwg-hunt-routes.json", import.meta.url);
const data = JSON.parse(await readFile(dataPath, "utf8"));
const page = await fetch("https://pokewg.com/play").then((response) => response.text());
const chunkPath = page.match(/src="([^"]*\/app\/play\/page-[^"]+\.js)"/)?.[1];
if (!chunkPath) throw new Error("Chunk principal do PWG não encontrado.");
const source = await fetch(new URL(chunkPath, "https://pokewg.com")).then((response) => response.text());

const species = [];
const marker = "{\"pokeId\":";
let cursor = 0;
while ((cursor = source.indexOf(marker, cursor)) >= 0) {
  let depth = 0;
  let end = cursor;
  for (; end < source.length; end += 1) {
    if (source[end] === "{") depth += 1;
    else if (source[end] === "}" && --depth === 0) { end += 1; break; }
  }
  const encoded = source.slice(cursor, end);
  try { species.push(JSON.parse(encoded)); } catch { /* ignora bloco incompleto */ }
  cursor = Math.max(end, cursor + marker.length);
}
if (!species.length) throw new Error("Catálogo de espécies não pôde ser extraído do cliente PWG.");

const key = (value) => value.toLocaleLowerCase("pt-BR").replace(/[^a-z0-9]/g, "");
// O bundle repete algumas espécies em objetos resumidos. Preserve sempre a
// ocorrência completa; a última ocorrência nem sempre contém tipos e stats.
const richness = (pokemon) => [pokemon.type1, pokemon.baseHp, pokemon.baseAtk, pokemon.baseDef, pokemon.baseSpAtk, pokemon.baseSpDef, pokemon.baseSpeed, ...(pokemon.attacks || [])].filter((value) => value !== undefined && value !== null).length;
const byName = new Map();
for (const pokemon of species) {
  const pokemonKey = key(pokemon.name);
  if (!byName.has(pokemonKey) || richness(pokemon) > richness(byName.get(pokemonKey))) byName.set(pokemonKey, pokemon);
}
let enriched = 0;
for (const region of data.regions) for (const entry of region.entries) {
  const pokemon = byName.get(key(entry.name));
  if (!pokemon) continue;
  entry.pokemon = {
    id: pokemon.pokeId,
    slug: key(pokemon.name),
    types: [pokemon.type1, pokemon.type2].filter(Boolean).map((type) => type.toLowerCase()),
    stats: [pokemon.baseHp, pokemon.baseAtk, pokemon.baseDef, pokemon.baseSpAtk, pokemon.baseSpDef, pokemon.baseSpeed],
    attacks: (pokemon.attacks || []).map((attack) => [attack.name, attack.type.toLowerCase(), attack.category === "SPECIAL" ? "especial" : "fisico", attack.power, attack.learnLevel]),
    rarity: pokemon.rarity,
  };
  enriched += 1;
}
data.catalogSource = new URL(chunkPath, "https://pokewg.com").href;
data.enrichedAt = new Date().toISOString();
await writeFile(dataPath, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`Catálogo PWG: ${species.length} espécies encontradas; ${enriched} marcadores enriquecidos.`);
