import type { PokemonDexEntry } from "./ivCalculator";

export const ROUTE_DEX_NUMBERS = new Set([
  1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,114,115,120,121,122,123,124,125,126,127,128,130,131,138,139,140,141,142,143,147,148,149,152,153,154,155,156,157,158,159,160,164,169,170,171,172,173,174,177,178,179,180,181,182,183,184,186,192,195,200,202,203,204,205,207,208,209,210,212,214,216,217,218,219,220,221,226,227,228,229,230,231,232,236,237,238,239,240,241,246,247,248,
]);
export const TYPE_LABELS:Record<string,string>={normal:"Normal",fire:"Fogo",water:"Água",electric:"Elétrico",grass:"Planta",ice:"Gelo",fighting:"Lutador",poison:"Veneno",ground:"Terra",flying:"Voador",psychic:"Psíquico",bug:"Inseto",rock:"Pedra",ghost:"Fantasma",dragon:"Dragão",dark:"Sombrio",steel:"Aço",fairy:"Fada"};
const CHART:Record<string,Record<string,number>>={
  normal:{rock:.5,ghost:0,steel:.5},fire:{fire:.5,water:.5,grass:2,ice:2,bug:2,rock:.5,dragon:.5,steel:2},water:{fire:2,water:.5,grass:.5,ground:2,rock:2,dragon:.5},electric:{water:2,electric:.5,grass:.5,ground:0,flying:2,dragon:.5},grass:{fire:.5,water:2,grass:.5,poison:.5,ground:2,flying:.5,bug:.5,rock:2,dragon:.5,steel:.5},ice:{fire:.5,water:.5,grass:2,ice:.5,ground:2,flying:2,dragon:2,steel:.5},fighting:{normal:2,ice:2,poison:.5,flying:.5,psychic:.5,bug:.5,rock:2,ghost:0,dark:2,steel:2,fairy:.5},poison:{grass:2,poison:.5,ground:.5,rock:.5,ghost:.5,steel:0,fairy:2},ground:{fire:2,electric:2,grass:.5,poison:2,flying:0,bug:.5,rock:2,steel:2},flying:{electric:.5,grass:2,fighting:2,bug:2,rock:.5,steel:.5},psychic:{fighting:2,poison:2,psychic:.5,dark:0,steel:.5},bug:{fire:.5,grass:2,fighting:.5,poison:.5,flying:.5,psychic:2,ghost:.5,dark:2,steel:.5,fairy:.5},rock:{fire:2,ice:2,fighting:.5,ground:.5,flying:2,bug:2,steel:.5},ghost:{normal:0,psychic:2,ghost:2,dark:.5},dragon:{dragon:2,steel:.5,fairy:0},dark:{fighting:.5,psychic:2,ghost:2,dark:.5,fairy:.5},steel:{fire:.5,water:.5,electric:.5,ice:2,rock:2,steel:.5,fairy:2},fairy:{fire:.5,fighting:2,poison:.5,dragon:2,dark:2,steel:.5}
};
const OUTLAND:Array<[string,string]>=[
  ["Taekwondo Hitmonlee","hitmonlee"],["Taekwondo Hitmontop","hitmontop"],["Taekwondo Hitmonchan","hitmonchan"],["Brave Steelix","steelix"],["Ancient Pupitar","pupitar"],["Brute Rhydon","rhydon"],["Brave Nidoqueen","nidoqueen"],["Brave Nidoking","nidoking"],["Banshee Misdreavus","misdreavus"],["Trickmaster Gengar","gengar"],["Dark Crobat","crobat"],["Furious Skarmory","skarmory"],["Furious Pidgeot","pidgeot"],["Brave Noctowl","noctowl"],["Furious Wigglytuff","wigglytuff"],["Ancient Granbull","granbull"],["Hard Golem","golem"],["Brave Clefable","clefable"],["War Heracross","heracross"],["Furious Scyther","scyther"],["Brave Arcanine","arcanine"],["Furious Magmar","magmar"],["Brave Charizard","charizard"],["Enraged Typhlosion","typhlosion"],["Ancient Marowak","marowak"],["Roll Donphan","donphan"],["Furious Sandslash","sandslash"],["Milch-Miltank","miltank"],["Charged Raichu","raichu"],["Magnetic Electabuzz","electabuzz"],["Furious Ampharos","ampharos"],["Enigmatic Girafarig","girafarig"],["Ancient Hypno","hypno"],["Ancient Xatu","xatu"],["Brave Alakazam","alakazam"],["Ancient Pinsir","pinsir"],["Ancient Meganium","meganium"],["Tribal Feraligatr","feraligatr"],["Furious Gyarados","gyarados"],["Brave Blastoise","blastoise"],["Brave Mantine","mantine"],["Brave Venusaur","venusaur"],["Heavy Piloswine","piloswine"],["Freezing Dewgong","dewgong"],["Ancient Dragonair","dragonair"],["Psy Jynx","jynx"],["Evil Cloyster","cloyster"],
];
export interface HuntTarget extends PokemonDexEntry { displayName:string; huntLevel:number; routeKey:string }
export interface HuntAnalysis {target:HuntTarget;best:{type:string;m:number};worst:{type:string;m:number};featured:boolean;offensive:boolean;safe:boolean;verdict:string;color:string;alert:string;score:number}
const effect=(attack:string,defenses:string[])=>defenses.reduce((m,d)=>m*(CHART[attack]?.[d]??1),1);
export const huntAmp=(m:number)=>m===0?0:m>1?1+(m-1)*1.5:m<1?m/1.5:1;
export const fmtMultiplier=(m:number)=>`×${(Math.round(m*100)/100).toString().replace(".",",")}`;
export function createHuntTargets(catalog:PokemonDexEntry[]):HuntTarget[]{
  const normal=catalog.filter(p=>ROUTE_DEX_NUMBERS.has(p.n)&&!p.boss).map(p=>({...p,displayName:p.m,huntLevel:p.h,routeKey:p.s}));
  const added=OUTLAND.flatMap(([name,slug],index)=>{const p=catalog.find(x=>x.s===slug);return p?[{...p,displayName:name,huntLevel:150,routeKey:`outland-${slug}-${index}`}]:[]});
  return [...normal,...added];
}
export function analyzeHunts(me:PokemonDexEntry,targets:HuntTarget[],coverage:string[]):HuntAnalysis[]{
  const attackTypes=[...new Set([...me.t,...coverage])];
  return targets.map(target=>{
    const best=attackTypes.map(type=>({type,m:huntAmp(effect(type,target.t))})).sort((a,b)=>b.m-a.m)[0];
    const worst=target.t.map(type=>({type,m:huntAmp(effect(type,me.t))})).sort((a,b)=>b.m-a.m)[0];
    let verdict="Alvo neutro",color="#b5a196",alert="dano-neutro",value=35;
    if(best.m===0){verdict="Não caçar";color="#ff6b55";alert="alvo-evitar";value=-100}
    else if(worst.m>=2.5&&best.m<2.5){verdict="Não caçar";color="#ff6b55";alert="alvo-evitar";value=-50}
    else if(worst.m>=2.5){verdict="Troca perigosa";color="#ff8f7d";alert="recebe-muito";value=20}
    else if(worst.m===0&&best.m>=2.5){verdict="Alvo perfeito";color="#e5b34f";alert="alvo-ideal";value=100}
    else if(worst.m===0){verdict="Hunt segura";color="#4fd8b0";alert="hunt-segura";value=70}
    else if(best.m>=2.5&&worst.m<=1){verdict="Alvo ideal";color="#e5b34f";alert="alvo-ideal";value=80}
    else if(best.m>=2.5){verdict="Bom alvo";color="#4fc47a";alert="dano-super";value=60}
    else if(best.m<1){verdict="Hunt lenta";color="#e8d9a8";alert="hunt-lenta";value=worst.m<=1?10:-20}
    const offensive=best.m>=2.5,safe=worst.m===0&&best.m>0,featured=offensive||safe;
    return {target,best,worst,featured,offensive,safe,verdict,color,alert,score:value*10+best.m*4-worst.m*2};
  }).sort((a,b)=>Number(b.offensive)-Number(a.offensive)||b.best.m-a.best.m||Number(b.safe)-Number(a.safe)||a.worst.m-b.worst.m||b.score-a.score);
}
