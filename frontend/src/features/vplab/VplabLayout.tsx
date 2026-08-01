import { Outlet } from "react-router-dom";
import { VplabHeader } from "./components/VplabHeader";

export function VplabLayout() {
  return <><VplabHeader /><Outlet /></>;
}
