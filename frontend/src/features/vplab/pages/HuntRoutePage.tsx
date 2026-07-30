import { useEffect,useMemo,useState } from "react";
import { Link,useSearchParams } from "react-router-dom";
import { loadPokemonCatalog,type PokemonDexEntry } from "../services/ivCalculator";
import { analyzeHunts,createHuntTargets,fmtMultiplier,ROUTE_DEX_NUMBERS,TYPE_LABELS,type HuntAnalysis } from "../services/huntRoute";
import "./vplab.css";
const sprite=(n:number)=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${n}.png`;
const asset=(path:string)=>`/vplab/legacy/assets/route/${path}`;
const Type=({name}:{name:string})=><span className="route-react-type"><img src={asset(`types-v2/${name}.png`)} alt=""/>{TYPE_LABELS[name]}</span>;

export function HuntRoutePage(){
  const [params]=useSearchParams(),[catalog,setCatalog]=useState<PokemonDexEntry[]>([]);
  const [slug,setSlug]=useState(params.get("p")??"charizard"),[level,setLevel]=useState(Number(params.get("level"))||20);
  const [coverage,setCoverage]=useState<string[]>([]),[open,setOpen]=useState<Set<number>>(new Set());
  useEffect(()=>{loadPokemonCatalog().then(setCatalog)},[]);
  const selectable=useMemo(()=>catalog.filter(p=>ROUTE_DEX_NUMBERS.has(p.n)&&!p.boss),[catalog]);
  const me=selectable.find(p=>p.s===slug)??selectable.find(p=>p.s==="charizard")??selectable[0];
  const targets=useMemo(()=>createHuntTargets(catalog),[catalog]);
  const analysed=useMemo(()=>me?analyzeHunts(me,targets,coverage):[],[me,targets,coverage]);
  const levels=useMemo(()=>[...new Set(targets.map(t=>t.huntLevel))].sort((a,b)=>a-b),[targets]);
  const current=levels.filter(x=>x<=level).pop()??levels[0];
  const groups=levels.filter(x=>x>=current).map(lv=>({lv,items:analysed.filter(a=>a.target.huntLevel===lv)}));
  const good=analysed.filter(a=>a.featured).length,safe=analysed.filter(a=>a.safe).length,ideal=analysed.filter(a=>a.best.m>=2.5&&a.worst.m<=1).length;
  const path=groups.map(g=>({lv:g.lv,item:g.items.find(a=>a.featured)})).filter(x=>x.item);
  const toggleCoverage=(type:string)=>setCoverage(v=>v.includes(type)?v.filter(x=>x!==type):[...v,type]);
  return <main className="vplab-react"><div className="container">
    <nav className="vplab-react__tools"><Link to="/vplab/">Avaliar IV</Link><Link to="/vplab/pokedex">Pokédex</Link><Link to="/vplab/pokefipe">PokeFipe</Link><Link className="is-active" to="/vplab/rota">Rota de caça</Link><a href="/vplab/legacy/?tab=breeding">Breeding</a><a href="/vplab/legacy/?tab=clas">Clãs</a><a href="/vplab/legacy/?tab=profissoes">Profissões</a></nav>
    <header className="vplab-react__hero"><div><span className="vplab-react__eyebrow">Rota de caça · motor v3</span><h1>Onde caçar com seu Pokémon</h1><p>Escolha seu Pokémon, nível e golpes de cobertura. A rota destaca vantagem ofensiva e hunts seguras.</p></div><span className="vplab-react__privacy">Mapa conferido em 17/07/2026</span></header>
    {me&&<section className="vplab-panel route-react-dashboard"><div className="route-react-picker"><div className="route-react-me"><img src={sprite(me.n)} alt={me.m}/><label>Seu Pokémon<select value={me.s} onChange={e=>{setSlug(e.target.value);setCoverage([])}}>{selectable.map(p=><option key={p.n} value={p.s}>#{p.n} · {p.m}</option>)}</select><div>{me.t.map(t=><Type key={t} name={t}/>)}</div></label></div><label>Nível atual<input type="number" min="1" max="999" value={level} onChange={e=>setLevel(Math.max(1,Number(e.target.value)))}/></label><div><small>Golpes de cobertura</small><div className="route-react-coverage">{Object.keys(TYPE_LABELS).filter(t=>!me.t.includes(t)).map(t=><button key={t} aria-pressed={coverage.includes(t)} onClick={()=>toggleCoverage(t)}><img src={asset(`types-v2/${t}.png`)} alt=""/><span>{TYPE_LABELS[t]}</span></button>)}</div></div></div>
      <div><p className="route-react-note">{targets.length} hunts · {new Set(targets.map(t=>t.n)).size} espécies · faixa {current}</p><div className="route-react-stats"><article><small>Valem a pena</small><b>{good}</b></article><article><small>Hunts seguras</small><b>{safe}</b></article><article><small>Vantagem forte</small><b>{ideal}</b></article><article><small>Descartados</small><b>{analysed.length-good}</b></article></div><h3>Caminho recomendado</h3><div className="route-react-path">{path.map(x=><span key={x.lv}><img src={sprite(x.item!.target.n)} alt=""/><b>{x.item!.target.displayName}</b><small>Nv {x.lv} · {fmtMultiplier(x.item!.best.m)}</small></span>)}</div></div></section>}
    <div className="route-react-bands">{groups.map(group=><RouteBand key={group.lv} level={group.lv} current={group.lv===current} items={group.items} opened={open.has(group.lv)} toggle={()=>setOpen(v=>{const next=new Set(v);next.has(group.lv)?next.delete(group.lv):next.add(group.lv);return next})}/>)}</div>
    <p className="route-react-source">A vantagem da hunt é amplificada: ×2 vira ×2,5 e ×4 vira ×5,5; resistências são divididas por 1,5. Os ícones permanecem temporariamente na ponte de assets do legado.</p>
  </div></main>;
}
function RouteBand({level,current,items,opened,toggle}:{level:number;current:boolean;items:HuntAnalysis[];opened:boolean;toggle:()=>void}){
  const keep=items.filter(a=>a.featured),drop=items.filter(a=>!a.featured),shown=opened?[...keep,...drop]:keep;
  return <section className={`vplab-panel route-react-band ${current?"is-current":""}`}><header><span>{level}</span><div><h2>Faixa nível {level}</h2><p>{keep.length?`${keep.length} alvos valem a pena · melhor: ${keep[0].target.displayName}`:"Nenhum alvo bom nesta faixa"}</p></div>{drop.length>0&&<button onClick={toggle}>{opened?"Esconder descartadas":`Mostrar descartadas (${drop.length})`}</button>}</header><div className="route-react-grid">{shown.map((a,index)=><article className="route-react-card" style={{"--tone":a.color,opacity:a.featured?1:.58} as React.CSSProperties} key={a.target.routeKey}><div><img src={sprite(a.target.n)} alt={a.target.displayName}/><span><b>{a.target.displayName}</b><small>{a.target.t.map(t=><Type key={t} name={t}/>)}</small><em><img src={asset(`alerts/${a.alert}.png`)} alt=""/>{a.verdict}</em></span>{index===0&&a.featured&&<i>Melhor daqui</i>}</div><p><span>Você causa <b>{TYPE_LABELS[a.best.type]}</b></span><strong>{fmtMultiplier(a.best.m)}</strong></p><p><span>Você recebe <b>{TYPE_LABELS[a.worst.type]}</b></span><strong>{fmtMultiplier(a.worst.m)}</strong></p></article>)}</div></section>;
}
