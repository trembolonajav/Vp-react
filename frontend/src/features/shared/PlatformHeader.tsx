import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import "./platform-header.css";

export type PlatformArea = "hub" | "vplab" | "store" | "bazaar";

const areas = [
  { id:"vplab", label:"Ferramentas", href:"/vplab/", asset:"/assets/tool-vplab.webp" },
  { id:"store", label:"VP Store", href:"/store", asset:"/assets/logo-vp-store-horizontal.webp" },
  { id:"bazaar", label:"VP Bazaar", href:"/bazaar/", asset:"/assets/logo-vp-bazaar-horizontal-oficial.webp" },
  { id:"hub", label:"VPertsz", href:"/", asset:"/assets/logo-vpertsz-horizontal.webp" },
] as const;

export function PlatformHeader({ activeArea, children, subnavLabel = "Navegação da seção" }:{activeArea:PlatformArea;children?:ReactNode;subnavLabel?:string}) {
  return <>
    <div className="platform-topbar"><span aria-hidden="true" />Live todos os dias, das 18h às 22h, na&nbsp;<a href="https://www.twitch.tv/vpertsz" target="_blank" rel="noreferrer">twitch.tv/vpertsz</a></div>
    <header className="platform-header">
      <nav className="container platform-header__main" aria-label="Navegação principal">
        <Link className="platform-header__brand" to="/" aria-label="VPertsz — início"><img src="/assets/logo-vpertsz-horizontal.webp" alt="VPertsz" /></Link>
        <div className="platform-header__areas">
          {areas.map(area => area.href.endsWith("/") && area.id !== "hub"
            ? <a className={activeArea===area.id?"active":""} href={area.href} key={area.id}><img src={area.asset} alt=""/><span>{area.label}</span></a>
            : <Link className={activeArea===area.id?"active":""} to={area.href} key={area.id}><img src={area.asset} alt=""/><span>{area.label}</span></Link>)}
        </div>
        <a className="platform-header__live" href="https://www.twitch.tv/vpertsz" target="_blank" rel="noreferrer" aria-label="Assistir à live do VPertsz"><img src="/assets/hub/header/assistir-live.png" alt="Assistir live" /></a>
      </nav>
      {children && <nav className="platform-subnav" aria-label={subnavLabel}><div className="container">{children}</div></nav>}
    </header>
  </>;
}
