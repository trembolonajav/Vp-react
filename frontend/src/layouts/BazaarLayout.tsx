import { Outlet } from "react-router-dom";
import { Header } from "../features/bazaar/components/Header";
import { Footer } from "../features/bazaar/components/Footer";

export function BazaarLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}
