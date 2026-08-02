import { Link, useLocation } from "react-router-dom";
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

export function VplabHeader() {
  const location = useLocation();
  const active = (path: string) => location.pathname === path || (path === "/vplab/avaliar-iv" && location.pathname === "/vplab/");

  return <div className="vplab-toolbar__inner">
    {["Consultar", "Avaliar", "Planejar"].map(group => <div className="vplab-toolgroup" key={group}><small>{group}</small><div>{tools.filter(tool => tool.group === group).map(tool => <Link className={active(tool.path) ? "is-active" : ""} to={tool.path} key={tool.path}><img src={`/assets/vplab/header/${tool.icon}`} alt="" />{tool.label}</Link>)}</div></div>)}
  </div>;
}
