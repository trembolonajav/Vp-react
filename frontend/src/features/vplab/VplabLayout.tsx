import { Outlet } from "react-router-dom";
import { VplabHeader } from "./components/VplabHeader";
import { PlatformHeader } from "../shared/PlatformHeader";

export function VplabLayout() {
  return <><PlatformHeader activeArea="vplab" subnavLabel="Ferramentas do VPLab"><VplabHeader /></PlatformHeader><Outlet /></>;
}
