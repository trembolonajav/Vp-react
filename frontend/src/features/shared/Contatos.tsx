import { Icon } from "./Icon";
import { contatoHref, isExternal } from "../../utils/whatsapp";
import type { Contact, SiteConfig } from "../../types/config";

interface Props {
  config: SiteConfig;
}

function href(config: SiteConfig, c: Contact): string {
  return contatoHref(config.whatsapp, config.msgNegociar, c.url);
}

const externo = (url: string) =>
  isExternal(url) ? { target: "_blank", rel: "noreferrer" } : {};

/** Chips do streamer (home). */
export function Handles({ config }: Props) {
  return (
    <div className="handles">
      {config.contatos.map((c, i) => {
        const url = href(config, c);
        return (
          <a key={i} className="handle" href={url} {...externo(url)}>
            <Icon name={c.icone} />
            {c.info || c.nome}
          </a>
        );
      })}
    </div>
  );
}

/** Ícones sociais do rodapé. */
export function Socials({ config }: Props) {
  return (
    <div className="socials">
      {config.contatos.map((c, i) => {
        const url = href(config, c);
        return (
          <a key={i} className="social" href={url} {...externo(url)} aria-label={c.nome}>
            <Icon name={c.icone} />
          </a>
        );
      })}
    </div>
  );
}

/** Grade da página de contato. */
export function ContatoGrid({ config }: Props) {
  return (
    <div className="contact-grid">
      {config.contatos.map((c, i) => {
        const url = href(config, c);
        const info =
          c.icone === "whatsapp" && !c.url.trim() ? "Atendimento oficial da loja" : c.info;
        return (
          <a key={i} className="contact-card" href={url} {...externo(url)}>
            <div className="icon">
              <Icon name={c.icone} />
            </div>
            <div>
              <strong>{c.nome}</strong>
              <span>{info}</span>
            </div>
            <span className="go" aria-hidden="true">→</span>
          </a>
        );
      })}
    </div>
  );
}
