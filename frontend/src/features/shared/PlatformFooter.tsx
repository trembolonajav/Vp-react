import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useConfig } from "../../hooks/useConfig";
import { Socials } from "./Contatos";

export function PlatformFooter({ vplabActions = false }: { vplabActions?: boolean }) {
  const { config } = useConfig();
  const [supportOpen, setSupportOpen] = useState(false);

  useEffect(() => {
    if (!supportOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setSupportOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [supportOpen]);

  return (
    <footer className={vplabActions ? "platform-footer platform-footer--vplab" : "platform-footer"}>
      <div className="container">
        <div className={vplabActions ? "footer-grid footer-grid--with-actions" : "footer-grid"}>
          <div className="footer-about">
            <img className="footer-logo" src="/assets/logo-vpertsz-horizontal.webp" alt="VPertsz" width="760" height="242" loading="lazy" decoding="async" />
            <p>O hub oficial do streamer VPertsz: ferramentas, comunidade e a live diária do PokeIdle World. Negociação transparente e comunidade ativa todos os dias.</p>
          </div>
          <div>
            <div className="footer-title">Navegação</div>
            <div className="footer-links">
              <a href="/vplab/">Ferramentas</a>
              <Link to="/store">VP Store</Link>
              <a href="/bazaar/">VP Bazaar</a>
              <Link to="/comunidade">Comunidade</Link>
            </div>
          </div>
          <div className="footer-social-column">
            <div className="footer-title">Acompanhe o VPertsz</div>
            {config && <Socials config={config} />}
          </div>
          {vplabActions && (
            <div className="vplab-footer-actions" aria-label="Apoie o VPertsz">
              <div className="footer-title">Fortaleça o projeto</div>
              <a className="vplab-footer-action vplab-footer-action--referral" href="https://poke.idleworld.online/" target="_blank" rel="noreferrer" aria-label="Usar meu referral no Poke Idle World"><span /></a>
              <button className="vplab-footer-action vplab-footer-action--support" type="button" onClick={() => setSupportOpen(true)} aria-label="Apoiar o streamer"><span /></button>
            </div>
          )}
        </div>
        <div className="footer-bottom">
          <span>© 2026 VPertsz — todos os direitos reservados.</span>
        </div>
      </div>
      {supportOpen && (
        <div className="support-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSupportOpen(false); }}>
          <section className="support-modal" role="dialog" aria-modal="true" aria-labelledby="support-title">
            <button className="support-modal__close" type="button" onClick={() => setSupportOpen(false)} aria-label="Fechar">×</button>
            <span>Apoio opcional</span>
            <h2 id="support-title">Apoie o streamer</h2>
            <p>Se o conteúdo e as ferramentas do VPLab ajudam você, é possível apoiar diretamente o trabalho do streamer com uma contribuição voluntária.</p>
            <div className="support-modal__qr" role="img" aria-label="QR Code para contribuição voluntária" />
            <small>O apoio é 100% opcional e não oferece benefícios, vantagens ou acesso exclusivo. Antes de confirmar, confira no aplicativo bancário se os dados do destinatário estão corretos.</small>
          </section>
        </div>
      )}
    </footer>
  );
}
