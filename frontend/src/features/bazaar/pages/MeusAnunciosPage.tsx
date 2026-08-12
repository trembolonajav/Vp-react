import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { ApiError } from "../../../services/api";
import { listConversations } from "../../../services/chatService";
import { deleteListing, listMine, updateListingStatus } from "../../../services/listingsService";
import type { ConversationSummary } from "../../../types/conversation";
import type { Listing } from "../../../types/listing";
import { brl, DIAMANTE, ivTotal, numeroBR, spriteUrl } from "../../../utils/format";
import { tierQualidade } from "./profileShared";

// Porte fiel da tela 12 "Meus anúncios" de "VP Bazaar - Telas.dc.html".
// Estilos inline portados verbatim; hover/focus vão no bloco SCOPED.
// Dados reais onde o backend fornece; métricas não rastreadas (vistas, propostas)
// aparecem como "—" — nada de número inventado.

const SCOPED = `
.bzmine [data-h=novo]:hover,.bzmine [data-h=vender]:hover{filter:brightness(1.14)}
.bzmine [data-h=share]:hover,.bzmine [data-h=ver]:hover{border-color:#e5b34f !important;color:#f6d68f !important}
.bzmine [data-h=tab]:hover{border-color:rgba(229,179,79,.5) !important}
.bzmine input:focus,.bzmine select:focus{outline:none;border-color:#e5b34f !important}
.bzmine input::placeholder{color:#7d6d64}
.bzmine [data-h=icon]:hover{border-color:#e5b34f !important;color:#e5b34f !important}
.bzmine [data-h=row]:hover{background:rgba(229,179,79,.06)}
.bzmine [data-h=bpausar]:hover{border-color:#e5b34f !important;color:#f7eee7 !important}
.bzmine [data-h=bvendido]:hover{border-color:#4ec97c !important}
.bzmine [data-h=bshare]:hover{border-color:#e5b34f !important}
.bzmine [data-h=bexcluir]:hover{border-color:rgba(216,80,60,.8) !important;color:#ffc9ba !important}
.bzmine [data-h=mitem]:hover{background:rgba(229,179,79,.08);color:#f7eee7 !important}
@media(max-width:820px){.bzmine .mine-grid{grid-template-columns:26px minmax(0,1.5fr) 96px 84px 104px !important}.bzmine .mine-perf{display:none !important}}
`;

const GRID = "34px minmax(0,1.6fr) 128px 96px 182px 120px";
const STATUS_PALETTE: Record<string, { rotulo: string; cor: string; fundo: string; borda: string }> = {
  ativo: { rotulo: "Ativo", cor: "#7fd9a2", fundo: "rgba(78,201,124,.1)", borda: "rgba(78,201,124,.34)" },
  pausado: { rotulo: "Pausado", cor: "#f0d194", fundo: "rgba(229,179,79,.1)", borda: "rgba(229,179,79,.34)" },
  vendido: { rotulo: "Vendido", cor: "#8a7a70", fundo: "rgba(216,138,74,.08)", borda: "rgba(216,138,74,.24)" },
};

const ABAS: Array<[string, string]> = [
  ["ativo", "Ativos"], ["pausado", "Pausados"], ["vendido", "Vendidos"], ["rascunho", "Rascunhos"],
];

const chatIcon = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.3-.6L3 21l1.8-5.1A8.3 8.3 0 0 1 3.6 11.5 8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4Z" />
  </svg>
);

export function MeusAnunciosPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [convs, setConvs] = useState<ConversationSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [filtro, setFiltro] = useState("ativo");
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState("recentes");
  const [menu, setMenu] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([listMine(controller.signal), listConversations(controller.signal)])
      .then(([items, conversations]) => {
        setListings(items);
        setConvs(conversations.conversations);
      })
      .catch((err: Error) => { if (err.name !== "AbortError") setError(err.message); });
    return () => controller.abort();
  }, []);

  const contagem = (status: string) => listings?.filter((item) => item.status === status).length ?? 0;
  const chatsAbertos = convs.filter((c) => !["concluida", "encerrada"].includes(c.conversation.status)).length;
  const chatsDoAnuncio = (id: string) => convs.filter((c) => c.conversation.adId === id).length;

  const visiveis = useMemo(() => {
    const items = (listings ?? []).filter((item) =>
      item.status === filtro && item.titulo.toLowerCase().includes(busca.trim().toLowerCase()));
    return [...items].sort((a, b) => ordem === "antigos"
      ? +new Date(a.criadoEm) - +new Date(b.criadoEm)
      : ordem === "titulo" ? a.titulo.localeCompare(b.titulo) : +new Date(b.criadoEm) - +new Date(a.criadoEm));
  }, [listings, filtro, busca, ordem]);

  const alterarStatus = async (item: Listing, status: string) => {
    setBusy(item.id); setError(null);
    try {
      const atualizado = await updateListingStatus(item.id, status);
      setListings((prev) => prev?.map((x) => x.id === item.id ? atualizado : x) ?? prev);
    } catch (err) { setError(err instanceof ApiError ? err.message : "Falha ao alterar o anúncio."); }
    finally { setBusy(null); setMenu(null); }
  };

  const excluir = async (item: Listing) => {
    if (!window.confirm(`Excluir o anúncio "${item.titulo}"?`)) return;
    setBusy(item.id);
    try {
      await deleteListing(item.id);
      setListings((prev) => prev?.filter((x) => x.id !== item.id) ?? prev);
      setSelecionados((prev) => { const next = new Set(prev); next.delete(item.id); return next; });
    } catch (err) { setError(err instanceof ApiError ? err.message : "Falha ao excluir."); }
    finally { setBusy(null); setMenu(null); }
  };

  const preco = (l: Listing) => !l.preco ? "A combinar" : l.moeda === "diamonds" ? numeroBR(l.preco) : brl(l.preco);

  const compartilhar = async (items: Listing[]) => {
    if (!items.length) return;
    const lista = items.length > 1;
    const title = lista ? `Lista de anúncios de ${user?.username ?? "vendedor"}` : items[0].titulo;
    const text = lista
      ? items.map((item) => `• ${item.titulo} — ${preco(item)}\n${window.location.origin}/bazaar/anuncio/${item.id}`).join("\n\n")
      : `${items[0].titulo}\n${preco(items[0])}`;
    const url = lista
      ? `${window.location.origin}/bazaar/perfil/${encodeURIComponent(user?.username ?? "")}`
      : `${window.location.origin}/bazaar/anuncio/${items[0].id}`;
    try {
      const nativeShare = typeof navigator.share === "function";
      if (nativeShare) await navigator.share({ title, text, url });
      else await navigator.clipboard.writeText(`${title}\n\n${text}\n\n${url}`);
      setShareStatus(nativeShare ? "Compartilhamento aberto." : "Lista copiada.");
    } catch (err) { if ((err as Error).name !== "AbortError") setShareStatus("Não foi possível compartilhar."); }
  };

  const alternar = (id: string) => setSelecionados((prev) => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });
  const selecionadosLista = (listings ?? []).filter((item) => selecionados.has(item.id));
  const acaoMassa = async (status: string) => {
    for (const item of selecionadosLista) await alterarStatus(item, status);
  };

  const kpis: Array<{ simbolo: string; valor: string; rotulo: string; cor: string; fundo: string; borda: string }> = [
    { simbolo: "☰", valor: String(contagem("ativo")), rotulo: "Anúncios ativos", cor: "#f0d194", fundo: "rgba(229,179,79,.14)", borda: "rgba(229,179,79,.34)" },
    { simbolo: "◉", valor: "—", rotulo: "Vistas em 7 dias", cor: "#f7eee7", fundo: "rgba(216,138,74,.1)", borda: "rgba(216,138,74,.26)" },
    { simbolo: "◈", valor: String(chatsAbertos), rotulo: "Chats abertos", cor: "#8ea1e1", fundo: "rgba(114,137,218,.14)", borda: "rgba(114,137,218,.32)" },
    { simbolo: "✓", valor: String(contagem("vendido")), rotulo: "Vendas concluídas", cor: "#7fd9a2", fundo: "rgba(78,201,124,.12)", borda: "rgba(78,201,124,.32)" },
  ];

  const temSelecao = selecionados.size > 0;
  const tabelaStyle: CSSProperties = {
    border: "1px solid rgba(229,179,79,.22)",
    borderTop: temSelecao ? "0" : "1px solid rgba(229,179,79,.22)",
    borderRadius: temSelecao ? "0 0 10px 10px" : "10px",
    background: "linear-gradient(180deg,#1a1210,#120c0a)",
    position: "relative",
    marginTop: temSelecao ? 0 : "11px",
  };
  const topRadius = temSelecao ? 0 : 10;

  return (
    <main className="bzmine" style={{ padding: "34px 0 56px", background: "radial-gradient(1000px 480px at 50% 0%, rgba(120,26,26,.2), transparent 70%)" }}>
      <style>{SCOPED}</style>
      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "0 20px" }}>

        {/* cabeçalho */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div>
            <span style={{ font: "800 10.5px/1 Inter", letterSpacing: ".2em", textTransform: "uppercase", color: "#c33629" }}>Painel do vendedor</span>
            <h1 style={{ margin: "9px 0 0", font: "700 30px/1.05 Cinzel, serif", color: "#f7eee7" }}>Meus anúncios</h1>
            <p style={{ margin: "7px 0 0", fontSize: 13.5, color: "#b5a196" }}>Uma linha por anúncio, com o desempenho ao lado. Ações raras ficam no menu <b style={{ color: "#e5b34f" }}>⋯</b>.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <button type="button" data-h="share" disabled={!temSelecao} onClick={() => void compartilhar(selecionadosLista)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 16px", borderRadius: 9, cursor: temSelecao ? "pointer" : "not-allowed", border: "1px solid rgba(216,138,74,.3)", background: "linear-gradient(180deg,#241813,#160f0c)", font: "700 11.5px/1 Inter", letterSpacing: ".08em", textTransform: "uppercase", color: "#e5b34f", opacity: temSelecao ? 1 : 0.55 }}>
              Compartilhar lista <span style={{ color: "#8a7a70" }}>({selecionados.size})</span>
            </button>
            <Link to="/bazaar/anunciar" data-h="novo"
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 18px", borderRadius: 9, border: "1px solid rgba(240,200,130,.5)", background: "linear-gradient(180deg,#a51f22,#6a1215)", boxShadow: "inset 0 1px 0 rgba(255,220,160,.3)", font: "700 12px/1 Cinzel, serif", letterSpacing: ".1em", textTransform: "uppercase", color: "#fff" }}>
              + Novo anúncio
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, marginTop: 18, background: "rgba(229,179,79,.16)", border: "1px solid rgba(229,179,79,.2)", borderRadius: 10, overflow: "hidden" }}>
          {kpis.map((k) => (
            <div key={k.rotulo} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", background: "#170f0d" }}>
              <span style={{ flex: "none", width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 9, border: `1px solid ${k.borda}`, background: k.fundo, fontSize: 14, color: k.cor }}>{k.simbolo}</span>
              <div>
                <div style={{ font: "700 20px/1 Cinzel, serif", color: k.cor }}>{k.valor}</div>
                <div style={{ marginTop: 5, font: "700 9px/1 Inter", letterSpacing: ".14em", textTransform: "uppercase", color: "#8a7a70" }}>{k.rotulo}</div>
              </div>
            </div>
          ))}
        </div>

        {/* abas + busca */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, margin: "16px 0 11px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {ABAS.map(([id, label]) => {
              const ativa = filtro === id;
              const qtd = id === "rascunho" ? 0 : contagem(id);
              return (
                <button key={id} data-h="tab" onClick={() => setFiltro(id)}
                  style={{ padding: "9px 15px", borderRadius: 8, cursor: "pointer", border: `1px solid ${ativa ? "rgba(229,179,79,.5)" : "rgba(216,138,74,.2)"}`, background: ativa ? "rgba(229,179,79,.12)" : "rgba(10,6,5,.5)", font: "700 12.5px/1 Inter", color: ativa ? "#f7eee7" : "#b5a196" }}>
                  {label} <span style={{ color: ativa ? "#e5b34f" : "#8a7a70" }}>{qtd}</span>
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar nos meus anúncios…"
              style={{ width: 230, padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(216,138,74,.22)", background: "rgba(10,6,5,.6)", color: "#f7eee7", fontSize: 12.5 }} />
            <select value={ordem} onChange={(e) => setOrdem(e.target.value)}
              style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(216,138,74,.22)", background: "rgba(10,6,5,.6)", color: "#f7eee7", fontSize: 12.5 }}>
              <option value="recentes">Mais recentes</option>
              <option value="antigos">Mais antigos</option>
              <option value="titulo">Título A–Z</option>
            </select>
          </div>
        </div>

        {error && <p style={{ color: "#f0a58f", fontSize: 13, margin: "0 0 10px" }}>{error}</p>}
        {shareStatus && <p style={{ color: "#7fd9a2", fontSize: 13, margin: "0 0 10px" }}>{shareStatus}</p>}

        {/* barra de ações em massa */}
        {temSelecao && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", border: "1px solid rgba(229,179,79,.4)", borderRadius: "9px 9px 0 0", background: "linear-gradient(90deg,rgba(120,26,26,.3),rgba(23,15,13,.9))" }}>
            <span style={{ font: "700 12px/1 Inter", color: "#f7eee7" }}>☑ {selecionados.size} selecionados</span>
            <div style={{ display: "flex", gap: 7, marginLeft: "auto", flexWrap: "wrap" }}>
              <button data-h="bpausar" onClick={() => void acaoMassa("pausado")} style={btnMassa("rgba(216,138,74,.3)", "rgba(10,6,5,.55)", "#e6d3b4")}>Pausar</button>
              <button data-h="bvendido" onClick={() => void acaoMassa("vendido")} style={btnMassa("rgba(78,201,124,.4)", "rgba(78,201,124,.08)", "#7fd9a2")}>Marcar vendido</button>
              <button data-h="bshare" onClick={() => void compartilhar(selecionadosLista)} style={btnMassa("rgba(229,179,79,.4)", "rgba(229,179,79,.1)", "#f0d194")}>Compartilhar juntos</button>
              <button data-h="bexcluir" onClick={() => { void (async () => { for (const item of selecionadosLista) await excluir(item); })(); }} style={btnMassa("rgba(195,54,41,.4)", "rgba(195,54,41,.1)", "#e8b4a8")}>Excluir</button>
            </div>
          </div>
        )}

        {/* tabela */}
        {!listings ? (
          <div style={vazio}>Carregando…</div>
        ) : listings.length === 0 ? (
          <div style={vazio}>
            <strong style={{ color: "#f7eee7" }}>Você ainda não tem anúncios</strong>
            <p style={{ margin: "8px 0 0" }}><Link to="/bazaar/anunciar" style={{ color: "#e5b34f" }}>Criar meu primeiro anúncio</Link></p>
          </div>
        ) : (
          <div style={tabelaStyle}>
            <div className="mine-grid" style={{ display: "grid", gridTemplateColumns: GRID, gap: 10, alignItems: "center", padding: "9px 14px", borderBottom: "1px solid rgba(229,179,79,.16)", background: "rgba(10,6,5,.5)", borderTopLeftRadius: topRadius, borderTopRightRadius: topRadius, font: "800 9px/1 Inter", letterSpacing: ".16em", textTransform: "uppercase", color: "#7d6d64" }}>
              <span></span><span>Anúncio</span><span>Preço</span><span>Situação</span><span className="mine-perf">Desempenho</span><span style={{ textAlign: "right" }}>Ações</span>
            </div>

            {visiveis.map((m) => {
              const tier = tierQualidade(m.qualidade);
              const iv = ivTotal(m.ivs);
              const sold = m.status === "vendido";
              const pal = STATUS_PALETTE[m.status] ?? STATUS_PALETTE.ativo;
              const nChats = chatsDoAnuncio(m.id);
              const sprite = m.dex ? spriteUrl(m.dex, m.shiny) : m.img;
              return (
                <div key={m.id} data-h="row" className="mine-grid" style={{ display: "grid", gridTemplateColumns: GRID, gap: 10, alignItems: "center", padding: "11px 14px", borderBottom: "1px solid rgba(229,179,79,.09)", background: sold ? "rgba(10,6,5,.35)" : "transparent", opacity: sold ? 0.62 : 1 }}>
                  <input type="checkbox" checked={selecionados.has(m.id)} onChange={() => alternar(m.id)} aria-label={`Selecionar ${m.titulo}`} style={{ accentColor: "#c33629", width: 15, height: 15 }} />

                  <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                    <i style={{ flex: "none", width: 46, height: 46, borderRadius: 8, border: "1px solid rgba(229,179,79,.18)", background: `radial-gradient(58% 58% at 50% 44%, rgba(195,54,41,.28), rgba(10,6,5,.9))${sprite ? `, url(${sprite})` : ""}`, backgroundSize: "cover, 76%", backgroundPosition: "center, center", backgroundRepeat: "no-repeat, no-repeat", imageRendering: "pixelated" }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ font: "700 13.5px/1.15 Inter", color: "#f7eee7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.titulo}</span>
                        <span style={{ flex: "none", padding: "2px 6px", borderRadius: 4, border: "1px solid rgba(216,138,74,.28)", font: "800 8.5px/1.4 Inter", letterSpacing: ".1em", textTransform: "uppercase", color: "#a2896a" }}>{m.categoria || m.tipo || "Anúncio"}</span>
                      </div>
                      <div style={{ marginTop: 5, display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
                        {tier && <span style={{ padding: "2px 6px", borderRadius: 4, border: "1px solid rgba(229,179,79,.3)", font: "800 9px/1.4 Inter", color: "#f0d194" }}>{tier.texto}</span>}
                        {iv != null && <span style={{ padding: "2px 6px", borderRadius: 4, border: "1px solid rgba(78,201,124,.32)", font: "800 9px/1.4 Inter", color: "#7fd9a2" }}>IV {iv}</span>}
                        <span style={{ fontSize: 10.5, color: "#7d6d64" }}>{m.quantidade > 1 ? `${m.quantidade} unidades · ` : ""}publicado em {new Date(m.criadoEm).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {m.preco > 0 && m.moeda === "diamonds" && <img src={DIAMANTE} alt="" style={{ width: 15, height: 15, objectFit: "contain" }} />}
                      <span style={{ font: "700 16px/1 Cinzel, serif", color: "#e5b34f" }}>{preco(m)}</span>
                    </div>
                    <div style={{ marginTop: 5, fontSize: 10, color: "#7d6d64" }}>{m.negociavel ? "Aceita propostas" : "Preço fixo"}</div>
                  </div>

                  <div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 9px", borderRadius: 999, border: `1px solid ${pal.borda}`, background: pal.fundo, font: "800 9px/1 Inter", letterSpacing: ".1em", textTransform: "uppercase", color: pal.cor }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: pal.cor }} />{pal.rotulo}
                    </span>
                  </div>

                  <div className="mine-perf" style={{ display: "flex", gap: 12 }}>
                    {desempenho("—", "Vistas", "#f7eee7")}
                    {desempenho(String(nChats), "Chats", nChats > 0 ? "#8ea1e1" : "#7d6d64")}
                    {desempenho("—", "Propostas", "#7d6d64")}
                  </div>

                  <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 7 }}>
                    <Link to="/bazaar/chat" data-h="icon" title="Abrir chats deste anúncio" style={{ position: "relative", width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 8, border: "1px solid rgba(216,138,74,.28)", background: "linear-gradient(180deg,#1e1512,#140d0b)", color: "#b5a196" }}>
                      {chatIcon}
                      {nChats > 0 && <span style={{ position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, padding: "0 4px", boxSizing: "border-box", display: "grid", placeItems: "center", borderRadius: 999, border: "1px solid #0a0605", background: "#c33629", font: "800 9px/1 Inter", color: "#fff" }}>{nChats}</span>}
                    </Link>
                    <Link to={`/bazaar/anuncio/${m.id}`} data-h="ver" style={{ padding: "9px 13px", borderRadius: 8, border: "1px solid rgba(229,179,79,.4)", background: "linear-gradient(180deg,#241813,#160f0c)", font: "700 11px/1 Inter", letterSpacing: ".08em", textTransform: "uppercase", color: "#e5b34f" }}>Ver</Link>
                    <button data-h="icon" title="Mais ações" onClick={() => setMenu(menu === m.id ? null : m.id)} style={{ width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 8, cursor: "pointer", border: "1px solid rgba(216,138,74,.28)", background: "linear-gradient(180deg,#1e1512,#140d0b)", font: "700 14px/1 Inter", color: "#b5a196" }}>⋯</button>

                    {menu === m.id && (
                      <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 20, width: 210, border: "1px solid rgba(229,179,79,.34)", borderRadius: 10, background: "linear-gradient(180deg,#1c1310,#120c0a)", boxShadow: "0 20px 36px -22px rgba(0,0,0,.9)", overflow: "hidden" }}>
                        <div style={{ padding: "9px 13px", borderBottom: "1px solid rgba(229,179,79,.14)", font: "800 9px/1 Inter", letterSpacing: ".16em", textTransform: "uppercase", color: "#7d6d64" }}>Menu ⋯ do anúncio</div>
                        <Link to={`/bazaar/anunciar/${m.id}`} data-h="mitem" style={menuItem("#e0d0c4")}><span style={menuIco("#e5b34f")}>✎</span>Editar anúncio</Link>
                        {m.status === "ativo" && <button data-h="mitem" onClick={() => void alterarStatus(m, "pausado")} style={menuItem("#e0d0c4", true)}><span style={menuIco("#e5b34f")}>❚❚</span>Pausar anúncio</button>}
                        {m.status === "pausado" && <button data-h="mitem" onClick={() => void alterarStatus(m, "ativo")} style={menuItem("#e0d0c4", true)}><span style={menuIco("#e5b34f")}>▶</span>Reativar anúncio</button>}
                        {m.status !== "vendido" && <button data-h="mitem" onClick={() => void alterarStatus(m, "vendido")} style={menuItem("#e0d0c4", true)}><span style={menuIco("#7fd9a2")}>✓</span>Marcar como vendido</button>}
                        <button data-h="mitem" onClick={() => { setMenu(null); void compartilhar([m]); }} style={menuItem("#e0d0c4", true)}><span style={menuIco("#e5b34f")}>⧉</span>Compartilhar card</button>
                        <button data-h="mitem" disabled={busy === m.id} onClick={() => void excluir(m)} style={menuItem("#d68b7c", true)}><span style={menuIco("#d8503c")}>✕</span>Excluir anúncio</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {!visiveis.length && <div style={{ padding: "22px 14px", textAlign: "center", color: "#8a7a70", fontSize: 13 }}>Nenhum anúncio neste filtro.</div>}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "11px 14px", background: "rgba(10,6,5,.5)", borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }}>
              <span style={{ fontSize: 11.5, color: "#7d6d64" }}>Mostrando {visiveis.length} de {listings.length} anúncios</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function btnMassa(borda: string, fundo: string, cor: string): CSSProperties {
  return { padding: "8px 13px", borderRadius: 7, cursor: "pointer", border: `1px solid ${borda}`, background: fundo, font: "700 11px/1 Inter", letterSpacing: ".06em", textTransform: "uppercase", color: cor };
}

function desempenho(valor: string, rotulo: string, cor: string) {
  return (
    <span style={{ flex: "none", whiteSpace: "nowrap" }}>
      <span style={{ display: "block", font: "700 13px/1 Inter", color: cor }}>{valor}</span>
      <span style={{ display: "block", marginTop: 4, font: "700 8.5px/1 Inter", letterSpacing: ".12em", textTransform: "uppercase", color: "#7d6d64" }}>{rotulo}</span>
    </span>
  );
}

function menuItem(cor: string, botao = false): CSSProperties {
  return { display: "flex", alignItems: "center", gap: 10, width: botao ? "100%" : undefined, padding: "10px 13px", borderBottom: "1px solid rgba(229,179,79,.07)", font: "600 12.5px/1 Inter", color: cor, background: "none", cursor: "pointer", textAlign: "left" };
}
function menuIco(cor: string): CSSProperties {
  return { flex: "none", width: 15, textAlign: "center", color: cor };
}

const vazio: CSSProperties = { marginTop: 16, padding: "40px 20px", textAlign: "center", border: "1px solid rgba(229,179,79,.18)", borderRadius: 12, background: "linear-gradient(180deg,#1a1210,#120c0a)", color: "#b5a196" };
