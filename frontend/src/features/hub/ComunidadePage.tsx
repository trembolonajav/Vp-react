import { useConfig } from "../../hooks/useConfig";
import { Icon } from "../shared/Icon";
import { ContatoGrid } from "../shared/Contatos";
import { waLink } from "../../utils/whatsapp";

interface Grupo {
  href: string;
  icone: "whatsapp" | "discord";
  classe: string;
  titulo: string;
  sub: string;
}

const GRUPOS: Grupo[] = [
  { href: "https://chat.whatsapp.com/CYB46ieEAJe2z2ItzuLpWl?s=cl&p=a&ilr=1&amv=2", icone: "whatsapp", classe: "whatsapp-card", titulo: "Grupo de Trade", sub: "Compra, venda e trocas entre jogadores" },
  { href: "https://chat.whatsapp.com/KG5qUggSXEs8x8X4nstbuT", icone: "whatsapp", classe: "whatsapp-card", titulo: "Grupo de Bate-papo", sub: "Converse com a comunidade" },
  { href: "https://chat.whatsapp.com/HAvMdVZz2nQLWSQg5UCync", icone: "whatsapp", classe: "whatsapp-card", titulo: "Análise de Hunt", sub: "Estratégias e análises das hunts" },
  { href: "https://chat.whatsapp.com/D4Rc9rKPt1uLSu3vC9Ui4N", icone: "whatsapp", classe: "whatsapp-card", titulo: "Comunidade", sub: "Canal geral da comunidade VP" },
  { href: "https://discord.gg/9M3HCdytt", icone: "discord", classe: "discord-card", titulo: "Discord", sub: "Servidor oficial da comunidade" },
];

export function ComunidadePage() {
  const { config } = useConfig();
  const suporte = config
    ? waLink(config.whatsapp, "Olá, VP Store! Vim pelo site e quero negociar diamantes.")
    : "#";

  return (
    <main className="page">
      <div className="container">
        <div className="contact-intro">
          <img className="community-contact-logo" src="/assets/logo-vpertsz-quadrada.webp" alt="Brasão do VPertsz" />
          <span className="kicker">Comunidade VPertsz</span>
          <h1>Comunidade e canais oficiais</h1>
          <p>Entre nos grupos, acompanhe conteúdos, compartilhe estratégias e encontre os canais oficiais do VPertsz.</p>
          <div className="ornament" aria-hidden="true"></div>
        </div>

        <section className="contact-section contact-section-featured">
          <div className="contact-section-head">
            <span className="kicker">Grupos da comunidade</span>
            <h2>Encontre o seu espaço na comunidade</h2>
            <p>Participe das conversas, negocie com outros jogadores, compartilhe estratégias ou acompanhe análises e novidades.</p>
          </div>
          <div className="community-grid">
            {GRUPOS.map((g) => (
              <a key={g.href} className={`contact-card community-card ${g.classe}`} href={g.href} target="_blank" rel="noreferrer">
                <div className="icon" aria-hidden="true"><Icon name={g.icone} /></div>
                <div>
                  <strong>{g.titulo}</strong>
                  <span>{g.sub}</span>
                </div>
                <span className="go" aria-hidden="true">→</span>
              </a>
            ))}
          </div>
        </section>

        <section className="contact-section">
          <div className="contact-section-head">
            <span className="kicker">Redes oficiais</span>
            <h2>Acompanhe o VPertsz</h2>
            <p>Lives, conteúdos, novidades e atualizações da comunidade nos canais oficiais.</p>
          </div>
          <div className="community-social-grid">
            {config && <ContatoGrid config={config} />}
          </div>
        </section>

        <section className="contact-section community-store-support">
          <div className="contact-section-head">
            <span className="kicker">Precisa de atendimento comercial?</span>
            <h2>VP Store</h2>
            <p>Para comprar ou vender diamonds, utilizar o intermédio ou falar sobre um atendimento da loja, acesse os canais oficiais da VP Store.</p>
          </div>
          <div className="store-support-actions">
            <a className="contact-card whatsapp-card" href={suporte} target="_blank" rel="noreferrer">
              <div className="icon" aria-hidden="true"><Icon name="whatsapp" /></div>
              <div>
                <strong>WhatsApp da VP Store</strong>
                <span>Atendimento comercial oficial</span>
              </div>
              <span className="go" aria-hidden="true">→</span>
            </a>
          </div>
          <p className="community-trade-note">
            <strong>Atenção:</strong> negociações realizadas entre jogadores nos grupos da comunidade são independentes.
            Para serviços da VP Store, utilize somente os canais oficiais indicados na área da loja.
          </p>
        </section>
      </div>
    </main>
  );
}
