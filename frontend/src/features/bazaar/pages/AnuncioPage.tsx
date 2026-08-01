import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { useConfig } from "../../../hooks/useConfig";
import { ApiError } from "../../../services/api";
import { startConversation } from "../../../services/chatService";
import { getListing, listListings } from "../../../services/listingsService";
import { createReport } from "../../../services/reportsService";
import type { Listing } from "../../../types/listing";
import { assetUrl } from "../../../utils/assets";
import { brl, DIAMANTE, ivTotal, numeroBR, spriteUrl } from "../../../utils/format";
import { TYPE_COLOR, TYPE_LABEL } from "../constants";

const IV_NAMES = ["HP", "Ataque", "Defesa", "Atq. Esp.", "Def. Esp.", "Velocidade"];
const IV_ICONS = ["hp-iv", "ataque-iv", "defesa-iv", "ataque-especial-iv", "defesa-especial-iv", "velocidade-iv"];
const GENDER: Record<string, string> = { macho: "Macho ♂", femea: "Fêmea ♀", sem: "Sem gênero" };
const REPORT_REASONS = [
  "Anúncio falso ou enganoso",
  "Preço ou informações incorretas",
  "Item proibido ou duplicado",
  "Tentativa de golpe",
  "Outro motivo",
];

const fieldIcon = (name: string) => `/assets/bazaar/fields/${name}.webp`;
const relativeDate = (iso: string) => {
  if (!iso) return "";
  const days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
  if (days === 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 30) return `há ${days} dias`;
  const months = Math.floor(days / 30);
  return months === 1 ? "há 1 mês" : `há ${months} meses`;
};
const qualityText = (quality: number) => {
  if (!quality) return "";
  if (quality <= 1) return `${Math.round(quality * 100)}%`;
  return quality.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
};
const qualityLabel = (quality: number) => {
  if (!quality) return "";
  const value = quality <= 1 ? quality * 100 : quality;
  if (value >= 95) return "Perfeita";
  if (value >= 85) return "Excelente";
  if (value >= 70) return "Muito boa";
  return "Regular";
};
const listingArt = (listing: Listing) =>
  listing.dex > 0 ? spriteUrl(listing.dex, listing.shiny) : assetUrl(listing.img);

function TypeBadges({ types }: { types: string[] }) {
  if (!types.length) return null;
  return (
    <div className="bz-types">
      {types.map((type) => (
        <span key={type} className="bz-type" style={{ "--c": TYPE_COLOR[type] ?? "#777" } as CSSProperties}>
          <img src={`/assets/bazaar/types/${type}.webp`} alt="" />
          {TYPE_LABEL[type] ?? type}
        </span>
      ))}
    </div>
  );
}

function Spec({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div className="bz-spec-row">
      <img className="bz-fico" src={fieldIcon(icon)} alt="" />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Details({ listing }: { listing: Listing }) {
  const total = ivTotal(listing.ivs);
  const pokemon = listing.tipo === "pokemon" || listing.dex > 0;
  if (!pokemon) {
    const card = listing.tipo === "shinycard";
    return (
      <div className="bz-subpanel">
        <h2 className="bz-subpanel-title">{card ? "Detalhes da Shiny Card" : "Detalhes do item"}</h2>
        <div className="bz-nonpoke-details">
          <div>
            <div className="bz-nonpoke-row"><span>Categoria</span><strong>{listing.categoria || "Item"}</strong></div>
            <div className="bz-nonpoke-row"><span>Quantidade</span><strong>{numeroBR(listing.quantidade || 1)}</strong></div>
            <div className="bz-nonpoke-row"><span>Entrega</span><strong>In-game</strong></div>
          </div>
          <div className="bz-nonpoke-divider" />
          <div>
            <div className="bz-nonpoke-row"><span>Intenção</span><strong>{listing.intencao === "compra" ? "Compra" : "Venda"}</strong></div>
            <div className="bz-nonpoke-row"><span>Servidor</span><strong>{listing.servidor || "A combinar"}</strong></div>
            <div className="bz-nonpoke-row"><span>Disponibilidade</span><strong>{listing.disponibilidade || "A combinar"}</strong></div>
          </div>
        </div>
      </div>
    );
  }

  const specs = [
    ["nivel", "Nível", listing.nivel || ""],
    ["natureza", "Natureza", listing.natureza],
    ["habilidade", "Habilidade", listing.habilidade],
    ["genero", "Gênero", GENDER[listing.genero] ?? listing.genero],
    ["forma", "Forma", listing.forma],
    ["servidor", "Servidor", listing.servidor],
  ] as const;
  const visible = specs.filter(([, , value]) => value !== "");
  if (!visible.length && listing.ivs.length !== 6 && !listing.moves.length && !listing.regras) return null;
  return (
    <div className="bz-subpanel">
      <div className="bz-sheet-heading">
        <h2 className="bz-subpanel-title">Informações do Pokémon</h2>
        {total !== null && <span className="bz-sheet-iv-total"><img className="bz-fico" src={fieldIcon("iv-total")} alt="" />IV total <b>{total}</b> / 192</span>}
      </div>
      <div className="bz-info-grid">
        <div className="bz-spec-list">
          {visible.map(([icon, label, value]) => <Spec key={label} icon={icon} label={label} value={value} />)}
          {listing.poder > 0 && <Spec icon="nivel" label="Poder" value={numeroBR(listing.poder)} />}
        </div>
        {listing.ivs.length === 6 && (
          <div className="bz-spec-list">
            {listing.ivs.map((value, index) => <Spec key={IV_NAMES[index]} icon={IV_ICONS[index]} label={`${IV_NAMES[index]} IV`} value={value} />)}
          </div>
        )}
      </div>
      {listing.moves.length > 0 && (
        <div className="bz-info-line bz-info-foot">
          <img className="bz-fico" src={fieldIcon("golpes")} alt="" />
          <span className="bz-spec-key">Moves</span>
          <div className="bz-moves">{listing.moves.map((move) => <span key={move} className="bz-move">{move}</span>)}</div>
        </div>
      )}
      {listing.regras && (
        <div className="bz-sheet-rules">
          <b>Regras da negociação · observações do vendedor</b>
          <ul>{listing.regras.split(/\r?\n/).filter(Boolean).map((rule) => <li key={rule}>{rule}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

function RelatedCard({ listing }: { listing: Listing }) {
  const art = listingArt(listing);
  return (
    <Link className="bz-related-card" to={`/bazaar/anuncio/${listing.id}`}>
      <span className="bz-related-art">{art ? <img src={art} alt="" /> : <span className="bz-related-noart">VP</span>}</span>
      <span className="bz-related-copy">
        <strong>{listing.titulo}</strong>
        <small>{[listing.nivel ? `Nv. ${listing.nivel}` : "", TYPE_LABEL[listing.tipos[0]] ?? listing.categoria].filter(Boolean).join(" · ")}</small>
        <span className="bz-related-price">
          {listing.moeda === "diamonds" && listing.preco > 0 && <img src={DIAMANTE} alt="" />}
          <b>{listing.preco ? (listing.moeda === "diamonds" ? numeroBR(listing.preco) : brl(listing.preco)) : "A combinar"}</b>
        </span>
      </span>
    </Link>
  );
}

function ReportModal({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      navigate("/bazaar/login", { state: { from: `/bazaar/anuncio/${listing.id}` } });
      return;
    }
    const data = new FormData(event.currentTarget);
    setSubmitting(true);
    setStatus("");
    try {
      await createReport({
        adId: listing.id,
        title: listing.titulo,
        seller: listing.vendedor,
        reason: String(data.get("reason") || ""),
        details: String(data.get("details") || ""),
      });
      setSuccess(true);
      setStatus("Denúncia enviada. Obrigado por ajudar a comunidade.");
    } catch (error) {
      setStatus(error instanceof ApiError ? error.message : "Não foi possível enviar a denúncia.");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="bz-action-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="bz-action-modal bz-report-modal" role="dialog" aria-modal="true" aria-labelledby="report-title">
        <button className="bz-action-close" type="button" onClick={onClose} aria-label="Fechar">×</button>
        <span className="kicker">Moderação do Bazaar</span>
        <h2 id="report-title">Denunciar anúncio</h2>
        <p>A denúncia será enviada para a administração. O vendedor não recebe seus dados.</p>
        <form onSubmit={submit}>
          <fieldset>
            <legend>Qual é o problema?</legend>
            {REPORT_REASONS.map((reason, index) => <label key={reason}><input type="radio" name="reason" value={reason} required={index === 0} />{reason}</label>)}
          </fieldset>
          <label className="bz-report-details">Detalhes <small>(opcional)</small><textarea name="details" maxLength={600} rows={4} /></label>
          {status && <p className={`bz-report-status ${success ? "ok" : ""}`}>{status}</p>}
          <div className="bz-report-actions"><button type="button" onClick={onClose}>Cancelar</button><button type="submit" disabled={submitting || success}>{submitting ? "Enviando…" : "Enviar denúncia"}</button></div>
        </form>
      </section>
    </div>
  );
}

export function AnuncioPage() {
  const { id = "" } = useParams();
  const { config } = useConfig();
  const { user } = useAuth();
  const navigate = useNavigate();
  const carousel = useRef<HTMLDivElement>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [related, setRelated] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [heroFailed, setHeroFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setListing(null);
    setError(null);
    Promise.all([
      getListing(id, controller.signal),
      listListings({ q: "", tipo: "", intencao: "", moeda: "", categoria: "", precoMin: "", precoMax: "", ivMin: "", ivMax: "", qualidadeMin: "", qualidadeMax: "", nivelMin: "", nivelMax: "", poderMin: "", poderMax: "", tipos: [], sort: "recentes", page: 1 }, controller.signal),
    ]).then(([current, page]) => {
      setListing(current);
      const ordered = page.content
        .filter((item) => item.id !== current.id)
        .sort((a, b) => Number(b.categoria === current.categoria || b.tipos.some((type) => current.tipos.includes(type))) - Number(a.categoria === current.categoria || a.tipos.some((type) => current.tipos.includes(type))));
      setRelated(ordered.slice(0, 12));
      document.title = `${current.titulo} — VP Bazaar`;
    }).catch((err: Error) => {
      if (err.name !== "AbortError") setError(err instanceof ApiError && err.status === 404 ? "Anúncio não encontrado." : err.message);
    });
    return () => controller.abort();
  }, [id]);

  const art = useMemo(() => listing ? listingArt(listing) : "", [listing]);
  // Cai no placeholder oficial se a arte (ex.: mídia enviada) falhar ao carregar.
  const showArt = art !== "" && !heroFailed;
  if (error || !listing) {
    return <main className="page"><div className="container"><div className="bz-empty"><strong>{error || "Carregando anúncio…"}</strong>{error && <p><Link to="/bazaar">Voltar ao marketplace</Link></p>}</div></div></main>;
  }

  const sold = listing.status === "vendido";
  const pokemon = listing.tipo === "pokemon" || listing.dex > 0;
  const total = ivTotal(listing.ivs);
  const canTrade = !sold && Boolean(listing.vendedor) && user?.username !== listing.vendedor;
  const share = async () => {
    const shareUrl = `${window.location.origin}/api/v1/share/${encodeURIComponent(listing.id)}`;
    const data = { title: listing.titulo, text: `Confira este anúncio no VP Bazaar: ${listing.titulo}`, url: shareUrl };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(data.url);
        setActionError("Link copiado!");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") setActionError("Não foi possível compartilhar.");
    }
  };
  const negotiate = async () => {
    if (!user) {
      navigate("/bazaar/login", { state: { from: `/bazaar/anuncio/${listing.id}` } });
      return;
    }
    setActionError(null);
    try {
      const conversation = await startConversation({ adId: listing.id, seller: listing.vendedor, title: listing.titulo, image: art, price: listing.preco, currency: listing.moeda === "diamonds" ? "diamante" : "pix" });
      navigate(`/bazaar/chat?conversation=${encodeURIComponent(conversation.id)}`);
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : "Não foi possível abrir a conversa.");
    }
  };
  const kind = listing.tipo === "shinycard" ? "shinycard" : pokemon ? "pokemon" : "item";
  const strip = [
    ["nivel", "Nível", pokemon && listing.nivel ? String(listing.nivel) : "", ""],
    ["natureza", "Nature", pokemon ? listing.natureza : "", ""],
    ["iv-total", "IV total", total === null ? "" : `${total} / 192`, ""],
    ["raridade-shiny", "Qualidade", pokemon ? qualityLabel(listing.qualidade) : "", qualityText(listing.qualidade)],
  ].filter(([, , value]) => value);
  const whatsapp = config?.whatsapp ?? "";
  const waMessage = (config?.bazaar.msgInteresse ?? "Tenho interesse no anúncio {titulo} (#{id}).").replaceAll("{titulo}", listing.titulo).replaceAll("{id}", listing.id);

  return (
    <main className="page" data-detalhe>
      <div className="container">
        <nav className="bz-breadcrumb" aria-label="Trilha">
          <Link to="/">Início</Link><span>›</span><Link to="/bazaar">Anúncios</Link><span>›</span>
          {listing.categoria && <><Link to={`/bazaar?categoria=${encodeURIComponent(listing.categoria)}`}>{listing.categoria}</Link><span>›</span></>}
          <em>{listing.titulo}</em>
        </nav>
        <div className={`bz-detalhe kind-${kind}`}>
          <div className="bz-gallery">
            <div className="bz-panel bz-hero-art">
              <div className="bz-hero-plates">{listing.destaque && <span className="bz-plate destaque">Destaque</span>}{listing.shiny && <span className="bz-plate shiny">Shiny</span>}</div>
              <button className="bz-art-share" type="button" onClick={share} aria-label="Compartilhar anúncio">↗</button>
              {!pokemon && <span className="bz-kind-badge">{kind === "shinycard" ? "Colecionável" : listing.intencao === "compra" ? "Procura-se" : "À venda"}</span>}
              {showArt ? <img src={art} alt={listing.titulo} className="bz-hero-sprite" onError={() => setHeroFailed(true)} /> : <span className="bz-noart">VP</span>}
              {pokemon && <span className="bz-art-quality">{listing.forma || (listing.shiny ? "Shiny" : "Normal")}{listing.nivel > 0 && <b>Nv. {listing.nivel}</b>}</span>}
            </div>
            {pokemon ? <div className="bz-thumbnails"><button type="button" disabled>‹</button><div>{[0, 1, 2, 3].map((item) => <span className={item === 0 ? "active" : ""} key={item}>{showArt ? <img src={art} alt="" /> : "VP"}</span>)}</div><button type="button" disabled>›</button></div>
              : <div className="bz-gallery-stats"><div><b>{listing.quantidade || 1}</b><span>Unidades</span></div><div><b>{listing.preco ? numeroBR(listing.preco) : "—"}</b><span>Valor</span></div><div><b>{listing.categoria || "Item"}</b><span>Categoria</span></div></div>}
          </div>

          <div className="bz-detalhe-main">
            <div className="bz-subpanel bz-head">
              <div className="bz-head-top"><div><h1 className="bz-detalhe-title">{listing.titulo}{listing.shiny && <span className="bz-star"> ★</span>}</h1><TypeBadges types={listing.tipos} /></div>
                <p className="bz-status"><small>Anúncio</small><span><i className={`bz-status-dot ${sold ? "off" : ""}`} />{sold ? "Encerrado" : "Ativo"}</span>{listing.criadoEm && <time>Publicado {relativeDate(listing.criadoEm)}</time>}</p>
              </div>
              {strip.length > 0 && <div className={`bz-strip bz-strip-${strip.length}`}>{strip.map(([icon, label, value, detail]) => <div className="bz-strip-item" key={label}><img className="bz-fico" src={fieldIcon(icon)} alt="" /><div><span>{label}</span><strong>{value}{detail && <small> {detail}</small>}</strong></div></div>)}</div>}
            </div>
            <div className="bz-subpanel bz-price-panel">
              {listing.preco ? <>{listing.moeda === "diamonds" && <img src={DIAMANTE} alt="Diamonds" />}<b>{listing.moeda === "diamonds" ? numeroBR(listing.preco) : brl(listing.preco)}</b>{listing.moeda === "diamonds" && <span>Diamonds</span>}</> : <b className="combinar">Preço a combinar</b>}
              {listing.negociavel && !sold && <span className="bz-price-tag"><b>Aceita propostas</b><small>Venda e troca</small></span>}
            </div>
            {listing.descricao && <div className="bz-subpanel"><h2 className="bz-subpanel-title">Descrição do anúncio</h2><p className="bz-desc">{listing.descricao}</p></div>}
            <Details listing={listing} />
          </div>

          <aside className="bz-detalhe-side">
            {listing.vendedor && <div className="bz-panel bz-seller-card">
              <h2 className="bz-panel-title">Sobre o vendedor</h2>
              <div className="bz-seller-head"><div className="bz-avatar">{listing.vendedorAvatar ? <img src={assetUrl(listing.vendedorAvatar)} alt="" /> : <span>{listing.vendedor.slice(0, 1).toUpperCase()}</span>}</div>
                <div><div className="bz-seller-name">{listing.vendedor}<span className="bz-seller-level">LVL 12</span>{listing.vendedorVerificado && <span className="bz-seller-verified">✓</span>}</div>
                  {listing.vendedorNota > 0 && <div className="bz-seller-rep"><span className="bz-stars">★★★★★</span><b>{listing.vendedorNota.toLocaleString("pt-BR")}</b><span>({listing.vendedorVendas})</span></div>}<p className="bz-seller-since">Membro da comunidade VP</p></div>
              </div>
              <div className="bz-seller-stats"><div><b>{numeroBR(listing.vendedorVendas || 0)}</b><span>Vendas</span></div><div><b>98%</b><span>Conclusão</span></div><div><b>{listing.vendedorResposta || "~5 min"}</b><span>Resposta</span></div></div>
              <p className={`bz-online ${listing.vendedorOnline ? "" : "off"}`}>{listing.vendedorOnline ? "Online agora" : "Offline"} <i>·</i> <Link to={`/bazaar/perfil/${encodeURIComponent(listing.vendedor)}`}>Ver perfil →</Link></p>
              <div className="bz-actions">
                {canTrade && <button className="bz-btn-negociar" type="button" onClick={negotiate}><span>⚔</span>Negociar agora</button>}
                {sold && <p className="bz-encerrado">Este anúncio já foi concluído.</p>}
                <div className="bz-actions-row"><button className="bz-btn-compartilhar" type="button" onClick={share}>↗ Compartilhar</button><button className="bz-btn-denunciar" type="button" onClick={() => setReportOpen(true)}>△ Denunciar</button></div>
                {actionError && <p className="bz-form-error">{actionError}</p>}
                {!sold && whatsapp && <a className="bz-safe-link" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(waMessage)}`} target="_blank" rel="noreferrer">Falar pelo WhatsApp</a>}
              </div>
            </div>}
            <div className="bz-panel bz-alerta"><h2 className="bz-panel-title">Compre com segurança</h2><div className="bz-safe-list">
              <div><i>↻</i><p><b>Negocie pelos canais oficiais</b><span>Toda a conversa acontece dentro da plataforma.</span></p></div>
              <div><i>♙</i><p><b>Não pague fora do combinado</b><span>Use o intermédio da VP em valores altos.</span></p></div>
              <div><i>✦</i><p><b>Confira reputação e histórico</b><span>Avaliações e vendas anteriores do vendedor.</span></p></div>
            </div><Link className="bz-safe-link" to="/comunidade">Ver canais oficiais →</Link></div>
          </aside>
        </div>

        {related.length > 0 && <section className="bz-similar"><div className="bz-similar-head"><h2 className="section-title">Anúncios semelhantes</h2><div className="bz-carousel-nav"><Link to="/bazaar">Ver todos</Link><button className="bz-arrow prev" type="button" onClick={() => carousel.current?.scrollBy({ left: -700, behavior: "smooth" })} aria-label="Ver anteriores" /><button className="bz-arrow next" type="button" onClick={() => carousel.current?.scrollBy({ left: 700, behavior: "smooth" })} aria-label="Ver próximos" /></div></div><div className="bz-carousel"><div className="bz-carousel-track" ref={carousel}>{related.map((item) => <RelatedCard key={item.id} listing={item} />)}</div></div></section>}
      </div>
      {reportOpen && <ReportModal listing={listing} onClose={() => setReportOpen(false)} />}
    </main>
  );
}
