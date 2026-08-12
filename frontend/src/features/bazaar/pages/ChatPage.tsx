import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  getConversation,
  listConversations,
  markRead,
  sendMessage,
  setStatus,
} from "../../../services/chatService";
import { useAuth } from "../../../contexts/AuthContext";
import type { ConversationDetail, ConversationSummary, ConversationView } from "../../../types/conversation";
import { A } from "./profileShared";
import { numeroBR } from "../../../utils/format";

// Migração pixel-perfect de "VP Bazaar - Negociacao.dc.html" (layout de 3 colunas).
// Os artefatos de protótipo (seletor "Vendo como", mensagens/etapas fixas) são
// substituídos pelos dados reais do backend: papel vem de buyer/seller e o
// andamento/ações são dirigidos pelo status da conversa.

const SCOPED = `
.bzneg [data-scroll]::-webkit-scrollbar{width:6px}
.bzneg [data-scroll]::-webkit-scrollbar-thumb{background:rgba(216,138,74,.28);border-radius:3px}
.bzneg [data-scroll]::-webkit-scrollbar-track{background:transparent}
.bzneg input:focus{outline:none;border-color:#e5b34f}
.bzneg input::placeholder{color:#7d6d64}
.bzneg [data-h=conv]:hover{background:rgba(229,179,79,.06) !important}
.bzneg [data-h=ad]:hover{color:#e5b34f !important}
.bzneg [data-h=enviar]:hover,.bzneg [data-h=principal]:not([disabled]):hover{filter:brightness(1.13)}
.bzneg [data-h=inter]:hover{border-color:#e5b34f !important;background:rgba(229,179,79,.16) !important}
.bzneg [data-h=discord]:hover{border-color:#7289da !important;color:#e6ebff !important}
.bzneg [data-h=encerrar]:not([disabled]):hover{border-color:#c33629 !important;color:#f7d9d2 !important}
.bzneg [data-h=denunciar]:hover{color:#e0a49b !important}
@media(max-width:1240px){.bzneg [data-grid=chat]{grid-template-columns:236px minmax(0,1fr) !important}.bzneg [data-col=lado]{grid-column:1 / -1}}
@media(max-width:900px){.bzneg [data-grid=chat]{grid-template-columns:minmax(0,1fr) !important}}
`;

const ESTADO_CONV: Record<string, { rotulo: string; cor: string; borda: string }> = {
  aberta: { rotulo: "Aberta", cor: "#f0d194", borda: "rgba(229,179,79,.4)" },
  "intermedio-solicitado": { rotulo: "Intermédio", cor: "#f0d194", borda: "rgba(229,179,79,.4)" },
  "intermedio-assumido": { rotulo: "VP no chat", cor: "#f0d194", borda: "rgba(229,179,79,.4)" },
  "produto-recebido": { rotulo: "Produto recebido", cor: "#7fd9a2", borda: "rgba(78,201,124,.4)" },
  "pagamento-recebido": { rotulo: "Em custódia", cor: "#7fd9a2", borda: "rgba(78,201,124,.4)" },
  "entregas-confirmadas": { rotulo: "Entregue", cor: "#7fd9a2", borda: "rgba(78,201,124,.4)" },
  concluida: { rotulo: "Concluída", cor: "#8a7a70", borda: "rgba(216,138,74,.24)" },
  encerrada: { rotulo: "Encerrada", cor: "#c98d84", borda: "rgba(195,54,41,.3)" },
};

const hora = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
const quando = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hoje = new Date();
  if (d.toDateString() === hoje.toDateString()) return hora(iso);
  const ontem = new Date(hoje); ontem.setDate(hoje.getDate() - 1);
  if (d.toDateString() === ontem.toDateString()) return "ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};
const dataLonga = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
};

export function ChatPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [conversas, setConversas] = useState<ConversationSummary[]>([]);
  const [ativa, setAtiva] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<ConversationDetail | null>(null);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const rolagem = useRef<HTMLDivElement>(null);

  const recarregarLista = () =>
    listConversations()
      .then((r) => setConversas(r.conversations))
      .catch((err: Error) => setError(err.message));

  const abrir = async (id: string) => {
    setAtiva(id);
    setDetalhe(null);
    try {
      await markRead(id);
      setDetalhe(await getConversation(id));
      recarregarLista();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    const requested = searchParams.get("conversation");
    recarregarLista().then(() => {
      if (requested) void abrir(requested);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (rolagem.current) rolagem.current.scrollTop = rolagem.current.scrollHeight;
  }, [detalhe]);

  useEffect(() => {
    let running = false;
    const sync = async () => {
      if (running || document.hidden) return;
      running = true;
      try {
        const list = await listConversations();
        setConversas(list.conversations);
        if (ativa) {
          const fresh = await getConversation(ativa);
          setDetalhe((current) => {
            const currentLast = current?.messages[current.messages.length - 1];
            const freshLast = fresh.messages[fresh.messages.length - 1];
            const changed = !current || current.conversation.status !== fresh.conversation.status || current.messages.length !== fresh.messages.length || currentLast?.id !== freshLast?.id;
            return changed ? fresh : current;
          });
          await markRead(ativa);
        }
        setError(null);
      } catch { /* mantém a conversa visível e tenta novamente no próximo ciclo */ }
      finally { running = false; }
    };
    const timer = window.setInterval(() => void sync(), 1500);
    const onVisible = () => { if (!document.hidden) void sync(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [ativa]);

  const enviar = async () => {
    if (!ativa || !texto.trim() || detalhe?.conversation.status === "encerrada") return;
    try {
      await sendMessage(ativa, texto.trim());
      setTexto("");
      setDetalhe(await getConversation(ativa));
      recarregarLista();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const mudarStatus = async (status: string) => {
    if (!ativa) return;
    try {
      const conversation = await setStatus(ativa, status);
      setDetalhe((d) => (d ? { ...d, conversation } : d));
      recarregarLista();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const outroDe = (c: ConversationView) => (user?.username === c.buyer ? c.seller : c.buyer);
  const totalNaoLidas = conversas.reduce((total, item) => total + item.unread, 0);

  return (
    <main className="bzneg" style={{ background: "#0a0605", minHeight: "100vh", paddingBottom: 40 }}>
      <style>{SCOPED}</style>
      <div style={{ maxWidth: 1500, margin: "0 auto", padding: "18px 26px 0" }}>
        {error && <p style={{ margin: "0 0 12px", fontSize: 12, color: "#e0a49b" }}>{error}</p>}
        <div data-grid="chat" style={{ display: "grid", gridTemplateColumns: "252px minmax(0,1fr) 300px", gap: 14, alignItems: "start" }}>

          {/* Coluna 1 — lista de conversas */}
          <aside style={{ borderRadius: 12, border: "1px solid rgba(216,138,74,.18)", background: "linear-gradient(180deg,#181110,#100b09)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 14px", borderBottom: "1px solid rgba(216,138,74,.14)" }}>
              <span style={{ font: "800 9.5px/1 Inter", letterSpacing: ".16em", textTransform: "uppercase", color: "#e5b34f" }}>Conversas</span>
              {totalNaoLidas > 0 && <span style={{ minWidth: 19, height: 19, display: "grid", placeItems: "center", padding: "0 5px", borderRadius: 999, background: "#c33629", font: "700 10px/1 Inter", color: "#fff" }}>{totalNaoLidas}</span>}
            </div>
            {conversas.length === 0 ? (
              <p style={{ margin: 0, padding: "22px 16px", fontSize: 12, color: "#8a7a70", textAlign: "center" }}>Nenhuma conversa ainda.</p>
            ) : conversas.map(({ conversation: c, unread }) => {
              const on = ativa === c.id;
              const e = ESTADO_CONV[c.status] ?? ESTADO_CONV.aberta;
              return (
                <button key={c.id} data-h="conv" type="button" onClick={() => abrir(c.id)} style={{ display: "grid", gridTemplateColumns: "36px minmax(0,1fr)", gap: 10, width: "100%", textAlign: "left", padding: "11px 13px", cursor: "pointer", border: 0, borderLeft: `2px solid ${on ? "#c33629" : "transparent"}`, borderBottom: "1px solid rgba(216,138,74,.1)", background: on ? "rgba(195,54,41,.1)" : "transparent" }}>
                  <i role="img" aria-label={outroDe(c)} style={{ width: 36, height: 36, borderRadius: 8, background: `${c.image ? `url("${c.image}") center/80% no-repeat, ` : ""}rgba(10,6,5,.6)`, imageRendering: "pixelated" }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", font: "700 12.5px/1.2 Inter", color: "#f7eee7" }}>{outroDe(c)}</span>
                      <span style={{ flex: "none", fontSize: 10, color: "#7d6d64" }}>{quando(c.updatedAt)}</span>
                    </div>
                    <div style={{ marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11, color: "#8a7a70" }}>{c.title || "Anúncio"}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                      <span style={{ padding: "3px 7px", borderRadius: 5, border: `1px solid ${e.borda}`, font: "700 8.5px/1 Inter", letterSpacing: ".1em", textTransform: "uppercase", color: e.cor }}>{e.rotulo}</span>
                      {unread > 0 && <span style={{ minWidth: 16, height: 16, display: "grid", placeItems: "center", borderRadius: 999, background: "#c33629", font: "700 9px/1 Inter", color: "#fff" }}>{unread}</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </aside>

          {/* Coluna 2 — painel do chat */}
          <div style={{ display: "flex", flexDirection: "column", borderRadius: 12, border: "1px solid rgba(216,138,74,.2)", background: "linear-gradient(180deg,#181110,#0f0a09)", overflow: "hidden", minHeight: 560 }}>
            {!detalhe ? (
              <div style={{ display: "grid", placeItems: "center", flex: 1, padding: 40, fontSize: 13, color: "#8a7a70" }}>Selecione uma conversa.</div>
            ) : (() => {
              const c = detalhe.conversation;
              const outro = outroDe(c);
              const ehDiamond = c.currency === "diamante" || c.currency === "diamonds";
              const precoFmt = !c.price ? "" : ehDiamond ? numeroBR(c.price) : `R$ ${c.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
              const fechado = c.status === "encerrada" || c.status === "concluida";
              return (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 15px", borderBottom: "1px solid rgba(216,138,74,.16)", background: "rgba(22,14,12,.9)" }}>
                    <i role="img" aria-label={c.title} style={{ flex: "none", width: 42, height: 42, borderRadius: 9, background: `${c.image ? `url("${c.image}") center/82% no-repeat, ` : ""}radial-gradient(60% 60% at 50% 42%, rgba(221,79,127,.24), rgba(10,6,5,.85))`, imageRendering: "pixelated" }} />
                    <div style={{ minWidth: 0 }}>
                      <Link data-h="ad" to={`/bazaar/anuncio/${c.adId}`} style={{ font: "700 14.5px/1.2 Inter", color: "#f7eee7" }}>{c.title || "Anúncio"}</Link>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5, fontSize: 11.5, color: "#8a7a70" }}>
                        {c.details}
                        {precoFmt && <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#e5b34f" }}>{ehDiamond && <img src={A("diamante.png")} alt="Diamonds" style={{ width: 13, height: 13, objectFit: "contain" }} />}{precoFmt}</span>}
                      </div>
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ font: "700 12.5px/1 Inter", color: "#f7eee7" }}>{outro}</div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 5, marginTop: 5, font: "600 10.5px/1 Inter", color: "#8a7a70" }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ec97c" }} />{user?.username === c.buyer ? "Vendedor" : "Comprador"}</div>
                      </div>
                      <span style={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", background: "linear-gradient(180deg,#3a2213,#1d1109)", border: "1px solid rgba(216,138,74,.3)", font: "700 11px/1 Inter", color: "#e5b34f" }}>{outro.slice(0, 2).toUpperCase()}</span>
                    </div>
                  </div>

                  <div ref={rolagem} data-scroll="1" style={{ display: "flex", flexDirection: "column", gap: 11, padding: 16, height: 452, overflow: "auto", background: "radial-gradient(120% 90% at 50% 0%, rgba(120,26,26,.1), transparent 60%)" }}>
                    <div style={{ alignSelf: "center", maxWidth: "88%", padding: "7px 13px", borderRadius: 999, border: "1px solid rgba(216,138,74,.22)", background: "rgba(24,16,13,.9)", font: "700 9.5px/1.4 Inter", letterSpacing: ".08em", textTransform: "uppercase", color: "#c9a86a", textAlign: "center" }}>Negociação aberta {dataLonga(c.createdAt)}</div>
                    {detalhe.messages.map((m) => {
                      const meu = m.authorId === user?.id;
                      return (
                        <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: meu ? "flex-end" : "flex-start", gap: 5 }}>
                          <div style={{ maxWidth: "78%", padding: "11px 14px", borderRadius: meu ? "11px 11px 3px 11px" : "11px 11px 11px 3px", border: `1px solid ${meu ? "rgba(240,200,130,.3)" : "rgba(216,138,74,.16)"}`, background: meu ? "linear-gradient(180deg,rgba(120,26,26,.55),rgba(70,16,16,.5))" : "linear-gradient(180deg,#231913,#180f0c)", font: "400 13px/1.5 Inter", color: meu ? "#f7e4d6" : "#d3c3b5" }}>{m.text}</div>
                          <span style={{ fontSize: 10, color: "#7d6d64" }}>{meu ? "Você" : m.author} · {hora(m.createdAt)}</span>
                        </div>
                      );
                    })}
                    {detalhe.messages.length === 0 && <p style={{ alignSelf: "center", margin: "8px 0", fontSize: 12, color: "#8a7a70" }}>Envie a primeira mensagem.</p>}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 14px", borderTop: "1px solid rgba(216,138,74,.16)", background: "rgba(22,14,12,.9)" }}>
                    <input type="text" value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void enviar(); } }} placeholder={fechado ? "Negociação encerrada" : `Escreva para ${outro}…`} disabled={fechado} maxLength={1000} style={{ flex: 1, minWidth: 0, padding: "12px 14px", borderRadius: 9, border: "1px solid rgba(216,138,74,.2)", background: "rgba(10,6,5,.7)", color: "#f7eee7", fontSize: 13.5, opacity: fechado ? 0.6 : 1 }} />
                    <button data-h="enviar" type="button" onClick={() => void enviar()} disabled={fechado || !texto.trim()} style={{ padding: "12px 20px", borderRadius: 9, cursor: fechado || !texto.trim() ? "default" : "pointer", border: "1px solid rgba(240,200,130,.45)", background: "linear-gradient(180deg,#a51f22,#6a1215)", boxShadow: "inset 0 1px 0 rgba(255,220,160,.26)", font: "700 12px/1 Inter", letterSpacing: ".06em", color: "#fff", opacity: fechado || !texto.trim() ? 0.6 : 1 }}>Enviar</button>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Coluna 3 — andamento + ações */}
          <div data-col="lado" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {detalhe ? (() => {
              const c = detalhe.conversation;
              const souComprador = user?.username === c.buyer;
              const souVendedor = user?.username === c.seller;
              const encerrada = c.status === "encerrada";
              const concluida = c.status === "concluida";
              const intermedio = !["aberta", "encerrada"].includes(c.status);
              const teveIntermedio = c.intermediaryUsed;

              const et = (marca: string, titulo: string, sub: string, feita: boolean, atual: boolean, ultima: boolean) => ({
                marca, titulo, sub, ultima,
                borda: feita ? "rgba(78,201,124,.5)" : atual ? "rgba(229,179,79,.6)" : "rgba(216,138,74,.2)",
                fundo: feita ? "rgba(78,201,124,.16)" : atual ? "rgba(229,179,79,.14)" : "rgba(10,6,5,.5)",
                cor: feita ? "#7fd9a2" : atual ? "#f0d194" : "#7d6d64",
                corTitulo: feita || atual ? "#f7eee7" : "#8a7a70",
                linha: ultima ? "transparent" : feita ? "rgba(78,201,124,.35)" : "rgba(216,138,74,.18)",
              });
              const eventTitles: Record<string, string> = { NEGOTIATION_STARTED: "Negociação iniciada", INTERMEDIARY_REQUESTED: "Intermédio solicitado", INTERMEDIARY_ASSIGNED: "Moderador assumiu", VP_ITEM_RECEIVED: "Produto recebido pela VP", VP_PAYMENT_RECEIVED: "Pagamento recebido pela VP", VP_ITEM_DELIVERED: "Produto entregue ao comprador", VP_PAYMENT_DELIVERED: "Pagamento entregue ao vendedor", AWAITING_PARTY_CONFIRMATIONS: "Aguardando confirmação das partes", DIRECT_BUYER_ITEM_CONFIRMED: "Comprador confirmou o produto", DIRECT_SELLER_PAYMENT_CONFIRMED: "Vendedor confirmou o pagamento", BUYER_ITEM_CONFIRMED: "Comprador confirmou o produto", SELLER_PAYMENT_CONFIRMED: "Vendedor confirmou o pagamento", NEGOTIATION_COMPLETED: teveIntermedio ? "Intermédio concluído" : "Negociação direta concluída", NEGOTIATION_CANCELLED: "Negociação encerrada" };
              const etapas = detalhe.events.map((event, index) => et(event.type === "NEGOTIATION_CANCELLED" ? "✕" : "✓", eventTitles[event.type] ?? event.details, `${event.actor} · ${new Date(event.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}`, true, false, index === detalhe.events.length - 1));

              // Ação principal, dirigida pelo status real e pelo papel.
              let rotuloPrincipal: string, subPrincipal: string, fundoPrincipal: string, bordaPrincipal: string, corPrincipal: string, travada = false, aoPrincipal: (() => void) | undefined;
              if (encerrada) {
                rotuloPrincipal = "Negociação encerrada"; subPrincipal = "Este chat foi fechado sem negócio.";
                fundoPrincipal = "rgba(10,6,5,.5)"; bordaPrincipal = "rgba(216,138,74,.2)"; corPrincipal = "#8a7a70"; travada = true;
              } else if (concluida) {
                rotuloPrincipal = "Recebimento confirmado"; subPrincipal = "Anúncio finalizado. Nada mais é necessário dos dois lados.";
                fundoPrincipal = "linear-gradient(180deg,rgba(46,122,80,.65),rgba(24,70,46,.7))"; bordaPrincipal = "rgba(126,217,162,.5)"; corPrincipal = "#dcffe6"; travada = true;
              } else if (souComprador && (c.status === "aberta" || (teveIntermedio && c.vpItemDelivered && c.vpPaymentDelivered)) && !c.buyerProductConfirmed) {
                rotuloPrincipal = "Confirmar produto recebido"; subPrincipal = "Confirme somente quando o produto estiver na sua conta. A negociação termina após o vendedor também confirmar o pagamento.";
                fundoPrincipal = "linear-gradient(180deg,rgba(46,122,80,.7),rgba(24,70,46,.75))"; bordaPrincipal = "rgba(126,217,162,.5)"; corPrincipal = "#dcffe6";
                aoPrincipal = () => void mudarStatus("confirmar-produto");
              } else if (souVendedor && (c.status === "aberta" || (teveIntermedio && c.vpItemDelivered && c.vpPaymentDelivered)) && !c.sellerPaymentConfirmed) {
                rotuloPrincipal = "Confirmar pagamento recebido"; subPrincipal = "Confirme somente quando o pagamento estiver disponível. A negociação termina após o comprador também confirmar o produto.";
                fundoPrincipal = "linear-gradient(180deg,rgba(46,122,80,.7),rgba(24,70,46,.75))"; bordaPrincipal = "rgba(126,217,162,.5)"; corPrincipal = "#dcffe6";
                aoPrincipal = () => void mudarStatus("confirmar-pagamento");
              } else {
                rotuloPrincipal = intermedio ? "Intermédio em andamento" : "Aguardando a outra parte"; subPrincipal = intermedio ? "O moderador da VP controla as etapas de custódia e encerrará o chat após realizar as duas entregas." : c.buyerProductConfirmed ? "O comprador confirmou o produto. Falta o vendedor confirmar o pagamento." : "O vendedor confirmou o pagamento. Falta o comprador confirmar o produto.";
                fundoPrincipal = "rgba(10,6,5,.5)"; bordaPrincipal = "rgba(229,179,79,.34)"; corPrincipal = "#c9a86a"; travada = true;
              }

              const seloInter = teveIntermedio ? (concluida ? "Concluído" : "Solicitado") : "Não utilizado";
              const corSelo = intermedio ? "#f0d194" : "#8a7a70";
              const bordaSelo = intermedio ? "rgba(229,179,79,.4)" : "rgba(216,138,74,.22)";
              const encerrarTravado = encerrada || concluida;

              return (
                <>
                  <div style={{ borderRadius: 12, border: "1px solid rgba(216,138,74,.18)", background: "linear-gradient(180deg,#181110,#100b09)", padding: 15 }}>
                    <div style={{ font: "800 9.5px/1 Inter", letterSpacing: ".16em", textTransform: "uppercase", color: "#e5b34f" }}>Andamento</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 12 }}>
                      {etapas.map((e, i) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "22px minmax(0,1fr)", gap: 10 }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                            <span style={{ width: 20, height: 20, display: "grid", placeItems: "center", borderRadius: "50%", border: `1px solid ${e.borda}`, background: e.fundo, font: "700 9.5px/1 Inter", color: e.cor }}>{e.marca}</span>
                            {!e.ultima && <span style={{ flex: 1, width: 1, background: e.linha }} />}
                          </div>
                          <div style={{ paddingBottom: 12 }}>
                            <div style={{ font: "700 12px/1.2 Inter", color: e.corTitulo }}>{e.titulo}</div>
                            <div style={{ marginTop: 4, fontSize: 11, color: "#8a7a70" }}>{e.sub}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ borderRadius: 12, border: "1px solid rgba(216,138,74,.18)", background: "linear-gradient(180deg,#1c1412,#110b09)", padding: 15 }}>
                    <div style={{ font: "800 9.5px/1 Inter", letterSpacing: ".16em", textTransform: "uppercase", color: "#e5b34f" }}>Ações</div>

                    <button data-h="principal" type="button" onClick={aoPrincipal} disabled={travada} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, width: "100%", marginTop: 12, padding: 13, borderRadius: 9, cursor: travada ? "default" : "pointer", border: `1px solid ${bordaPrincipal}`, background: fundoPrincipal, boxShadow: "inset 0 1px 0 rgba(255,255,255,.1)", font: "700 12.5px/1 Cinzel, serif", letterSpacing: ".1em", textTransform: "uppercase", color: corPrincipal, opacity: travada ? 0.8 : 1 }}>{rotuloPrincipal}</button>
                    <p style={{ margin: "8px 0 0", fontSize: 11, lineHeight: 1.45, color: "#8a7a70" }}>{subPrincipal}</p>

                    <div style={{ marginTop: 13, paddingTop: 12, borderTop: "1px solid rgba(216,138,74,.12)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <span style={{ font: "800 9px/1 Inter", letterSpacing: ".14em", textTransform: "uppercase", color: "#7d6d64" }}>Intermédio da VP</span>
                        <span style={{ padding: "3px 8px", borderRadius: 5, border: `1px solid ${bordaSelo}`, font: "700 8.5px/1 Inter", letterSpacing: ".1em", textTransform: "uppercase", color: corSelo }}>{seloInter}</span>
                      </div>
                      {c.status === "aberta" && !c.buyerProductConfirmed && !c.sellerPaymentConfirmed && (
                        <button data-h="inter" type="button" onClick={() => void mudarStatus("intermedio-solicitado")} style={{ display: "grid", placeItems: "center", width: "100%", marginTop: 9, padding: 11, borderRadius: 9, cursor: "pointer", border: "1px solid rgba(229,179,79,.42)", background: "rgba(229,179,79,.1)", font: "700 11.5px/1 Inter", letterSpacing: ".06em", color: "#f0d194" }}>Solicitar intermédio</button>
                      )}
                      <p style={{ margin: "8px 0 0", fontSize: 11, lineHeight: 1.45, color: "#8a7a70" }}>{intermedio ? "Pedido enviado. Um moderador da VP acompanha a troca no chat." : "Vocês podem fechar direto. Se qualquer um quiser garantia, um moderador da VP acompanha a troca."}</p>
                    </div>

                    <a data-h="discord" href="https://discord.com/invite/9M3HCdytt" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 13, padding: "11px 12px", borderRadius: 9, border: "1px solid rgba(114,137,218,.34)", background: "rgba(24,28,52,.6)", font: "600 12px/1 Inter", color: "#c6cff2" }}>
                      <span style={{ flex: "none", width: 26, height: 26, display: "grid", placeItems: "center", borderRadius: 6, background: "rgba(114,137,218,.18)" }}>
                        <svg viewBox="0 0 127 96" width="17" height="13" fill="#8ea1e1" aria-hidden="true"><path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69Zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5.04 12.69-11.43 12.69Z" /></svg>
                      </span>
                      Discord oficial da VP
                      <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.7 }}>↗</span>
                    </a>

                    <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 13, paddingTop: 12, borderTop: "1px solid rgba(216,138,74,.12)" }}>
                      <button data-h="encerrar" type="button" onClick={() => void mudarStatus("encerrada")} disabled={encerrarTravado} style={{ padding: 10, borderRadius: 8, cursor: encerrarTravado ? "default" : "pointer", border: "1px solid rgba(195,54,41,.3)", background: "rgba(38,12,11,.45)", font: "600 11.5px/1 Inter", color: "#e0a49b", opacity: encerrarTravado ? 0.4 : 1 }}>{concluida ? "Negociação finalizada" : "Encerrar negociação"}</button>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 11, border: "1px solid rgba(216,138,74,.14)", background: "rgba(18,12,10,.8)" }}>
                    <span style={{ flex: "none", width: 6, height: 6, marginTop: 5, borderRadius: "50%", background: "#c33629", boxShadow: "0 0 8px #c33629" }} />
                    <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.5, color: "#8a7a70" }}>Toda a conversa fica registrada aqui. A VP só cobre a negociação quando o <b style={{ color: "#e5b34f", fontWeight: 600 }}>intermédio oficial</b> é solicitado neste chat.</p>
                  </div>
                </>
              );
            })() : (
              <div style={{ borderRadius: 12, border: "1px solid rgba(216,138,74,.18)", background: "linear-gradient(180deg,#181110,#100b09)", padding: 20, fontSize: 12, color: "#8a7a70" }}>Selecione uma conversa para ver o andamento e as ações.</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
