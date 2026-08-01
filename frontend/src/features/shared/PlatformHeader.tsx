import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import "./platform-header.css";

export type PlatformArea = "hub" | "vplab" | "store" | "bazaar";

const areas = [
  { id:"vplab", label:"Ferramentas", href:"/vplab/", asset:"/assets/hub/header/vplab.png" },
  { id:"store", label:"VP Store", href:"/store", asset:"/assets/hub/header/vp-store.png" },
  { id:"bazaar", label:"VP Bazaar", href:"/bazaar/", asset:"/assets/hub/header/vp-bazaar.png" },
  { id:"hub", label:"VPertsz", href:"/", asset:"/assets/hub/header/vpertsz.png" },
] as const;

const brands:Record<PlatformArea,{href:string;asset:string;alt:string}> = {
  hub:{href:"/",asset:"/assets/logo-vpertsz-horizontal.webp",alt:"VPertsz"},
  vplab:{href:"/vplab/",asset:"/assets/tool-vplab.webp",alt:"VPLab"},
  store:{href:"/store",asset:"/assets/logo-vp-store-horizontal.webp",alt:"VP Store"},
  bazaar:{href:"/bazaar/",asset:"/assets/logo-vp-bazaar-horizontal-oficial.webp",alt:"VP Bazaar"},
};

export function PlatformHeader({ activeArea, children, subnavLabel = "Navegação da seção" }:{activeArea:PlatformArea;children?:ReactNode;subnavLabel?:string}) {
  const brand = brands[activeArea];
  return <>
    <div className="platform-topbar"><span aria-hidden="true" />Live todos os dias, das 18h às 22h, na&nbsp;<a href="https://www.twitch.tv/vpertsz" target="_blank" rel="noreferrer">twitch.tv/vpertsz</a></div>
    <header className="platform-header">
      <nav className="container platform-header__main" aria-label="Navegação principal">
        {brand.href.endsWith("/") && activeArea !== "hub"
          ? <a className="platform-header__brand" href={brand.href}><img src={brand.asset} alt={brand.alt} /></a>
          : <Link className="platform-header__brand" to={brand.href}><img src={brand.asset} alt={brand.alt} /></Link>}
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
