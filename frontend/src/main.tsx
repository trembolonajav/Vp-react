import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { AuthProvider } from "./contexts/AuthContext";

// Estilos reaproveitados do app atual: tema (base) + bazaar (design aprovado)
// + estilos das páginas novas (formulários/detalhe/painel).
import "./styles/base.css";
import "./styles/bazaar.css";
import "./styles/pages.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
