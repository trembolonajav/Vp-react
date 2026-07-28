import { Route, Routes } from "react-router-dom";
import { BazaarLayout } from "./layouts/BazaarLayout";
import { MarketplacePage } from "./features/bazaar/pages/MarketplacePage";

export function App() {
  return (
    <Routes>
      <Route element={<BazaarLayout />}>
        <Route index element={<MarketplacePage />} />
      </Route>
    </Routes>
  );
}
