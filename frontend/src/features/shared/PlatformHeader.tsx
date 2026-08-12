import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import "./platform-header.css";

export type PlatformArea = "hub" | "vplab" | "store" | "bazaar";

const areas = [
  { id:"vplab", label:"Ferramentas", href:"/vplab/", asset:"/assets/vplab/header/logo-vplab.webp", width:440, height:508 },
  { id:"store", label:"VP Store", href:"/store", asset:"/assets/logo-vp-store-quadrada.webp", width:440, height:508 },
  { id:"bazaar", label:"VP Bazaar", href:"/bazaar/", asset:"/assets/logo-vp-bazaar-quadrada-oficial.webp", width:720, height:839 },
  { id:"hub", label:"VPertsz", href:"/", asset:"/assets/logo-vpertsz-quadrada.webp", width:760, height:760 },
] as const;

const brands:Record<PlatformArea,{href:string;asset:string;alt:string;width:number;height:number}> = {
  hub:{href:"/",asset:"/assets/logo-vpertsz-horizontal.webp",alt:"VPertsz",width:760,height:242},
  vplab:{href:"/vplab/",asset:"/assets/vplab/header/logo-vplab.webp",alt:"VPLab",width:440,height:508},
  store:{href:"/store",asset:"/assets/logo-vp-store-horizontal.webp",alt:"VP Store",width:560,height:188},
  bazaar:{href:"/bazaar/",asset:"/assets/logo-vp-bazaar-horizontal-oficial.webp",alt:"VP Bazaar",width:720,height:311},
};

export function PlatformHeader({ activeArea, children, subnavLabel = "Navegação da seção" }:{activeArea:PlatformArea;children?:ReactNode;subnavLabel?:string}) {
  const brand = brands[activeArea];
  return <>
    <div className="platform-topbar"><span aria-hidden="true" />Live todos os dias, das 18h às 22h, na&nbsp;<a href="https://www.twitch.tv/vpertsz" target="_blank" rel="noreferrer">twitch.tv/vpertsz</a></div>
    <header className="platform-header">
      <nav className="container platform-header__main" aria-label="Navegação principal">
        {brand.href.endsWith("/") && activeArea !== "hub"
          ? <a className={`platform-header__brand platform-header__brand--${activeArea}`} href={brand.href} aria-label={`Ir para ${brand.alt}`}><img src={brand.asset} alt={brand.alt} width={brand.width} height={brand.height} /></a>
          : <Link className={`platform-header__brand platform-header__brand--${activeArea}`} to={brand.href} aria-label={`Ir para ${brand.alt}`}><img src={brand.asset} alt={brand.alt} width={brand.width} height={brand.height} /></Link>}
        <div className="platform-header__areas">
          {areas.map(area => area.href.endsWith("/") && area.id !== "hub"
            ? <a className={activeArea===area.id?"active":""} href={area.href} key={area.id} aria-label={`Acessar ${area.label}`}><img src={area.asset} alt="" width={area.width} height={area.height}/><span>{area.label}</span></a>
            : <Link className={activeArea===area.id?"active":""} to={area.href} key={area.id} aria-label={`Acessar ${area.label}`}><img src={area.asset} alt="" width={area.width} height={area.height}/><span>{area.label}</span></Link>)}
        </div>
        <a className="platform-header__live" href="https://www.twitch.tv/vpertsz" target="_blank" rel="noreferrer" aria-label="Assistir à live do VPertsz"><img src="/assets/btn-assistir-live.webp" alt="" width="800" height="200" /></a>
      </nav>
    </header>
    {children && <nav className="platform-subnav" aria-label={subnavLabel}><div className="container">{children}</div></nav>}
  </>;
}
