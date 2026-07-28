/* ============================================================
   VPLab — Clãs: time ideal por tipo
   Isolado em IIFE para não colidir com os globais do app.js
   ($/SP/etc). Dados pré-computados (BST) das 251 espécies.
   ============================================================ */
(function () {
  const CLANS = {"normal":{"team":[[143,"Snorlax",540],[242,"Blissey",540],[233,"Porygon2",515],[217,"Ursaring",500],[115,"Kangaskhan",490],[128,"Tauros",490]],"subs":[[241,"Miltank",490],[18,"Pidgeot",479],[85,"Dodrio",470]]},"fire":{"team":[[250,"Ho-oh",680],[146,"Moltres",580],[244,"Entei",580],[59,"Arcanine",555],[6,"Charizard",534],[157,"Typhlosion",534]],"subs":[[136,"Flareon",525],[38,"Ninetales",505],[78,"Rapidash",500]]},"water":{"team":[[245,"Suicune",580],[130,"Gyarados",540],[230,"Kingdra",540],[131,"Lapras",535],[9,"Blastoise",530],[160,"Feraligatr",530]],"subs":[[91,"Cloyster",525],[134,"Vaporeon",525],[121,"Starmie",520]]},"electric":{"team":[[145,"Zapdos",580],[243,"Raikou",580],[135,"Jolteon",525],[181,"Ampharos",510],[101,"Electrode",490],[125,"Electabuzz",490]],"subs":[[26,"Raichu",485],[82,"Magneton",465],[171,"Lanturn",460]]},"grass":{"team":[[251,"Celebi",600],[103,"Exeggutor",530],[3,"Venusaur",525],[154,"Meganium",525],[45,"Vileplume",490],[71,"Victreebel",490]],"subs":[[182,"Bellossom",490],[189,"Jumpluff",460],[114,"Tangela",435]]},"ice":{"team":[[144,"Articuno",580],[131,"Lapras",535],[91,"Cloyster",525],[87,"Dewgong",475],[124,"Jynx",455],[221,"Piloswine",450]],"subs":[[215,"Sneasel",430],[225,"Delibird",330],[238,"Smoochum",305]]},"fighting":{"team":[[62,"Poliwrath",510],[68,"Machamp",505],[214,"Heracross",500],[57,"Primeape",455],[106,"Hitmonlee",455],[107,"Hitmonchan",455]],"subs":[[237,"Hitmontop",455],[67,"Machoke",405],[56,"Mankey",305]]},"poison":{"team":[[169,"Crobat",535],[3,"Venusaur",525],[73,"Tentacruel",515],[31,"Nidoqueen",505],[34,"Nidoking",505],[89,"Muk",500]],"subs":[[94,"Gengar",500],[45,"Vileplume",490],[71,"Victreebel",490]]},"ground":{"team":[[208,"Steelix",510],[31,"Nidoqueen",505],[34,"Nidoking",505],[232,"Donphan",500],[76,"Golem",495],[112,"Rhydon",485]],"subs":[[28,"Sandslash",450],[221,"Piloswine",450],[195,"Quagsire",430]]},"flying":{"team":[[249,"Lugia",680],[250,"Ho-oh",680],[149,"Dragonite",600],[144,"Articuno",580],[145,"Zapdos",580],[146,"Moltres",580]],"subs":[[130,"Gyarados",540],[169,"Crobat",535],[6,"Charizard",534]]},"psychic":{"team":[[150,"Mewtwo",680],[249,"Lugia",680],[151,"Mew",600],[251,"Celebi",600],[103,"Exeggutor",530],[196,"Espeon",525]],"subs":[[121,"Starmie",520],[65,"Alakazam",500],[80,"Slowbro",490]]},"bug":{"team":[[213,"Shuckle",505],[123,"Scyther",500],[127,"Pinsir",500],[212,"Scizor",500],[214,"Heracross",500],[205,"Forretress",465]],"subs":[[49,"Venomoth",450],[47,"Parasect",405],[168,"Ariados",400]]},"rock":{"team":[[248,"Tyranitar",600],[142,"Aerodactyl",515],[213,"Shuckle",505],[76,"Golem",495],[139,"Omastar",495],[141,"Kabutops",495]],"subs":[[112,"Rhydon",485],[219,"Magcargo",430],[185,"Sudowoodo",410]]},"ghost":{"team":[[94,"Gengar",500],[200,"Misdreavus",435],[93,"Haunter",405],[92,"Gastly",310]],"subs":[]},"dragon":{"team":[[149,"Dragonite",600],[230,"Kingdra",540],[148,"Dragonair",420],[147,"Dratini",300]],"subs":[]},"dark":{"team":[[248,"Tyranitar",600],[197,"Umbreon",525],[229,"Houndoom",500],[215,"Sneasel",430],[198,"Murkrow",405],[228,"Houndour",330]],"subs":[]},"steel":{"team":[[208,"Steelix",510],[212,"Scizor",500],[82,"Magneton",465],[205,"Forretress",465],[227,"Skarmory",465],[81,"Magnemite",325]],"subs":[]},"fairy":{"team":[[36,"Clefable",483],[122,"Mr. Mime",460],[210,"Granbull",450],[40,"Wigglytuff",435],[184,"Azumarill",420],[176,"Togetic",405]],"subs":[[35,"Clefairy",323],[209,"Snubbull",300],[39,"Jigglypuff",270]]}};
  const TYPES = ["normal","fire","water","electric","grass","ice","fighting","poison","ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"];
  // cores e rótulos do design system do VPLab (mesmos do app.js)
  const TC = {normal:"#9a9a7c",fire:"#e0742f",water:"#5680d8",electric:"#d8b220",grass:"#6da33e",ice:"#7fc4c4",fighting:"#a5342a",poison:"#8f3f8f",ground:"#c9a952",flying:"#8d7fd8",psychic:"#dd4f7f",bug:"#93a021",rock:"#a89232",ghost:"#5f5390",dragon:"#5f3cc9",dark:"#584538",steel:"#8a8aa0",fairy:"#c96f9e"};
  const PT = {normal:"Normal",fire:"Fogo",water:"Água",electric:"Elétrico",grass:"Planta",ice:"Gelo",fighting:"Lutador",poison:"Veneno",ground:"Terra",flying:"Voador",psychic:"Psíquico",bug:"Inseto",rock:"Pedra",ghost:"Fantasma",dragon:"Dragão",dark:"Sombrio",steel:"Aço",fairy:"Fada"};
  // super-efetivo: tipo atacante -> tipos que ele bate por 2x
  const ADV = {normal:[],fire:["grass","ice","bug","steel"],water:["fire","ground","rock"],electric:["water","flying"],grass:["water","ground","rock"],ice:["grass","ground","flying","dragon"],fighting:["normal","ice","rock","dark","steel"],poison:["grass","fairy"],ground:["fire","electric","poison","rock","steel"],flying:["grass","fighting","bug"],psychic:["fighting","poison"],bug:["grass","psychic","dark"],rock:["fire","ice","flying","bug"],ghost:["psychic","ghost"],dragon:["dragon"],dark:["psychic","ghost"],steel:["ice","rock","fairy"],fairy:["fighting","dragon","dark"]};
  // move de destaque (STAB forte) — nome + poder aprox.
  const MOVE = {normal:["Hiper Raio",150],fire:["Explosão de Fogo",110],water:["Hidro Bomba",110],electric:["Trovão",110],grass:["Raio Solar",120],ice:["Nevasca",110],fighting:["Combate Próximo",120],poison:["Bomba de Lodo",90],ground:["Terremoto",100],flying:["Furacão",110],psychic:["Psíquico",90],bug:["Megachifre",120],rock:["Rocha Afiada",100],ghost:["Bola Sombria",80],dragon:["Meteoro do Dragão",130],dark:["Trituração",80],steel:["Cabeça de Ferro",80],fairy:["Raio Lunar",95]};
  const SP = d => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${d}.png`;
  const el = id => document.getElementById(id);

  let cur = "fire";

  function renderTypes() {
    const host = el("ct-types");
    if (!host) return;
    host.innerHTML = TYPES.map(t => `<button class="tpill${t === cur ? " on" : ""}" data-t="${t}" style="--tc:${TC[t]}">
      <span class="dot" style="background:${TC[t]}"></span>${PT[t]}</button>`).join("");
    host.querySelectorAll(".tpill").forEach(b => b.onclick = () => { cur = b.dataset.t; renderTypes(); renderPanel(); });
  }

  function monCard(m, i, sub) {
    const [d, n, bst] = m;
    return `<div class="mon" style="--tc:${TC[cur]}" title="${n} · Força ${bst}">
      ${sub ? "" : `<span class="rk">#${i + 1}</span>`}<span class="dex">#${String(d).padStart(3, "0")}</span>
      <img class="sp" src="${SP(d)}" alt="${n}" loading="lazy" onerror="this.style.opacity=.25">
      <div class="nm">${n}</div><div class="bst"><i>Força</i> ${bst}</div>
    </div>`;
  }

  function renderPanel() {
    const host = el("ct-panel");
    if (!host) return;
    const c = CLANS[cur], tc = TC[cur];
    const adv = ADV[cur], mv = MOVE[cur];
    const advTags = adv.length
      ? adv.map(a => `<span class="adv-tag" style="background:${TC[a]}">${PT[a]}</span>`).join("")
      : '<span style="color:var(--muted)">sem vantagem ofensiva de tipo — brilha por status e versatilidade</span>';
    host.innerHTML = `
      <div class="clan-head">
        <span class="clan-badge" style="background:${tc}">Clã ${PT[cur]}</span>
        <span class="clan-bonus">Time ideal do tipo <b>${PT[cur]}</b> — com o bônus de clã, esses ficam ainda mais fortes.</span>
      </div>
      <div class="why">
        <div class="row"><span class="ic">⚔️</span><div><b>Vantagem:</b> ataques ${PT[cur]} são super-eficazes (2×) contra: ${advTags}</div></div>
        <div class="row"><span class="ic">💥</span><div><b>Move de destaque:</b> ${mv[0]} <b>(~${mv[1]} de poder)</b> — o golpe ${PT[cur]} mais forte pra explorar essas vantagens.</div></div>
        <div class="row"><span class="ic">🛡️</span><div><b>Bônus de clã:</b> +6% por rank (até <b>+30%</b> no rank 5) em Atk/Def dos Pokémon ${PT[cur]}.</div></div>
      </div>
      <p class="lbl-row">Time recomendado (6)</p>
      <div class="team">${c.team.map((m, i) => monCard(m, i, false)).join("")}</div>
      <p class="lbl-row">Substitutos</p>
      <div class="subs">${c.subs.length ? c.subs.map(m => monCard(m, 0, true)).join("") : '<div class="none">Este tipo tem poucos Pokémon — o time de 6 já é praticamente todo o pool.</div>'}</div>
    `;
  }

  renderTypes();
  renderPanel();
})();
