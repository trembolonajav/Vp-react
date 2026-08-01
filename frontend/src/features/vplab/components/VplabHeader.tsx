import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loadPokemonCatalog, type PokemonDexEntry } from "../services/ivCalculator";
import "./vplab-header.css";

const tools = [
  { label: "Pokédex", path: "/vplab/pokedex", icon: "pokedex.png", group: "Consultar" },
  { label: "Avaliar IV", path: "/vplab/avaliar-iv", icon: "evaluate-iv.webp", group: "Avaliar" },
  { label: "PokeFipe", path: "/vplab/pokefipe", icon: "pokefipe.webp", group: "Avaliar" },
  { label: "Rota de caça", path: "/vplab/rota", icon: "map.png", group: "Planejar" },
  { label: "Breeding", path: "/vplab/breeding", icon: "breeding.png", group: "Planejar" },
  { label: "Clãs", path: "/vplab/clas", icon: "clans.png", group: "Planejar" },
  { label: "Profissões", path: "/vplab/profissoes", icon: "professions.png", group: "Planejar" },
] as const;

const sprite = (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

export function VplabHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<PokemonDexEntry[]>([]);
  useEffect(() => { loadPokemonCatalog().then(setCatalog).catch(() => undefined); }, []);
  useEffect(() => { setQuery(""); }, [location.pathname]);
  const results = useMemo(() => query.trim().length < 2 ? [] : catalog.filter((item) => item.m.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 3), [catalog, query]);
  const active = (path: string) => location.pathname === path || (path === "/vplab/avaliar-iv" && location.pathname === "/vplab/");

  return <div className="vplab-toolbar__inner">
          {["Consultar", "Avaliar", "Planejar"].map(group => <div className="vplab-toolgroup" key={group}><small>{group}</small><div>{tools.filter(tool => tool.group === group).map(tool => <Link className={active(tool.path) ? "is-active" : ""} to={tool.path} key={tool.path}><img src={`/assets/vplab/header/${tool.icon}`} alt="" />{tool.label}</Link>)}</div></div>)}
          <label className="vplab-global-search"><span aria-hidden="true">⌕</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar Pokémon em todas as ferramentas…" /></label>
        {results.length > 0 && <div className="vplab-search-results">{results.map(item => <article key={item.n}><img src={sprite(item.n)} alt="" /><span><b>{item.m}</b><small>#{String(item.n).padStart(3, "0")} · {item.t.join("/")}</small></span><div><button onClick={() => navigate(`/vplab/pokedex?p=${item.s}`)}>Ver na Pokédex</button><button onClick={() => navigate(`/vplab/avaliar-iv?p=${item.s}`)}>Avaliar IV</button><button onClick={() => navigate(`/vplab/rota?p=${item.s}`)}>Planejar rota</button></div></article>)}</div>}
      </div>;
}
