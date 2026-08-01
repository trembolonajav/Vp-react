import type { CSSProperties } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { Listing } from "../../../types/listing";
import { brl, numeroBR, spriteUrl, DIAMANTE } from "../../../utils/format";
import { assetUrl } from "../../../utils/assets";
import { TYPE_COLOR, TYPE_LABEL } from "../constants";

const HEART =
  "M12 20.7 4.2 13a4.9 4.9 0 0 1 0-7 4.9 4.9 0 0 1 7 0l.8.8.8-.8a4.9 4.9 0 0 1 7 0 4.9 4.9 0 0 1 0 7Z";

function Arte({ listing }: { listing: Listing }) {
  // Mídia enviada pode não existir mais no storage (ex.: upload legado perdido).
  // Ao falhar o carregamento, cai no placeholder oficial em vez de card quebrado.
  const [imgFailed, setImgFailed] = useState(false);
  if (listing.dex > 0) {
    return <img src={spriteUrl(listing.dex, listing.shiny)} alt="" loading="lazy" />;
  }
  if (listing.img && !imgFailed) {
    return (
      <img src={assetUrl(listing.img)} alt="" loading="lazy" onError={() => setImgFailed(true)} />
    );
  }
  return (
    <span className="bz-noart" aria-hidden="true">
      VP
    </span>
  );
}

function Preco({ listing }: { listing: Listing }) {
  if (!listing.preco) {
    return <div className="bz-price combinar">Preço a combinar</div>;
  }
  if (listing.moeda === "diamonds") {
    return (
      <>
        <img src={DIAMANTE} alt="diamonds" loading="lazy" />
        <div className="bz-price">{numeroBR(listing.preco)}</div>
      </>
    );
  }
  return <div className="bz-price bz-price-brl">{brl(listing.preco)}</div>;
}

export function ProductCard({
  listing,
  favorite = false,
  onFavorite,
}: {
  listing: Listing;
  favorite?: boolean;
  onFavorite?: (listing: Listing) => void;
}) {
  const vendido = listing.status === "vendido";
  const detalhe = listing.nivel
    ? `Nível ${listing.nivel}`
    : listing.quantidade
      ? `Quantidade: ${numeroBR(listing.quantidade)}`
      : listing.categoria;

  return (
    <article className={`bz-card ${vendido ? "vendido" : ""}`} data-id={listing.id}>
      <div className="bz-card-top">
        {listing.destaque && <span className="bz-plate destaque">Destaque</span>}
        {listing.shiny && <span className="bz-plate shiny">Shiny</span>}
        {vendido ? (
          <span className="bz-plate simples encerrado">Vendido</span>
        ) : (
          !listing.destaque &&
          !listing.shiny && (
            <span className={`bz-plate simples ${listing.intencao}`}>
              {listing.intencao === "compra" ? "Procura-se" : "À venda"}
            </span>
          )
        )}
        <button
          className="bz-fav"
          type="button"
          aria-label={favorite ? "Remover dos favoritos" : "Salvar nos favoritos"}
          aria-pressed={favorite}
          onClick={() => onFavorite?.(listing)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={HEART} />
          </svg>
        </button>
      </div>

      <div className="bz-card-main">
        <div className="bz-sprite">
          <Arte listing={listing} />
        </div>
        <div>
          <h3 className="bz-card-title">
            <span>{listing.titulo}</span>
            {listing.shiny && (
              <span className="bz-star" aria-label="Shiny">
                ★
              </span>
            )}
          </h3>
          {detalhe && <p className="bz-card-sub">{detalhe}</p>}
          {listing.tipos.length > 0 && (
            <div className="bz-types">
              {listing.tipos.map((t) => (
                <span
                  key={t}
                  className="bz-type"
                  style={{ "--c": TYPE_COLOR[t] ?? "#777" } as CSSProperties}
                >
                  <img src={`/assets/bazaar/types/${t}.webp`} alt="" loading="lazy" />
                  {TYPE_LABEL[t] ?? t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bz-card-price">
        <Preco listing={listing} />
        {listing.negociavel && !vendido && (
          <span className="bz-negociavel">
            Aceita
            <br />
            propostas
          </span>
        )}
      </div>

      {listing.vendedor && (
        <div className="bz-card-seller">
          <Link className="bz-card-seller-link" to={`/bazaar/perfil/${encodeURIComponent(listing.vendedor)}`}>
            <span className="bz-card-avatar">{listing.vendedor.slice(0, 2).toUpperCase()}</span>
            <span>{listing.vendedor}</span>
            {listing.vendedorVerificado && <span className="bz-card-verified" title="Vendedor verificado">✓</span>}
          </Link>
          <span className={`bz-online ${listing.vendedorOnline ? "" : "off"}`}>
            {listing.vendedorOnline ? "Online" : "Offline"}
          </span>
        </div>
      )}

      <Link className="bz-cta" to={`/bazaar/anuncio/${listing.id}`}>
        {vendido ? "Ver anúncio encerrado" : "Ver anúncio"}
      </Link>
    </article>
  );
}
