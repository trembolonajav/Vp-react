import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { loadPokemonCatalog, type PokemonDexEntry } from "../services/ivCalculator";

type Stats = { hp: number; atk: number; def: number; spAtk: number; spDef: number; speed: number };
type RankedPokemon = { position: number | null; globalRank: number; tier: string; inRecommendedTeam: boolean; dexNo: number; name: string; types: string[]; typesLabel: string; profile: string; score: number; bst: number; stats: Stats; offensiveCeilingR5: number; secondaryOffenseR5: number; robustnessR5: number; huntKanto: boolean; status: string; reading: string; whyBelowPrevious: string | null; whyAbovePrevious?: string | null; source: string; exclusionReason?: string };
type Clan = { id: string; name: string; elements: string; eligibleCount: number; usableCount: number; excludedCount: number; leader: string; leaderScore: number; recommendedTeam: string[]; ranking: RankedPokemon[]; excluded: RankedPokemon[] };
type ClanData = { meta: { model: string; consolidatedAt: string; speciesAudited: number; usableSpecies: number; excludedSpecies: number; clanParticipations: number }; methodology: { rank5Multiplier: number; bonusStats: string[]; weights: Record<string, number>; premises: { label: string; text: string }[]; limitations: string }; clans: Record<string, Clan> };

const CLANS: Record<string, { id: string; name: string; types: string[]; color: string; effect: string }> = {
  volcanic: { id: "volcanic", name: "Volcanic", types: ["fire"], color: "#ff6938", effect: "Fogo pressiona Planta, Gelo, Inseto e Aço." },
  raibolt: { id: "raibolt", name: "Raibolt", types: ["electric"], color: "#f0c531", effect: "Elétrico é especialmente útil contra Água e Voador." },
  orebound: { id: "orebound", name: "Orebound", types: ["ground", "rock"], color: "#bc9b78", effect: "Terra e Pedra entregam força física, resistência e boa cobertura." },
  naturia: { id: "naturia", name: "Naturia", types: ["grass", "bug"], color: "#55c96d", effect: "Planta e Inseto oferecem variedade física, especial e boas respostas de tipo." },
  gardestrike: { id: "gardestrike", name: "Gardestrike", types: ["fighting", "normal"], color: "#d0623d", effect: "Normal e Lutador concentram atacantes físicos fortes e consistentes." },
  ironhard: { id: "ironhard", name: "Ironhard", types: ["steel"], color: "#91a6b3", effect: "Aço combina muitas resistências com Pokémon de defesa elevada." },
  wingeon: { id: "wingeon", name: "Wingeon", types: ["flying", "dragon"], color: "#7fc9f6", effect: "Voador e Dragão reúnem atacantes versáteis e boa cobertura." },
  psycraft: { id: "psycraft", name: "Psycraft", types: ["psychic", "fairy"], color: "#f15b96", effect: "Psíquico e Fada favorecem poder especial e respostas contra Lutador e Dragão." },
  seavell: { id: "seavell", name: "Seavell", types: ["water", "ice"], color: "#58a9ff", effect: "Água e Gelo formam o maior catálogo elegível e cobrem muitas hunts." },
  malefic: { id: "malefic", name: "Malefic", types: ["ghost", "poison", "dark"], color: "#9665dc", effect: "Fantasma, Sombrio e Veneno oferecem imunidades e matchups variados." },
};
const CLAN_ORDER = ["volcanic", "raibolt", "orebound", "naturia", "gardestrike", "ironhard", "wingeon", "psycraft", "seavell", "malefic"];
const TYPE_LABEL: Record<string, string> = { normal: "Normal", fire: "Fogo", water: "Água", electric: "Elétrico", grass: "Planta", ice: "Gelo", fighting: "Lutador", poison: "Veneno", ground: "Terra", flying: "Voador", psychic: "Psíquico", bug: "Inseto", rock: "Pedra", ghost: "Fantasma", dragon: "Dragão", dark: "Sombrio", steel: "Aço", fairy: "Fada" };
const TYPE_COLOR: Record<string, string> = { normal: "#9a9a7c", fire: "#e0742f", water: "#5680d8", electric: "#d8b220", grass: "#6da33e", ice: "#7fc4c4", fighting: "#a5342a", poison: "#8f3f8f", ground: "#c9a952", flying: "#8d7fd8", psychic: "#dd4f7f", bug: "#93a021", rock: "#a89232", ghost: "#5f5390", dragon: "#5f3cc9", dark: "#584538", steel: "#8a8aa0", fairy: "#c96f9e" };
const MAIN_OFFENSE: Record<string, string> = { "Físico": "ATK R5", "Especial": "Sp. ATK R5", "Misto": "Ofensivo R5" };

const SPRITE = (n: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${n}.png`;
const formatScore = (n: number) => Number(n || 0).toFixed(2).replace(".", ",");

const CSS = `
.clanv2{--line:rgba(216,138,74,.18);--line-strong:rgba(229,179,79,.4);--red-2:#e24b35;--gold:#e5b34f;--gold-soft:#d98350;--cream:#f7eee7;--muted:#b5a196;--faint:#7d6d64;--bad:#ff6b55;color:var(--cream)}
.clanv2 .clan-wrap{width:min(1200px,calc(100% - 44px));margin-inline:auto}
.clanv2 .clan-tab{display:block;padding:28px;border:1px solid var(--line);border-radius:20px;background:linear-gradient(180deg,#17100e,#0b0908);box-shadow:0 10px 30px rgba(0,0,0,.35)}
.clanv2 .kicker{display:block;color:var(--gold-soft);text-transform:uppercase;letter-spacing:.22em;font-size:11px;font-weight:800;margin-bottom:8px}
.clanv2 h2.sec{font-family:"Cinzel",serif;font-size:24px;margin:0 0 4px}
.clanv2 .sec-sub{color:var(--muted);font-size:13px;margin:0 0 16px;max-width:760px}
.clanv2 .clan-type{display:inline-flex;align-items:center;border-radius:99px;border:1px solid color-mix(in srgb,var(--type) 55%,transparent);background:color-mix(in srgb,var(--type) 16%,transparent);color:var(--type);font-weight:800;letter-spacing:.05em;text-transform:uppercase;font-size:10px;padding:3px 8px}
.clanv2 .clan-rules{margin:0 0 20px;border:1px solid #33241d;border-radius:12px;background:#0e0b0a}
.clanv2 .clan-rules>summary{display:flex;align-items:center;min-height:44px;padding:12px 17px;cursor:pointer;font-size:13px;font-weight:800;color:var(--gold);list-style:none}
.clanv2 .clan-rules>summary::-webkit-details-marker{display:none}
.clanv2 .clan-rules>summary::after{content:" \\25BE";margin-left:6px}.clanv2 .clan-rules[open]>summary::after{content:" \\25B4"}
.clanv2 .clan-rules .clan-cards{padding:0 17px 17px;margin-top:0}
.clanv2 .clan-cards{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:6px}
.clanv2 .clan-card{border:1px solid var(--line);border-radius:14px;padding:20px;background:rgba(255,255,255,.03)}
.clanv2 .clan-card h3{font-size:13.5px;color:var(--gold);letter-spacing:.04em;margin:0 0 10px}
.clanv2 .clan-facts{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.clanv2 .clan-facts>div{padding:11px;border:1px solid rgba(255,255,255,.06);border-radius:10px;background:rgba(0,0,0,.16)}
.clanv2 .clan-facts .fact-value{display:block;font-size:14px;font-weight:800;color:var(--cream);margin-bottom:3px}
.clanv2 .clan-facts>div>span:last-child{font-size:12px;color:var(--muted)}
.clanv2 .rank-steps{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:9px}
.clanv2 .rank-steps li{display:flex;flex-direction:column;gap:2px;padding:10px 11px;border:1px solid rgba(255,255,255,.06);border-radius:10px;background:rgba(0,0,0,.16)}
.clanv2 .rank-steps li b{color:var(--cream);font-size:12.5px}
.clanv2 .rank-steps li span{font-size:10.5px;color:var(--faint)}
.clanv2 .clan-mission{margin:11px 0 0;font-size:11.5px;color:var(--muted)}
.clanv2 .clan-picker{padding:4px 0 8px}
.clanv2 .clan-picker-head{margin-bottom:22px}
.clanv2 .clan-picker-head h3,.clanv2 .clan-detail-simple h3,.clanv2 .clan-roster-title h3{font-family:"Cinzel",serif;color:var(--cream);margin:5px 0 7px}
.clanv2 .clan-picker-head h3{font-size:clamp(25px,3vw,34px)}
.clanv2 .clan-picker-head p,.clanv2 .clan-roster-title p{color:var(--muted);margin:0;line-height:1.55}
.clanv2 .clan-emblems-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px;align-items:stretch}
.clanv2 .clan-emblem-card{appearance:none;border:1px solid #3b2118;border-radius:15px;background:linear-gradient(160deg,#170d0a,#080605);padding:7px 7px 11px;min-width:0;color:inherit;cursor:pointer;transition:.2s transform,.2s border-color,.2s box-shadow}
.clanv2 .clan-emblem-card:hover{transform:translateY(-3px);border-color:var(--clan);box-shadow:0 12px 24px #0008}
.clanv2 .clan-emblem-card.is-selected{border-color:var(--clan);box-shadow:0 0 0 2px color-mix(in srgb,var(--clan) 45%,transparent),0 12px 28px #0009}
.clanv2 .clan-frame{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;aspect-ratio:1;background-color:transparent;background-image:url("/assets/vplab/clans/clan-frame-transparent.webp");background-repeat:no-repeat;background-position:center;background-size:100% 100%;overflow:visible}
.clanv2 .clan-frame .clan-emblem{position:absolute;left:50%;top:47%;transform:translate(-50%,-50%);width:43%;height:auto;aspect-ratio:1;display:grid;place-items:center;overflow:hidden}
.clanv2 .clan-frame .clan-emblem img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 7px 6px #000c) saturate(1.08)}
.clanv2 .clan-frame strong{position:absolute;z-index:3;left:18%;right:18%;bottom:7.4%;min-height:12%;display:grid;place-items:center;padding:4px 6px;border:1px solid #bd6d3e;border-radius:6px;background:linear-gradient(180deg,#351b11 0%,#120a07 48%,#251109 100%);box-shadow:inset 0 0 0 1px #4a2114,0 3px 7px #000c;font:700 clamp(9px,1vw,14px)/1 "Cinzel",serif;text-transform:uppercase;color:#f4e5d5;text-shadow:0 1px #000,0 0 8px color-mix(in srgb,var(--clan) 35%,transparent);letter-spacing:.035em}
.clanv2 .clan-emblem-card:hover .clan-frame{filter:brightness(1.08)}
.clanv2 .clan-emblem-card.is-selected .clan-frame{filter:drop-shadow(0 0 8px color-mix(in srgb,var(--clan) 55%,transparent))}
.clanv2 .clan-card-types{display:flex;justify-content:center;align-items:center;gap:4px;flex-wrap:wrap;min-height:29px;padding-top:9px}
.clanv2 .clan-card-types .clan-type{font-size:10px;padding:4px 7px}
.clanv2 .clan-detail-simple{scroll-margin-top:105px;margin-top:32px;border:1px solid var(--clan);border-radius:18px;background:linear-gradient(145deg,color-mix(in srgb,var(--clan) 7%,#130b09),#090706 50%);overflow:hidden}
.clanv2 .clan-detail-simple>header{display:flex;align-items:center;gap:22px;padding:25px 28px;border-bottom:1px solid #3a251c;background:linear-gradient(100deg,color-mix(in srgb,var(--clan) 15%,#130c09),#0d0908)}
.clanv2 .clan-detail-simple>header>img{width:110px;height:110px;object-fit:contain;filter:drop-shadow(0 8px 8px #000)}
.clanv2 .clan-detail-simple>header h3{font-size:32px;color:var(--clan);margin:5px 0 7px}
.clanv2 .clan-detail-simple>header p{max-width:760px;margin:12px 0 0;color:#c8b9af;line-height:1.55}
.clanv2 .clan-detail-simple>header .clan-pokemon-types{justify-content:flex-start;margin-top:4px}
.clanv2 .clan-counts{margin-top:10px;font-size:12px;color:var(--muted)}.clanv2 .clan-counts b{color:var(--gold)}
.clanv2 .clan-ranking-note{margin:20px 24px 0;padding:15px 17px;border:1px solid #4a321f;border-radius:12px;background:#11100f;color:#cbbdb4;line-height:1.55;display:flex;gap:8px;flex-direction:column}
.clanv2 .clan-ranking-note>b{color:var(--gold)}.clanv2 .clan-ranking-note>span{font-size:13px;color:var(--muted)}
.clanv2 .clan-roster-section{padding:26px 24px;border-top:1px solid #2c1c16;margin-top:24px}
.clanv2 .clan-roster-title{margin-bottom:15px}
.clanv2 .clan-roster-title>span{text-transform:uppercase;letter-spacing:.14em;color:var(--gold);font-size:11px;font-weight:800}
.clanv2 .clan-pokemon-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.clanv2 .clan-pokemon-grid.recommended{grid-template-columns:repeat(3,minmax(0,1fr))}
.clanv2 .clan-pokemon-card{position:relative;display:flex;flex-direction:column;align-items:center;min-width:0;padding:14px 10px;border:1px solid #39251c;border-radius:12px;background:linear-gradient(150deg,#170e0b,#0b0807);text-align:center}
.clanv2 .clan-pokemon-grid.recommended .clan-pokemon-card{border-color:var(--clan)}
.clanv2 .clan-pokemon-card>img{width:88px;height:88px;object-fit:contain;image-rendering:pixelated;filter:drop-shadow(0 5px 4px #000)}
.clanv2 .clan-pokemon-card h4{margin:3px 0 6px;color:#f0e5dc;font-size:14px}
.clanv2 .clan-pokemon-types{display:flex;justify-content:center;gap:3px;flex-wrap:wrap;min-height:20px}
.clanv2 .clan-pokemon-types .clan-type{font-size:10px;padding:3px 7px}
.clanv2 .clan-place,.clanv2 .clan-dex{position:absolute;top:8px;font-size:10px;font-weight:800}
.clanv2 .clan-place{left:9px;color:var(--gold)}.clanv2 .clan-dex{right:9px;color:#756b65}
.clanv2 .clan-verdict{display:flex;flex-direction:row;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin:8px 0 0}
.clanv2 .clan-tier{display:inline-grid;place-items:center;min-width:34px;padding:3px 8px;border:1px solid currentColor;border-radius:999px;font-size:11px;font-weight:900;letter-spacing:.04em}
.clanv2 .clan-tier[data-tier="S+"],.clanv2 .clan-tier[data-tier="S"]{color:#f2c14e}
.clanv2 .clan-tier[data-tier="A"]{color:#7fd18f}.clanv2 .clan-tier[data-tier="B"]{color:#7fb8d1}
.clanv2 .clan-tier[data-tier="C"]{color:var(--muted)}.clanv2 .clan-tier[data-tier="D"],.clanv2 .clan-tier[data-tier="E"]{color:#96837a}
.clanv2 .clan-score{font-variant-numeric:tabular-nums;font-weight:800;color:#e3c477;font-size:12px}
.clanv2 .clan-profile{margin:6px 0 0;font-size:11px;color:var(--muted)}
.clanv2 .clan-keystats{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;width:100%;margin:11px 0 0}
.clanv2 .clan-keystats>div{padding:7px 4px;border:1px solid #33221b;border-radius:8px;background:#ffffff05}
.clanv2 .clan-keystats dt{font-size:10px;color:var(--faint);text-transform:uppercase;letter-spacing:.04em}
.clanv2 .clan-keystats dd{margin:3px 0 0;font-size:13px;font-weight:800;color:var(--cream);font-variant-numeric:tabular-nums}
.clanv2 .clan-card-more{width:100%;margin-top:11px;border-top:1px solid #2c1c16;text-align:left}
.clanv2 .clan-card-more>summary{display:flex;align-items:center;min-height:44px;padding:2px;list-style:none;cursor:pointer;font-size:11px;font-weight:800;color:var(--gold)}
.clanv2 .clan-card-more>summary::-webkit-details-marker{display:none}
.clanv2 .clan-card-more>summary::after{content:" \\25BE";margin-left:6px}.clanv2 .clan-card-more[open]>summary::after{content:" \\25B4"}
.clanv2 .clan-card-more-body{padding-top:9px;font-size:12px;color:var(--muted);line-height:1.55}
.clanv2 .clan-card-more-body p{margin:0 0 8px}.clanv2 .clan-card-more-body b{color:#dcc39a}
.clanv2 .clan-statline{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:10px 0}
.clanv2 .clan-statline>div{padding:5px 4px;border-radius:6px;background:#ffffff06;text-align:center}
.clanv2 .clan-statline dt{font-size:10px;color:var(--faint)}
.clanv2 .clan-statline dd{margin:2px 0 0;font-size:12px;font-weight:700;color:var(--cream);font-variant-numeric:tabular-nums}
.clanv2 .clan-card-meta{display:flex;flex-direction:column;gap:4px;font-size:11px}
.clanv2 .clan-card-source{display:inline-flex;align-items:center;min-height:44px;margin-top:2px;color:var(--gold);font-size:11px;font-weight:700;text-decoration:underline}
.clanv2 .clan-sub-preview,.clanv2 .clan-sub-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.clanv2 .clan-pokemon-card.is-substitute{align-items:stretch;padding:11px;text-align:left}
.clanv2 .clan-sub-head{display:grid;grid-template-columns:auto 52px minmax(0,1fr) auto;gap:9px;align-items:center}
.clanv2 .clan-sub-place{font-size:11px;font-weight:800;color:var(--faint);font-variant-numeric:tabular-nums}
.clanv2 .clan-pokemon-card.is-substitute img{width:52px;height:52px;object-fit:contain;image-rendering:pixelated}
.clanv2 .clan-sub-id{min-width:0}.clanv2 .clan-sub-id h4{margin:0 0 4px;font-size:13px;color:#f0e5dc}
.clanv2 .clan-sub-id .clan-pokemon-types{justify-content:flex-start;min-height:0}
.clanv2 .clan-sub-verdict{display:flex;flex-direction:column;align-items:flex-end;gap:4px}
.clanv2 .clan-sub-filters{display:grid;grid-template-columns:minmax(180px,1.4fr) minmax(140px,1fr) minmax(160px,1fr);gap:10px;margin-bottom:14px}
.clanv2 .clan-sub-filters label{display:flex;flex-direction:column;gap:5px;min-width:0}
.clanv2 .clan-sub-filters span{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
.clanv2 .clan-sub-filters input,.clanv2 .clan-sub-filters select{min-height:42px;padding:9px 11px;border:1px solid var(--line);border-radius:9px;background:#0b0807;color:var(--cream);font:inherit;font-size:13px}
.clanv2 .clan-sub-filters input:focus,.clanv2 .clan-sub-filters select:focus{border-color:var(--gold);outline:none}
.clanv2 .clan-expand{display:block;width:100%;min-height:44px;margin-top:14px;padding:11px 16px;border:1px solid var(--line-strong);border-radius:10px;background:#e5b34f14;color:var(--cream);font-weight:800;font-size:13px;cursor:pointer}
.clanv2 .clan-expand:hover{background:#e5b34f22;border-color:var(--gold)}
.clanv2 .clan-empty{color:var(--muted);padding:16px;border:1px dashed #3a2a22;border-radius:10px}
.clanv2 .clan-excluded{margin:24px 24px 0;border:1px solid #33241d;border-radius:12px;background:#0e0b0a}
.clanv2 .clan-excluded>summary{display:flex;align-items:center;min-height:44px;padding:12px 17px;cursor:pointer;font-size:13px;font-weight:800;color:var(--muted);list-style:none}
.clanv2 .clan-excluded>summary::-webkit-details-marker{display:none}
.clanv2 .clan-excluded>summary::after{content:" \\25BE";margin-left:auto}.clanv2 .clan-excluded[open]>summary::after{content:" \\25B4"}
.clanv2 .clan-excluded>summary b{margin-left:6px;padding:2px 8px;border-radius:999px;background:#2a1d16;color:var(--gold);font-size:11px}
.clanv2 .clan-excluded-body{padding:0 17px 17px}
.clanv2 .clan-excluded-body>p{margin:0 0 12px;font-size:12px;color:var(--faint);line-height:1.55}
.clanv2 .clan-excluded-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
.clanv2 .clan-excluded-card{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px;border:1px solid #2c1f19;border-radius:10px;background:#ffffff04}
.clanv2 .clan-excluded-card img{width:44px;height:44px;object-fit:contain;image-rendering:pixelated;opacity:.75}
.clanv2 .clan-excluded-card h4{margin:0 0 4px;font-size:13px;color:#ddd0c7}
.clanv2 .clan-excluded-card h4 span{color:var(--faint);font-weight:400;font-size:11px}
.clanv2 .clan-excluded-card .clan-pokemon-types{justify-content:flex-start;min-height:0}
.clanv2 .clan-excluded-score{text-align:right}
.clanv2 .clan-excluded-score b{display:block;font-size:14px;color:#c9b083;font-variant-numeric:tabular-nums}
.clanv2 .clan-excluded-score span{font-size:10px;color:var(--faint)}
.clanv2 .clan-excluded-card>p{grid-column:1/-1;margin:0;font-size:11px;color:var(--faint)}
.clanv2 .clan-methodology{margin-top:4px;border-top:1px solid #33241d;padding-top:10px}
.clanv2 .clan-methodology>summary{display:flex;align-items:center;min-height:44px;cursor:pointer;font-size:12px;font-weight:800;color:var(--gold);list-style:none}
.clanv2 .clan-methodology>summary::-webkit-details-marker{display:none}
.clanv2 .clan-methodology>summary::after{content:" \\25BE";margin-left:6px}.clanv2 .clan-methodology[open]>summary::after{content:" \\25B4"}
.clanv2 .clan-methodology-body{margin-top:12px;display:grid;gap:16px}
.clanv2 .clan-methodology-body h4{margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--gold)}
.clanv2 .clan-methodology-body p,.clanv2 .clan-methodology-body li{font-size:12px;color:var(--muted);line-height:1.6;margin:0}
.clanv2 .clan-methodology-body ul{margin:0;padding-left:18px;display:grid;gap:5px}
.clanv2 .clan-weights{width:100%;border-collapse:collapse;font-size:12px}
.clanv2 .clan-weights th,.clanv2 .clan-weights td{padding:7px 9px;border-bottom:1px solid #2a1e18;text-align:left;color:var(--muted)}
.clanv2 .clan-weights th{color:var(--gold);font-size:11px;text-transform:uppercase;letter-spacing:.05em}
.clanv2 .clan-weights td:nth-child(2){color:var(--cream);font-weight:800;font-variant-numeric:tabular-nums;white-space:nowrap}
.clanv2 .clan-formula{padding:10px 12px;border:1px solid #33241d;border-radius:8px;background:#0b0908;font-family:ui-monospace,monospace;font-size:11px;overflow-x:auto}
.clanv2 .clan-version{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:24px;padding:14px 24px;border-top:1px solid #2c1c16;font-size:11px;color:var(--faint)}
.clanv2 .clan-loading{padding:26px;color:var(--muted)}.clanv2 .clan-error{color:var(--bad)}
@media(max-width:1050px){.clanv2 .clan-emblems-grid{grid-template-columns:repeat(5,minmax(110px,1fr));gap:9px}.clanv2 .clan-pokemon-grid{grid-template-columns:repeat(3,1fr)}.clanv2 .clan-sub-preview,.clanv2 .clan-sub-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:780px){.clanv2 .clan-tab{padding:18px}.clanv2 .clan-cards{grid-template-columns:1fr}.clanv2 .clan-emblems-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.clanv2 .clan-pokemon-grid,.clanv2 .clan-pokemon-grid.recommended{grid-template-columns:repeat(2,minmax(0,1fr))}.clanv2 .clan-detail-simple>header{align-items:flex-start;padding:20px;gap:14px}.clanv2 .clan-detail-simple>header>img{width:76px;height:76px}.clanv2 .clan-detail-simple>header h3{font-size:25px}.clanv2 .clan-sub-preview,.clanv2 .clan-sub-grid,.clanv2 .clan-excluded-grid,.clanv2 .clan-sub-filters{grid-template-columns:1fr}}
@media(max-width:430px){.clanv2 .clan-emblems-grid{grid-template-columns:1fr 1fr;gap:7px}.clanv2 .clan-pokemon-grid,.clanv2 .clan-pokemon-grid.recommended{grid-template-columns:1fr}.clanv2 .clan-keystats{grid-template-columns:1fr 1fr}.clanv2 .clan-keystats>div:last-child{grid-column:1/-1}}
`;

function TypeBadge({ type }: { type: string }) {
  return <span className="clan-type" style={{ ["--type" as string]: TYPE_COLOR[type] || "#777" }}>{TYPE_LABEL[type] || type}</span>;
}

function referenceMove(catalog: PokemonDexEntry[], dexNo: number) {
  const sp = catalog.find((s) => s.n === dexNo);
  if (!sp) return null;
  const moves = (sp.g || []).filter((m) => (m[2] === "fisico" || m[2] === "especial") && Number(m[3]) > 0).sort((a, b) => Number(b[3]) - Number(a[3]));
  return moves[0] || null;
}

function CardDetails({ entry, catalog }: { entry: RankedPokemon; catalog: PokemonDexEntry[] }) {
  const move = referenceMove(catalog, entry.dexNo);
  const rows: Array<[string, number]> = [["HP", entry.stats.hp], ["ATK", entry.stats.atk], ["DEF", entry.stats.def], ["Sp. ATK", entry.stats.spAtk], ["Sp. DEF", entry.stats.spDef], ["Speed", entry.stats.speed], ["BST", entry.bst]];
  return (
    <details className="clan-card-more">
      <summary>Leitura técnica</summary>
      <div className="clan-card-more-body">
        <p>{entry.reading}</p>
        {entry.whyBelowPrevious && <p><b>Posição anterior:</b> {entry.whyBelowPrevious}</p>}
        {entry.whyAbovePrevious && <p><b>Posição seguinte:</b> {entry.whyAbovePrevious}</p>}
        <dl className="clan-statline">{rows.map(([l, v]) => <div key={l}><dt>{l}</dt><dd>{v}</dd></div>)}</dl>
        <p className="clan-card-meta">
          <span>Hunt própria em Kanto: <b>{entry.huntKanto ? "sim" : "não"}</b></span>
          {move && <span>Golpe de referência: <b>{move[0]}</b> (poder {move[3]}) — não entra no score</span>}
        </p>
        {entry.source && <a className="clan-card-source" href={entry.source} target="_blank" rel="noreferrer">Ver {entry.name} na Poképedia</a>}
      </div>
    </details>
  );
}

function TopCard({ entry, catalog }: { entry: RankedPokemon; catalog: PokemonDexEntry[] }) {
  return (
    <article className="clan-pokemon-card is-top">
      <span className="clan-place">#{entry.position}</span>
      <span className="clan-dex">#{String(entry.dexNo).padStart(3, "0")}</span>
      <img src={SPRITE(entry.dexNo)} alt="" loading="lazy" width={88} height={88} />
      <h4>{entry.name}</h4>
      <div className="clan-pokemon-types">{entry.types.map((t) => <TypeBadge key={t} type={t} />)}</div>
      <p className="clan-verdict">
        <span className="clan-tier" data-tier={entry.tier}>Tier {entry.tier}</span>
        <span className="clan-score">Score {formatScore(entry.score)}</span>
      </p>
      <p className="clan-profile">Perfil {entry.profile.toLowerCase()}</p>
      <dl className="clan-keystats">
        <div><dt>{MAIN_OFFENSE[entry.profile] || "Ofensivo R5"}</dt><dd>{Math.round(entry.offensiveCeilingR5)}</dd></div>
        <div><dt>Speed</dt><dd>{entry.stats.speed}</dd></div>
        <div><dt>Robustez R5</dt><dd>{Math.round(entry.robustnessR5)}</dd></div>
      </dl>
      <CardDetails entry={entry} catalog={catalog} />
    </article>
  );
}

function SubstituteCard({ entry, catalog }: { entry: RankedPokemon; catalog: PokemonDexEntry[] }) {
  return (
    <article className="clan-pokemon-card is-substitute">
      <div className="clan-sub-head">
        <span className="clan-sub-place">#{entry.position}</span>
        <img src={SPRITE(entry.dexNo)} alt="" loading="lazy" width={52} height={52} />
        <div className="clan-sub-id">
          <h4>{entry.name}</h4>
          <div className="clan-pokemon-types">{entry.types.map((t) => <TypeBadge key={t} type={t} />)}</div>
        </div>
        <div className="clan-sub-verdict">
          <span className="clan-tier" data-tier={entry.tier}>{entry.tier}</span>
          <span className="clan-score">{formatScore(entry.score)}</span>
        </div>
      </div>
      <CardDetails entry={entry} catalog={catalog} />
    </article>
  );
}

function Methodology({ model }: { model: ClanData }) {
  const { methodology, meta } = model;
  const rows: Array<[string, number, string]> = [
    ["Teto ofensivo", methodology.weights.offensiveCeiling, "Maior entre ATK e Sp. ATK após o bônus."],
    ["Ofensiva secundária", methodology.weights.secondaryOffense, "Menor entre ATK e Sp. ATK após o bônus."],
    ["Robustez", methodology.weights.robustness, "Raiz de HP × média das defesas com bônus."],
    ["Speed", methodology.weights.speed, "Peso moderado: o efeito exato no ritmo não está documentado."],
    ["BST", methodology.weights.bst, "Soma dos seis stats base, como controle de consistência."],
  ];
  return (
    <details className="clan-methodology">
      <summary>Ver metodologia completa</summary>
      <div className="clan-methodology-body">
        <section>
          <h4>Pesos do score</h4>
          <table className="clan-weights">
            <thead><tr><th>Componente</th><th>Peso</th><th>O que mede</th></tr></thead>
            <tbody>{rows.map(([label, weight, note]) => <tr key={label}><td>{label}</td><td>{Math.round(weight * 100)}%</td><td>{note}</td></tr>)}</tbody>
          </table>
        </section>
        <section>
          <h4>Fórmula simplificada</h4>
          <p className="clan-formula">score = 100 × ( {rows.map(([label, weight]) => `${weight} × ${label.toLowerCase()} ÷ máximo`).join(" + ")} )</p>
          <p>Cada componente é normalizado pelo maior valor entre as {meta.speciesAudited} espécies auditadas, de modo que o score fique em uma escala de 0 a 100.</p>
        </section>
        <section>
          <h4>Bônus de Rank 5</h4>
          <p>Multiplicador <b>×{methodology.rank5Multiplier}</b> aplicado em {methodology.bonusStats.join(", ")}. HP e Speed não recebem bônus.</p>
        </section>
        <section>
          <h4>Regras de elegibilidade e exclusões</h4>
          <ul>{methodology.premises.filter((i) => ["Elegibilidade", "Lendários/míticos", "Comparação justa", "Interpretação"].includes(i.label)).map((i) => <li key={i.label}><b>{i.label}:</b> {i.text}</li>)}</ul>
        </section>
        <section>
          <h4>Limitações</h4>
          <p>{methodology.limitations}</p>
        </section>
      </div>
    </details>
  );
}

function SubstitutesSection({ clan, data, catalog }: { clan: { id: string }; data: Clan; catalog: PokemonDexEntry[] }) {
  const substitutes = data.ranking.slice(6);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("position");
  useEffect(() => { setOpen(false); setQuery(""); setType(""); setSort("position"); }, [clan.id]);
  if (!substitutes.length) return null;

  const typesPresent = [...new Set(substitutes.flatMap((e) => e.types))].sort((a, b) => TYPE_LABEL[a].localeCompare(TYPE_LABEL[b], "pt-BR"));
  const showFilters = substitutes.length >= 8;
  const order: Record<string, (a: RankedPokemon, b: RankedPokemon) => number> = {
    position: (a, b) => (a.position ?? 0) - (b.position ?? 0),
    score: (a, b) => b.score - a.score || (a.position ?? 0) - (b.position ?? 0),
    dex: (a, b) => a.dexNo - b.dexNo,
    name: (a, b) => a.name.localeCompare(b.name, "pt-BR"),
  };
  const list = [...substitutes.filter((e) => (!query || e.name.toLowerCase().includes(query.toLowerCase())) && (!type || e.types.includes(type)))].sort(order[sort] || order.position);

  if (!open) {
    return (
      <section className="clan-roster-section clan-substitutes">
        <div className="clan-roster-title"><span>Substitutos</span><h3>Fora do time recomendado</h3><p>Prévia dos 3 primeiros. A ordem segue a posição da planilha.</p></div>
        <div className="clan-sub-preview">{substitutes.slice(0, 3).map((e) => <SubstituteCard key={e.dexNo} entry={e} catalog={catalog} />)}</div>
        <button className="clan-expand" type="button" onClick={() => setOpen(true)}>Ver todos os {substitutes.length} substitutos</button>
      </section>
    );
  }
  return (
    <section className="clan-roster-section clan-substitutes is-open">
      <div className="clan-roster-title"><span>Substitutos</span><h3>Fora do time recomendado</h3><p>{substitutes.length} {substitutes.length === 1 ? "opção" : "opções"} além do Top 6.</p></div>
      {showFilters && (
        <div className="clan-sub-filters">
          <label><span>Buscar</span><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nome do Pokémon" autoComplete="off" /></label>
          <label><span>Tipo</span><select value={type} onChange={(e) => setType(e.target.value)}><option value="">Todos os tipos</option>{typesPresent.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}</select></label>
          <label><span>Ordenar por</span><select value={sort} onChange={(e) => setSort(e.target.value)}><option value="position">Posição no clã</option><option value="score">Score</option><option value="dex">Número da Pokédex</option><option value="name">Nome</option></select></label>
        </div>
      )}
      {list.length ? <div className="clan-sub-grid">{list.map((e) => <SubstituteCard key={e.dexNo} entry={e} catalog={catalog} />)}</div> : <p className="clan-empty">Nenhum substituto corresponde ao filtro.</p>}
      <button className="clan-expand" type="button" onClick={() => setOpen(false)}>Recolher lista</button>
    </section>
  );
}

function Detail({ clanId, model, catalog }: { clanId: string; model: ClanData; catalog: PokemonDexEntry[] }) {
  const clan = CLANS[clanId];
  const data = model.clans[clanId];
  if (!data) return null;
  const top = data.ranking.slice(0, 6);
  return (
    <section className="clan-detail-simple" style={{ ["--clan" as string]: clan.color }}>
      <header>
        <img src={`/assets/vplab/clans/${clan.id}.png`} alt="" width={110} height={110} loading="lazy" />
        <div>
          <span className="kicker">Clã selecionado</span>
          <h3>{clan.name}</h3>
          <div className="clan-pokemon-types">{clan.types.map((t) => <TypeBadge key={t} type={t} />)}</div>
          <p>{clan.effect}</p>
          <p className="clan-counts"><b>{data.usableCount}</b> utilizáveis{data.excludedCount ? <> · <b>{data.excludedCount}</b> excluídos</> : null} · <b>{data.eligibleCount}</b> elegíveis</p>
        </div>
      </header>

      <div className="clan-ranking-note">
        <b>Como este ranking foi montado</b>
        <span>Este ranking compara as espécies em condições iguais de nível, Quality e IV. O bônus máximo do clã aplica 30% em Ataque, Ataque Especial, Defesa e Defesa Especial. O score prioriza o teto ofensivo, mas também considera ofensiva secundária, robustez, Speed e BST. Lendários e míticos ficam fora do time utilizável. A versão atual ainda não considera poder, cooldown, precisão ou efeitos específicos dos golpes.</span>
        <Methodology model={model} />
      </div>

      <section className="clan-roster-section">
        <div className="clan-roster-title"><span>Time recomendado</span><h3>Top 6 do {clan.name}</h3><p>Liderado por {data.leader}, com score {formatScore(data.leaderScore)}.</p></div>
        <div className="clan-pokemon-grid recommended">{top.map((e) => <TopCard key={e.dexNo} entry={e} catalog={catalog} />)}</div>
      </section>

      <SubstitutesSection clan={clan} data={data} catalog={catalog} />

      {!!data.excluded.length && (
        <details className="clan-excluded">
          <summary>Lendários e míticos excluídos <b>{data.excluded.length}</b></summary>
          <div className="clan-excluded-body">
            <p>Mantidos na auditoria das {model.meta.speciesAudited} espécies, mas fora do ranking utilizável pela metodologia. Não entram no Top 6 nem na lista de substitutos.</p>
            <div className="clan-excluded-grid">{data.excluded.map((e) => (
              <article className="clan-excluded-card" key={e.dexNo}>
                <img src={SPRITE(e.dexNo)} alt="" loading="lazy" width={44} height={44} />
                <div><h4>{e.name} <span>#{String(e.dexNo).padStart(3, "0")}</span></h4><div className="clan-pokemon-types">{e.types.map((t) => <TypeBadge key={t} type={t} />)}</div></div>
                <div className="clan-excluded-score"><b>{formatScore(e.score)}</b><span>score teórico</span></div>
                <p>{e.exclusionReason}</p>
              </article>
            ))}</div>
          </div>
        </details>
      )}

      <div className="clan-version"><span>{model.meta.model}</span><span>Última consolidação: {model.meta.consolidatedAt}</span></div>
    </section>
  );
}

export function ClanPage() {
  const [model, setModel] = useState<ClanData | null>(null);
  const [error, setError] = useState("");
  const [catalog, setCatalog] = useState<PokemonDexEntry[]>([]);
  const [params, setParams] = useSearchParams();
  const requested = params.get("clan");
  const selectedId = requested && CLANS[requested] ? requested : null;

  useEffect(() => { fetch("/vplab-data/clan-ranking.json", { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); }).then(setModel).catch(() => setError("Não foi possível carregar o ranking dos clãs. Recarregue a página para tentar de novo.")); }, []);
  useEffect(() => { loadPokemonCatalog().then(setCatalog).catch(() => undefined); }, []);

  const clans = useMemo(() => CLAN_ORDER.map((id) => CLANS[id]), []);
  const toggle = (id: string) => { const next = new URLSearchParams(params); if (selectedId === id) next.delete("clan"); else next.set("clan", id); setParams(next); };

  return (
    <main className="clanv2" style={{ padding: "26px 0 90px" }}>
      <style>{CSS}</style>
      <div className="clan-wrap">
        <section className="clan-tab">
          <span className="kicker">Sistema de clãs</span>
          <h2 className="sec">Clãs: o que dão e como subir</h2>
          <p className="sec-sub">Regras oficiais da Pokepedia — 10 clãs, cada um cobrindo elementos. O bônus só vale para Pokémon dos elementos do seu clã.</p>

          <details className="clan-rules">
            <summary>Como funciona o sistema (entrada, custos e missões)</summary>
            <div className="clan-cards clan-guide">
              <div className="clan-card">
                <h3>Como funciona</h3>
                <div className="clan-facts">
                  <div><span className="fact-value">Nv 80</span><span>Entrada grátis no Rank 1</span></div>
                  <div><span className="fact-value">💎 40 → 60 → 80</span><span>Custo crescente para trocar</span></div>
                  <div><span className="fact-value">+6% por rank</span><span>Ataque, Atq. Esp., Defesa e Def. Esp.</span></div>
                  <div><span className="fact-value">+30%</span><span>Máximo no Rank 5, apenas nos elementos cobertos</span></div>
                </div>
              </div>
              <div className="clan-card">
                <h3>Subindo de rank (missões)</h3>
                <ol className="rank-steps">
                  <li><b>Rank 2 · Nv 90</b><span>Pular: 1,5KK · recompensa: 210k XP</span></li>
                  <li><b>Rank 3 · Nv 100</b><span>Pular: 3KK · recompensa: 420k XP</span></li>
                  <li><b>Rank 4 · Nv 110</b><span>Pular: 4,5KK · recompensa: 630k XP</span></li>
                  <li><b>Rank 5 · Nv 120</b><span>Pular: 6KK · recompensa: 840k XP</span></li>
                </ol>
                <p className="clan-mission">Cada etapa pede itens do clã (consumidos), a captura de uma espécie específica e derrotas por elemento.</p>
              </div>
            </div>
          </details>

          {error && <div className="clan-loading clan-error">{error}</div>}
          {!model && !error && <div className="clan-loading">Carregando os clãs…</div>}

          {model && (
            <>
              <section className="clan-picker">
                <div className="clan-picker-head">
                  <span className="kicker">Os dez clãs</span>
                  <h3>Selecione um emblema</h3>
                  <p>Escolha um clã para ver o time recomendado, os substitutos e a metodologia por trás do ranking.</p>
                </div>
                <div className="clan-emblems-grid">
                  {clans.map((clan) => (
                    <button key={clan.id} className={`clan-emblem-card${selectedId === clan.id ? " is-selected" : ""}`} style={{ ["--clan" as string]: clan.color }} type="button" aria-pressed={selectedId === clan.id} onClick={() => toggle(clan.id)}>
                      <span className="clan-frame">
                        <span className="clan-emblem"><img src={`/assets/vplab/clans/${clan.id}-symbol.png`} alt="" width={96} height={96} loading="lazy" /></span>
                        <strong>{clan.name}</strong>
                      </span>
                      <span className="clan-card-types">{clan.types.map((t) => <TypeBadge key={t} type={t} />)}</span>
                    </button>
                  ))}
                </div>
              </section>
              {selectedId && <Detail clanId={selectedId} model={model} catalog={catalog} />}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
