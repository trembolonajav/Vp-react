import { Outlet } from "react-router-dom";
import { VplabHeader } from "./components/VplabHeader";
import { PlatformHeader } from "../shared/PlatformHeader";
import { PlatformFooter } from "../shared/PlatformFooter";

export function VplabLayout() {
  return <><PlatformHeader activeArea="vplab" subnavLabel="Ferramentas do VPLab"><VplabHeader /></PlatformHeader><Outlet /><PlatformFooter vplabActions /></>;
}
