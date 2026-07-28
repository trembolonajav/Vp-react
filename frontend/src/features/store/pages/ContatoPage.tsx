import { useConfig } from "../../../hooks/useConfig";
import { ContatoGrid } from "../../shared/Contatos";

export function ContatoPage() {
  const { config } = useConfig();

  return (
    <main className="page">
      <div className="container">
        <div className="section-head center">
          <div>
            <span className="kicker">Fale com a VP Store</span>
            <h1>Contato e canais oficiais</h1>
            <p className="section-sub">Escolha o melhor canal para falar com a equipe.</p>
            <div className="ornament" aria-hidden="true"></div>
          </div>
        </div>
        {config && <ContatoGrid config={config} />}
      </div>
    </main>
  );
}
