import { PlatformHeader } from "../shared/PlatformHeader";
import { PlatformFooter } from "../shared/PlatformFooter";
import "./launcher.css";

const DOWNLOAD_URL = "/download/vplauncher";

export function LauncherPage() {
  return (
    <>
      <PlatformHeader activeArea="hub" subnavLabel="Vperts Multi" />
      <main className="launcher-page">
      <section className="launcher-hero">
        <div className="launcher-glow" aria-hidden="true" />
        <div className="launcher-copy">
          <span className="launcher-eyebrow"><i /> Aplicativo oficial Vpertz</span>
          <h1>Vperts <em>Multi</em></h1>
          <p className="launcher-lead">
            Seu launcher para acessar e organizar suas sessões com praticidade,
            em uma experiência leve feita para a comunidade.
          </p>

          <div className="launcher-actions">
            <a className="launcher-download" href={DOWNLOAD_URL}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3v11m0 0 4-4m-4 4-4-4M5 16v3h14v-3" />
              </svg>
              <span><strong>Baixar para Windows</strong><small>Versão 0.9.4 · 82,4 MB</small></span>
            </a>
            <a className="launcher-release" href="https://github.com/ekooll/poke-multi-labs/releases/tag/v0.9.4" target="_blank" rel="noreferrer">
              Ver detalhes da versão
            </a>
          </div>

          <div className="launcher-trust" aria-label="Informações do instalador">
            <span><b>Windows</b> 10 ou superior</span>
            <span><b>Release</b> 25/07/2026</span>
            <span><b>Formato</b> Instalador .exe</span>
          </div>
        </div>

        <div className="launcher-visual" aria-hidden="true">
          <div className="launcher-orbit orbit-one" />
          <div className="launcher-orbit orbit-two" />
          <div className="launcher-app-card">
            <div className="launcher-app-top"><span /><span /><span /></div>
            <img src="/assets/platform/header/vpertsz-logo_quadrada.png" alt="" />
            <strong>Vperts Multi</strong>
            <small>Launcher da comunidade</small>
            <div className="launcher-app-status"><i /> Pronto para iniciar</div>
          </div>
        </div>
      </section>

      <section className="launcher-features" aria-label="Destaques">
        <article><span>01</span><h2>Instalação simples</h2><p>Baixe o instalador e siga os passos exibidos na tela.</p></article>
        <article><span>02</span><h2>Download oficial</h2><p>O arquivo é entregue diretamente pela release publicada no GitHub.</p></article>
        <article><span>03</span><h2>Feito para a comunidade</h2><p>Um ponto de acesso organizado para os jogadores Vpertz.</p></article>
      </section>

      </main>
      <PlatformFooter />
    </>
  );
}
