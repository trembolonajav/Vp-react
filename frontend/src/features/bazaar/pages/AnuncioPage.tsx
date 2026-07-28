import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getListing } from "../../../services/listingsService";
import { useConfig } from "../../../hooks/useConfig";
import type { Listing } from "../../../types/listing";
import { ApiError } from "../../../services/api";
import { brl, numeroBR, spriteUrl, DIAMANTE, ivTotal } from "../../../utils/format";
import { TYPE_COLOR, TYPE_LABEL } from "../constants";
import type { CSSProperties } from "react";

const IV_NOMES = ["HP", "Ataque", "Defesa", "Atq. Esp.", "Def. Esp.", "Velocidade"];
const GENERO: Record<string, string> = {
  macho: "Macho ♂",
  femea: "Fêmea ♀",
  sem: "Sem gênero",
};

function Ficha({ listing }: { listing: Listing }) {
  const total = ivTotal(listing.ivs);
  const linhas: [string, string][] = [];
  if (listing.tipo === "pokemon") {
    if (listing.nivel) linhas.push(["Nível", String(listing.nivel)]);
    if (listing.poder) linhas.push(["Poder", numeroBR(listing.poder)]);
    if (listing.qualidade) linhas.push(["Qualidade", listing.qualidade.toLocaleString("pt-BR")]);
    if (total !== null) linhas.push(["IV total", `${total} / 192`]);
    if (listing.natureza) linhas.push(["Natureza", listing.natureza]);
    if (listing.habilidade) linhas.push(["Habilidade", listing.habilidade]);
    if (listing.genero) linhas.push(["Gênero", GENERO[listing.genero] ?? listing.genero]);
    if (listing.forma) linhas.push(["Forma", listing.forma]);
  } else {
    if (listing.quantidade) linhas.push(["Quantidade", numeroBR(listing.quantidade)]);
    if (listing.categoria) linhas.push(["Categoria", listing.categoria]);
  }
  if (listing.disponibilidade) linhas.push(["Disponibilidade", listing.disponibilidade]);

  if (linhas.length === 0 && listing.ivs.length !== 6) return null;

  return (
    <div className="an-block">
      <h2 className="an-block-title">Ficha</h2>
      <div className="an-fields">
        {linhas.map(([k, v]) => (
          <div key={k} className="an-field">
            <span>{k}</span>
            <b>{v}</b>
          </div>
        ))}
      </div>

      {listing.ivs.length === 6 && (
        <div className="an-ivs">
          {listing.ivs.map((iv, i) => (
            <div key={IV_NOMES[i]} className="an-iv">
              <span>{IV_NOMES[i]}</span>
              <b>{iv}</b>
            </div>
          ))}
        </div>
      )}

      {listing.moves.length > 0 && (
        <div className="an-moves">
          {listing.moves.map((m) => (
            <span key={m} className="an-move">
              {m}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function AnuncioPage() {
  const { id = "" } = useParams();
  const { config } = useConfig();
  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setListing(null);
    setError(null);
    getListing(id, controller.signal)
      .then(setListing)
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        setError(err instanceof ApiError && err.status === 404 ? "Anúncio não encontrado." : err.message);
      });
    return () => controller.abort();
  }, [id]);

  if (error) {
    return (
      <main className="page">
        <div className="container">
          <div className="bz-empty">
            <strong>{error}</strong>
            <p>
              <Link to="/">Voltar ao marketplace</Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="page">
        <div className="container">
          <div className="bz-empty">
            <strong>Carregando anúncio…</strong>
          </div>
        </div>
      </main>
    );
  }

  const arte =
    listing.dex > 0
      ? spriteUrl(listing.dex, listing.shiny)
      : listing.img || "";
  const vendido = listing.status === "vendido";

  const whatsapp = config?.whatsapp ?? "";
  const msg = (config?.bazaar.msgInteresse ?? "Tenho interesse no anúncio {titulo} (#{id}).")
    .replaceAll("{titulo}", listing.titulo)
    .replaceAll("{id}", listing.id);
  const waLink = `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;

  return (
    <main className="page">
      <div className="container">
        <nav className="an-crumbs" aria-label="Trilha">
          <Link to="/">Marketplace</Link>
          <span>›</span>
          {listing.categoria && <span>{listing.categoria}</span>}
          {listing.categoria && <span>›</span>}
          <span className="an-crumb-atual">{listing.titulo}</span>
        </nav>

        <div className="an-grid">
          <div className="an-gallery">
            <div className="an-frame">
              {arte ? (
                <img src={arte} alt={listing.titulo} className="an-art" />
              ) : (
                <span className="bz-noart">VP</span>
              )}
            </div>
          </div>

          <div className="an-content">
            <div className="an-head">
              <div className="an-plates">
                {listing.destaque && <span className="bz-plate destaque">Destaque</span>}
                {listing.shiny && <span className="bz-plate shiny">Shiny</span>}
                <span className={`bz-plate simples ${vendido ? "encerrado" : listing.intencao}`}>
                  {vendido ? "Vendido" : listing.intencao === "compra" ? "Procura-se" : "À venda"}
                </span>
              </div>
              <h1 className="an-title">
                {listing.titulo}
                {listing.shiny && <span className="bz-star"> ★</span>}
              </h1>
              {listing.tipos.length > 0 && (
                <div className="bz-types an-types">
                  {listing.tipos.map((t) => (
                    <span
                      key={t}
                      className="bz-type"
                      style={{ "--c": TYPE_COLOR[t] ?? "#777" } as CSSProperties}
                    >
                      <img src={`/assets/bazaar/types/${t}.webp`} alt="" />
                      {TYPE_LABEL[t] ?? t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="an-price">
              {listing.preco ? (
                listing.moeda === "diamonds" ? (
                  <>
                    <img src={DIAMANTE} alt="diamonds" />
                    <b>{numeroBR(listing.preco)}</b>
                  </>
                ) : (
                  <b>{brl(listing.preco)}</b>
                )
              ) : (
                <b>Preço a combinar</b>
              )}
              {listing.negociavel && !vendido && <span className="an-negocia">Aceita propostas</span>}
            </div>

            {listing.vendedor && (
              <div className="an-seller">
                Anunciante: <b>{listing.vendedor}</b>
                <span className={`bz-online ${listing.vendedorOnline ? "" : "off"}`}>
                  {listing.vendedorOnline ? "Online" : "Offline"}
                </span>
              </div>
            )}

            {listing.descricao && <p className="an-desc">{listing.descricao}</p>}

            <Ficha listing={listing} />

            {listing.regras && (
              <div className="an-block">
                <h2 className="an-block-title">Regras da negociação</h2>
                <p className="an-desc">{listing.regras}</p>
              </div>
            )}

            {!vendido && whatsapp && (
              <a className="an-cta" href={waLink} target="_blank" rel="noreferrer">
                Negociar agora no WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
