(function (root) {
  "use strict";

  /* PokeFipe 2.0 — base de mercado atualizada em 28/07/2026. */
  const DIAMOND_BRL = 0.12;
  const LEVEL_BRL = 0.03;
  const LEVEL_CUT = 400;
  const LEVEL_BRL_AFTER = 0.08;
  const DEFAULT_BASE = 4;
  const QUICK_FACTOR = 0.85;
  const LIST_FACTOR = 1.10;

  const POKEMON_SLUGS = "bulbasaur,ivysaur,venusaur,charmander,charmeleon,charizard,squirtle,wartortle,blastoise,caterpie,metapod,butterfree,weedle,kakuna,beedrill,pidgey,pidgeotto,pidgeot,rattata,raticate,spearow,fearow,ekans,arbok,pikachu,raichu,sandshrew,sandslash,nidoran-f,nidorina,nidoqueen,nidoran-m,nidorino,nidoking,clefairy,clefable,vulpix,ninetales,jigglypuff,wigglytuff,zubat,golbat,oddish,gloom,vileplume,paras,parasect,venonat,venomoth,diglett,dugtrio,meowth,persian,psyduck,golduck,mankey,primeape,growlithe,arcanine,poliwag,poliwhirl,poliwrath,abra,kadabra,alakazam,machop,machoke,machamp,bellsprout,weepinbell,victreebel,tentacool,tentacruel,geodude,graveler,golem,ponyta,rapidash,slowpoke,slowbro,magnemite,magneton,farfetchd,doduo,dodrio,seel,dewgong,grimer,muk,shellder,cloyster,gastly,haunter,gengar,onix,drowzee,hypno,krabby,kingler,voltorb,electrode,exeggcute,exeggutor,cubone,marowak,hitmonlee,hitmonchan,lickitung,koffing,weezing,rhyhorn,rhydon,chansey,tangela,kangaskhan,horsea,seadra,goldeen,seaking,staryu,starmie,mr-mime,scyther,jynx,electabuzz,magmar,pinsir,tauros,magikarp,gyarados,lapras,ditto,eevee,vaporeon,jolteon,flareon,porygon,omanyte,omastar,kabuto,kabutops,aerodactyl,snorlax,articuno,zapdos,moltres,dratini,dragonair,dragonite,mewtwo,mew,chikorita,bayleef,meganium,cyndaquil,quilava,typhlosion,totodile,croconaw,feraligatr,sentret,furret,hoothoot,noctowl,ledyba,ledian,spinarak,ariados,crobat,chinchou,lanturn,pichu,cleffa,igglybuff,togepi,togetic,natu,xatu,mareep,flaaffy,ampharos,bellossom,marill,azumarill,sudowoodo,politoed,hoppip,skiploom,jumpluff,aipom,sunkern,sunflora,yanma,wooper,quagsire,espeon,umbreon,murkrow,slowking,misdreavus,unown,wobbuffet,girafarig,pineco,forretress,dunsparce,gligar,steelix,snubbull,granbull,qwilfish,scizor,shuckle,heracross,sneasel,teddiursa,ursaring,slugma,magcargo,swinub,piloswine,corsola,remoraid,octillery,delibird,mantine,skarmory,houndour,houndoom,kingdra,phanpy,donphan,porygon2,stantler,smeargle,tyrogue,hitmontop,smoochum,elekid,magby,miltank,blissey,raikou,entei,suicune,larvitar,pupitar,tyranitar,lugia,ho-oh,celebi".split(",");
  const SPECIAL_NAMES = { "nidoran-f":"Nidoran♀", "nidoran-m":"Nidoran♂", farfetchd:"Farfetch'd", "mr-mime":"Mr. Mime", porygon2:"Porygon2", "ho-oh":"Ho-Oh" };
  const displayName = (slug) => SPECIAL_NAMES[slug] || slug.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");

  const MARKET = {
    abra:[5,"Média"], alakazam:[6,"Média"], blastoise:[5.5,"Alta"], charizard:[4.5,"Alta"],
    charmander:[4,"Baixa"], dragonite:[5,"Baixa"], electabuzz:[4.5,"Baixa"], flareon:[5.5,"Baixa"],
    gastly:[3,"Baixa"], gengar:[5.5,"Alta"], geodude:[4,"Média"], golem:[4.5,"Alta"],
    granbull:[4,"Baixa"], grimer:[2.5,"Baixa"], growlithe:[6,"Baixa"], kadabra:[4.5,"Baixa"],
    kakuna:[1.5,"Baixa"], lapras:[4,"Baixa"], magmar:[4,"Baixa"], marowak:[4,"Baixa"],
    oddish:[2,"Baixa"], paras:[2,"Baixa"], parasect:[3.5,"Baixa"], pichu:[4,"Baixa"],
    pidgey:[1.5,"Baixa"], poliwrath:[4.5,"Baixa"], primeape:[4,"Baixa"], rattata:[1.5,"Baixa"],
    rhydon:[4,"Baixa"], scizor:[5,"Baixa"], shellder:[1,"Baixa"], spearow:[1.5,"Baixa"],
    tentacool:[2.5,"Baixa"], victreebel:[5.5,"Média"]
  };
  const POKEMON = POKEMON_SLUGS.map((slug, index) => {
    const market = MARKET[slug] || [DEFAULT_BASE, "Provisória"];
    return { id:index + 1, slug, name:displayName(slug), base:market[0], confidence:market[1] };
  });

  const VALUE_RANGES = [
    [0,169,-2.5,"Resultado muito baixo"], [170,189,-2.5,"Penalidade relevante"], [190,199,0,"Faixa neutra"],
    [200,209,.3,"Bônus leve"], [210,219,.6,"Bônus leve"], [220,229,.9,"Bônus moderado"],
    [230,239,1.2,"Bônus moderado"], [240,249,1.5,"Bônus bom"], [250,259,1.8,"Bônus bom"],
    [260,269,2.1,"Bônus alto"], [270,279,2.4,"Bônus alto"], [280,289,2.7,"Bônus alto"],
    [290,309,3,"Bônus muito alto"], [310,329,3.5,"Bônus muito alto"], [330,349,4,"Bônus excepcional"],
    [350,999,4.5,"Teto provisório"]
  ];
  const round2 = (value) => Math.round(value * 100) / 100;
  const levelValue = (level) => {
    const lvl = Math.max(1, Math.floor(level));
    return round2(lvl <= LEVEL_CUT
      ? (lvl - 1) * LEVEL_BRL
      : (LEVEL_CUT - 1) * LEVEL_BRL + (lvl - LEVEL_CUT) * LEVEL_BRL_AFTER);
  };

  function calculateFipe({ pokemon, iv, multiplier, level, segment }) {
    const parsedIv = Number(iv), parsedMultiplier = Number(multiplier), parsedLevel = Number(level);
    if (!(parsedIv > 0) || !(parsedMultiplier > 0) || !(parsedLevel > 0)) {
      return { valid:false, reason:"Preencha IV, multiplicador e nível com valores maiores que zero." };
    }
    const species = POKEMON.find((item) => item.slug === pokemon) || { name:"Pokémon", base:DEFAULT_BASE, confidence:"Provisória" };
    const rawScore = parsedIv * parsedMultiplier;
    const score = Math.round(rawScore);
    const range = VALUE_RANGES.find(([min,max]) => score >= min && score <= max) || VALUE_RANGES.at(-1);
    const levelAmount = levelValue(parsedLevel);
    const breedFloor = segment === "Breed" && parsedLevel <= 20 && parsedIv >= 150 ? 5 : 0;
    const fair = round2(Math.max(species.base + range[2] + levelAmount, breedFloor));
    const quick = round2(fair * QUICK_FACTOR);
    const list = round2(fair * LIST_FACTOR);
    return {
      valid:true, inRange:true, rawScore, score, species, confidence:species.confidence,
      band:{ min:range[0], max:range[1], bonus:range[2], label:range[3] },
      base:species.base, levelValue:levelAmount, fair, quick, list,
      diamondsMin:Math.round(quick / DIAMOND_BRL), diamondsMax:Math.round(list / DIAMOND_BRL),
      pokemonMin:quick, pokemonMax:list, totalMin:quick, totalMax:list
    };
  }

  root.PokeFipe = {
    DIAMOND_BRL, LEVEL_BRL, LEVEL_CUT, LEVEL_BRL_AFTER, POKEMON, VALUE_RANGES,
    calculateFipe, levelValue, updatedAt:"28/07/2026"
  };
})(globalThis);
