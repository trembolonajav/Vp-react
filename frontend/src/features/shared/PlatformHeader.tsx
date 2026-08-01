import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import "./platform-header.css";

export type PlatformArea = "hub" | "vplab" | "store" | "bazaar";

const areas = [
  { id:"vplab", label:"Ferramentas", href:"/vplab/", asset:"/assets/platform/header/vp-lab-logo_quadrada.png" },
  { id:"store", label:"VP Store", href:"/store", asset:"/assets/platform/header/vp-store-logo_quadrada.png" },
  { id:"bazaar", label:"VP Bazaar", href:"/bazaar/", asset:"/assets/platform/header/vp-bazaar-logo_quadrada.png" },
  { id:"hub", label:"VPertsz", href:"/", asset:"/assets/platform/header/vpertsz-logo_quadrada.png" },
] as const;

const brands:Record<PlatformArea,{href:string;asset:string;alt:string}> = {
  hub:{href:"/",asset:"/assets/platform/header/vpertsz-logo_horizontal.png",alt:"VPertsz"},
  vplab:{href:"/vplab/",asset:"/assets/platform/header/vp-lab-logo_horizontal.png",alt:"VPLab"},
  store:{href:"/store",asset:"/assets/platform/header/vp-store-logo_horizontal.png",alt:"VP Store"},
  bazaar:{href:"/bazaar/",asset:"/assets/platform/header/vp-bazaar-logo_horizontal.png",alt:"VP Bazaar"},
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
        <a className="platform-header__live" href="https://www.twitch.tv/vpertsz" target="_blank" rel="noreferrer" aria-label="Assistir à live do VPertsz"><img src="/assets/platform/header/botao-assistir-live.png" alt="Assistir live" /></a>
      </nav>
      {children && <nav className="platform-subnav" aria-label={subnavLabel}><div className="container">{children}</div></nav>}
    </header>
  </>;
}
