export function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-about">
            <img
              className="footer-logo"
              src="/assets/logo-vp-bazaar-horizontal-oficial.webp"
              alt="VP Bazaar"
            />
            <p>
              O marketplace da comunidade VPertsz para negociar Pokémon e itens
              entre jogadores.
            </p>
          </div>
          <div>
            <div className="footer-title">Navegação</div>
            <div className="footer-links">
              <a href="/">Marketplace</a>
              <a href="#anunciar">Anunciar</a>
              <a href="/">VPertsz</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 VP Bazaar — todos os direitos reservados.</span>
        </div>
      </div>
    </footer>
  );
}
