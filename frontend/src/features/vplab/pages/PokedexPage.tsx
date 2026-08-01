import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { loadPokemonCatalog, normalizeSpecies, type PokemonDexEntry } from "../services/ivCalculator";
import "./vplab.css";

const LABELS: Record<string, string> = {
  normal:"Normal", fire:"Fogo", water:"Água", electric:"Elétrico", grass:"Planta",
  ice:"Gelo", fighting:"Lutador", poison:"Veneno", ground:"Terra", flying:"Voador",
  psychic:"Psíquico", bug:"Inseto", rock:"Pedra", ghost:"Fantasma", dragon:"Dragão",
  dark:"Sombrio", steel:"Aço", fairy:"Fada",
};
const COLORS: Record<string, string> = {
  normal:"#9a9a7c", fire:"#e0742f", water:"#5680d8", electric:"#d8b220", grass:"#6da33e",
  ice:"#7fc4c4", fighting:"#a5342a", poison:"#8f3f8f", ground:"#c9a952", flying:"#8d7fd8",
  psychic:"#dd4f7f", bug:"#93a021", rock:"#a89232", ghost:"#5f5390", dragon:"#5f3cc9",
  dark:"#584538", steel:"#8a8aa0", fairy:"#c96f9e",
};
const CHART: Record<string, Record<string, number>> = {
  normal:{rock:.5,ghost:0,steel:.5},fire:{fire:.5,water:.5,grass:2,ice:2,bug:2,rock:.5,dragon:.5,steel:2},
  water:{fire:2,water:.5,grass:.5,ground:2,rock:2,dragon:.5},electric:{water:2,electric:.5,grass:.5,ground:0,flying:2,dragon:.5},
  grass:{fire:.5,water:2,grass:.5,poison:.5,ground:2,flying:.5,bug:.5,rock:2,dragon:.5,steel:.5},
  ice:{fire:.5,water:.5,grass:2,ice:.5,ground:2,flying:2,dragon:2,steel:.5},
  fighting:{normal:2,ice:2,poison:.5,flying:.5,psychic:.5,bug:.5,rock:2,ghost:0,dark:2,steel:2,fairy:.5},
  poison:{grass:2,poison:.5,ground:.5,rock:.5,ghost:.5,steel:0,fairy:2},
  ground:{fire:2,electric:2,grass:.5,poison:2,flying:0,bug:.5,rock:2,steel:2},
  flying:{electric:.5,grass:2,fighting:2,bug:2,rock:.5,steel:.5},
  psychic:{fighting:2,poison:2,psychic:.5,dark:0,steel:.5},
  bug:{fire:.5,grass:2,fighting:.5,poison:.5,flying:.5,psychic:2,ghost:.5,dark:2,steel:.5,fairy:.5},
  rock:{fire:2,ice:2,fighting:.5,ground:.5,flying:2,bug:2,steel:.5},
  ghost:{normal:0,psychic:2,ghost:2,dark:.5},dragon:{dragon:2,steel:.5,fairy:0},
  dark:{fighting:.5,psychic:2,ghost:2,dark:.5,fairy:.5},
  steel:{fire:.5,water:.5,electric:.5,ice:2,rock:2,steel:.5,fairy:2},
  fairy:{fire:.5,fighting:2,poison:.5,dragon:2,dark:2,steel:.5},
};
const STATS = ["HP","Ataque","Defesa","Atq. Esp.","Def. Esp.","Velocidade"];
const sprite = (n: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${n}.png`;
const fmt = (n: number) => n.toLocaleString("pt-BR");
const Type = ({ name }: { name: string }) => <span className="dex-type" style={{background:COLORS[name]}}>{LABELS[name] ?? name}</span>;

function evolutionChain(pokemon: PokemonDexEntry, catalog: PokemonDexEntry[]) {
  let root = pokemon;
  while (true) {
    const previous = catalog.find((entry) => entry.ev === root.n);
    if (!previous) break;
    root = previous;
  }
  const chain: PokemonDexEntry[] = [];
  let node: PokemonDexEntry | undefined = root;
  while (node) {
    chain.push(node);
    node = node.ev ? catalog.find((entry) => entry.n === node?.ev) : undefined;
  }
  return chain;
}

export function PokedexPage() {
  const [catalog, setCatalog] = useState<PokemonDexEntry[]>([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [rarity, setRarity] = useState("");
  const [selected, setSelected] = useState<PokemonDexEntry | null>(null);
  useEffect(() => { loadPokemonCatalog().then(setCatalog).catch(() => setError("Não foi possível carregar a Pokédex.")); }, []);
  const filtered = useMemo(() => catalog.filter((p) =>
    (!query || normalizeSpecies(p.m).includes(normalizeSpecies(query)) || String(p.n).includes(query.trim())) &&
    (!type || p.t.includes(type)) && (!rarity || p.r === rarity)), [catalog, query, type, rarity]);
  const rarities = useMemo(() => [...new Set(catalog.map((p) => p.r))].sort(), [catalog]);
  const effectiveness = selected ? Object.keys(LABELS).map((attack) => ({
    attack, multiplier:selected.t.reduce((value, defense) => value * (CHART[attack]?.[defense] ?? 1), 1),
  })) : [];
  const choose = (pokemon: PokemonDexEntry) => { setSelected(pokemon); setQuery(pokemon.m); window.scrollTo({top:0,behavior:"smooth"}); };

  return <main className="vplab-react"><div className="container">
    <header className="vplab-react__hero"><div><span className="vplab-react__eyebrow">Catálogo oficial · 251 espécies</span>
      <h1>Pokédex VPLab</h1><p>Stats, hunts, efetividade, golpes, evoluções e drops em um só lugar.</p></div>
      <span className="vplab-react__privacy">{catalog.length || "…"} espécies</span>
    </header>
    {!selected ? <section className="vplab-panel dex-catalog">
      <div className="dex-controls">
        <label>Buscar espécie<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nome ou número da Pokédex" /></label>
        <label>Tipo<select value={type} onChange={(e) => setType(e.target.value)}><option value="">Todos</option>{Object.keys(LABELS).map((x) => <option key={x} value={x}>{LABELS[x]}</option>)}</select></label>
        <label>Raridade<select value={rarity} onChange={(e) => setRarity(e.target.value)}><option value="">Todas</option>{rarities.map((x) => <option key={x}>{x}</option>)}</select></label>
      </div>
      {error ? <p className="vplab-warning">{error}</p> : !catalog.length ? <p className="vplab-status">Carregando catálogo…</p> :
        <><p className="vplab-status">{filtered.length} espécie{filtered.length === 1 ? "" : "s"} encontrada{filtered.length === 1 ? "" : "s"}</p>
        {filtered.length ? <div className="dex-grid">{filtered.map((p) => <button className="dex-card" key={p.n} onClick={() => choose(p)}>
          <span>#{String(p.n).padStart(3,"0")}</span><img src={sprite(p.n)} alt="" width="88" height="88" loading="lazy" />
          <strong>{p.m}</strong><div>{p.t.map((x) => <Type key={x} name={x}/>)}</div><small>{p.r}</small>
        </button>)}</div> : <p className="dex-empty">Nenhuma espécie corresponde aos filtros.</p>}</>}
    </section> : <PokemonDetail pokemon={selected} catalog={catalog} choose={choose} back={() => {setSelected(null);setQuery("");}} effectiveness={effectiveness}/>}
  </div></main>;
}

function PokemonDetail({pokemon,catalog,choose,back,effectiveness}:{pokemon:PokemonDexEntry;catalog:PokemonDexEntry[];choose:(p:PokemonDexEntry)=>void;back:()=>void;effectiveness:Array<{attack:string;multiplier:number}>}) {
  const groups = [{title:"Fraquezas",test:(x:number)=>x>1},{title:"Resistências",test:(x:number)=>x>0&&x<1},{title:"Imunidades",test:(x:number)=>x===0}];
  return <section className="vplab-panel dex-detail">
    <button className="dex-back" onClick={back}>← Voltar ao catálogo</button>
    <div className="dex-heading"><div className="dex-art"><img src={sprite(pokemon.n)} alt={pokemon.m}/></div><div>
      <span className="vplab-react__eyebrow">#{String(pokemon.n).padStart(3,"0")}</span><h1>{pokemon.m}</h1>
      <div>{pokemon.t.map((x)=><Type key={x} name={x}/>)}</div>
      <div className="dex-actions"><Link to={`/vplab/?p=${pokemon.s}`}>Avaliar IV</Link><Link to={`/vplab/rota?p=${pokemon.s}`}>Planejar rota</Link></div>
    </div></div>
    <div className="dex-facts"><span><small>Hunt</small><b>{pokemon.boss?"Não disponível":`Nv ${pokemon.h}`}</b></span><span><small>XP por abate</small><b>{fmt(pokemon.xp)}</b></span><span><small>Loot médio</small><b>${fmt(pokemon.la)}</b></span><span><small>Preço NPC</small><b>${fmt(pokemon.npc)}</b></span><span><small>Venda</small><b>${fmt(pokemon.sell)}</b></span></div>
    <h2>Stats base · Total {pokemon.bs.reduce((a,b)=>a+b,0)}</h2><div className="dex-stats">{pokemon.bs.map((value,i)=><span key={STATS[i]}><small>{STATS[i]}</small><b>{value}</b><i><em style={{width:`${Math.max(2,value/255*100)}%`}}/></i></span>)}</div>
    <h2>Fraquezas e resistências</h2><div className="dex-effect">{groups.map((group)=><div key={group.title}><small>{group.title}</small><p>{effectiveness.filter((x)=>group.test(x.multiplier)).map((x)=><span key={x.attack}><Type name={x.attack}/><b>×{x.multiplier}</b></span>)}</p></div>)}</div>
    <h2>Golpes ({pokemon.g.length})</h2><div className="dex-moves">{pokemon.g.map((move)=><span key={`${move[0]}-${move[4]}`}><b>{move[0]}</b><Type name={move[1]}/><small>{move[2]==="fisico"?"Físico":"Especial"} · Poder {move[3]} · Nv {move[4]}</small></span>)}</div>
    <h2>Linha evolutiva</h2><div className="dex-evolution">{evolutionChain(pokemon,catalog).map((p)=><button className={p.n===pokemon.n?"is-current":""} key={p.n} onClick={()=>choose(p)}><img src={sprite(p.n)} alt=""/><span>{p.m}</span>{p.evl&&<small>Nv {p.evl}</small>}</button>)}</div>
    <h2>Drops ({pokemon.loot.length})</h2><div className="dex-drops">{pokemon.loot.map((drop)=><span key={drop[0]}><b>{drop[0]}</b><small>×{drop[2]}{drop[2]!==drop[3]?`–${drop[3]}`:""} · {(drop[1]/1000).toLocaleString("pt-BR",{maximumFractionDigits:2})}% · ${fmt(drop[4])}</small></span>)}</div>
  </section>;
}
