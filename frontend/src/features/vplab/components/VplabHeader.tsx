import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
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
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<PokemonDexEntry[]>([]);
  useEffect(() => { loadPokemonCatalog().then(setCatalog).catch(() => undefined); }, []);
  useEffect(() => { setMobileOpen(false); setQuery(""); }, [location.pathname]);
  const results = useMemo(() => query.trim().length < 2 ? [] : catalog.filter((item) => item.m.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 3), [catalog, query]);
  const active = (path: string) => location.pathname === path || (path === "/vplab/avaliar-iv" && location.pathname === "/vplab/");

  return <>
    <div className="vplab-family-bar"><span aria-hidden="true" />Ferramenta oficial da <b>VP Store</b> — live todos os dias na&nbsp;<a href="https://www.twitch.tv/vpertsz" target="_blank" rel="noreferrer">twitch.tv/vpertsz</a></div>
    <header className="vplab-header">
      <div className="container vplab-header__main">
        <Link className="vplab-brand" to="/vplab/" aria-label="VPLab — início"><img src="/assets/vplab/header/logo-vplab.webp" alt="" /><span><strong>VPLab</strong><small>PokeIdle World</small></span></Link>
        <nav className="vplab-family-nav" aria-label="Família VP"><Link className="active" to="/vplab/">Ferramentas</Link><Link to="/store/">VP Store</Link><Link to="/bazaar/">VP Bazaar</Link><Link to="/comunidade">Comunidade</Link></nav>
        <div className="vplab-header__actions"><Link className="vplab-vpertsz" to="/">VPERTSZ</Link><a className="vplab-live" href="https://www.twitch.tv/vpertsz" target="_blank" rel="noreferrer">Live</a><Link className="vplab-diamonds" to="/store/negociar">Comprar diamonds</Link>{user ? <button className="vplab-user" type="button" onClick={logout}>{user.username} · sair</button> : <Link className="vplab-user" to="/bazaar/login">Entrar</Link>}<button className="vplab-menu" type="button" aria-label="Abrir menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(open => !open)}>☰</button></div>
      </div>
      <div className={`vplab-toolbar ${mobileOpen ? "is-open" : ""}`}>
        <div className="container vplab-toolbar__inner">
          {["Consultar", "Avaliar", "Planejar"].map(group => <div className="vplab-toolgroup" key={group}><small>{group}</small><div>{tools.filter(tool => tool.group === group).map(tool => <Link className={active(tool.path) ? "is-active" : ""} to={tool.path} key={tool.path}><img src={`/assets/vplab/header/${tool.icon}`} alt="" />{tool.label}</Link>)}</div></div>)}
          <label className="vplab-global-search"><span aria-hidden="true">⌕</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar Pokémon em todas as ferramentas…" /></label>
        </div>
        {results.length > 0 && <div className="container vplab-search-results">{results.map(item => <article key={item.n}><img src={sprite(item.n)} alt="" /><span><b>{item.m}</b><small>#{String(item.n).padStart(3, "0")} · {item.t.join("/")}</small></span><div><button onClick={() => navigate(`/vplab/pokedex?p=${item.s}`)}>Ver na Pokédex</button><button onClick={() => navigate(`/vplab/avaliar-iv?p=${item.s}`)}>Avaliar IV</button><button onClick={() => navigate(`/vplab/rota?p=${item.s}`)}>Planejar rota</button></div></article>)}</div>}
      </div>
    </header>
  </>;
}
