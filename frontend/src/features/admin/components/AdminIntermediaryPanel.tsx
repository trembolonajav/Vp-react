import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { adminSendMessage, getAdminConversation, listAdminConversations, setAdminConversationStatus } from "../../../services/adminModerationService";
import type { ConversationDetail, ConversationSummary } from "../../../types/conversation";

const data = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export function AdminIntermediaryPanel() {
  const { user } = useAuth();
  const [items, setItems] = useState<ConversationSummary[]>([]);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let running = false;
    const sync = async () => {
      if (running || document.hidden) return;
      running = true;
      try {
        const result = await listAdminConversations("todas", controller.signal);
        setItems(result.conversations.filter(({ conversation }) => !["aberta", "concluida", "encerrada"].includes(conversation.status)));
        if (detail) setDetail(await getAdminConversation(detail.conversation.id, controller.signal));
      } catch (err) { if ((err as Error).name !== "AbortError") setError((err as Error).message); }
      finally { running = false; }
    };
    void sync();
    const timer = window.setInterval(() => void sync(), 1500);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [detail?.conversation.id]);

  const abrir = async (id: string) => {
    try { setError(null); setDetail(await getAdminConversation(id)); }
    catch (err) { setError((err as Error).message); }
  };

  const enviar = async (msg: string) => {
    if (!detail || !msg.trim()) return;
    setEnviando(true); setError(null);
    try {
      await adminSendMessage(detail.conversation.id, msg.trim());
      setDetail(await getAdminConversation(detail.conversation.id));
      setTexto("");
    } catch (err) { setError((err as Error).message); }
    finally { setEnviando(false); }
  };

  const avancar = async (status: string) => {
    if (!detail) return;
    setEnviando(true); setError(null);
    try {
      await setAdminConversationStatus(detail.conversation.id, status);
      setDetail(await getAdminConversation(detail.conversation.id));
      const result = await listAdminConversations("todas");
      setItems(result.conversations.filter(({ conversation }) => !["aberta", "concluida", "encerrada"].includes(conversation.status)));
      if (["concluida", "encerrada"].includes(status)) setDetail(null);
    } catch (err) { setError((err as Error).message); }
    finally { setEnviando(false); }
  };

  // o moderador já "assumiu" se houver alguma mensagem dele (autor = admin logado) no chat
  const assumido = !!detail && detail.conversation.status !== "intermedio-solicitado";

  return (
    <section className="admin-section admin-intermediary">
      <div className="admin-section-head">
        <div>
          <span className="admin-intermediary-kicker">Central de atendimento</span>
          <h2 className="an-block-title">Intermédios solicitados</h2>
        </div>
        <span className="admin-intermediary-count">{items.length} aguardando</span>
      </div>
      {error && <p className="bz-form-error">{error}</p>}
      {items.length === 0 ? (
        <div className="bz-empty"><strong>Nenhum intermédio aguardando</strong><p>As solicitações feitas nos chats aparecem aqui.</p></div>
      ) : (
        <div className="admin-intermediary-grid">
          <div className="admin-intermediary-list">
            {items.map(({ conversation, lastMessage }) => (
              <button type="button" key={conversation.id} className={`admin-intermediary-item ${detail?.conversation.id === conversation.id ? "active" : ""}`} onClick={() => void abrir(conversation.id)}>
                <span className="admin-intermediary-alert">Intermédio solicitado</span>
                <strong>{conversation.title}</strong>
                <small>{conversation.buyer} ↔ {conversation.seller}</small>
                <small>{lastMessage?.text ?? "Conversa sem mensagens"}</small>
                <time>{data(conversation.updatedAt)}</time>
              </button>
            ))}
          </div>
          <div className="admin-intermediary-chat">
            {!detail ? <p>Selecione uma solicitação para acompanhar e intermediar o chat.</p> : (
              <>
                <header>
                  <strong>{detail.conversation.title}</strong>
                  <span>{detail.conversation.buyer} ↔ {detail.conversation.seller}</span>
                </header>
                <div className="admin-intermediary-messages">
                  {detail.messages.map((message) => {
                    const meu = !!user && message.author === user.username;
                    return (
                      <div key={message.id} style={meu ? { borderLeft: "3px solid #c33629", paddingLeft: 9 } : undefined}>
                        <b style={meu ? { color: "#f0b0a2" } : undefined}>{meu ? `VP · ${message.author}` : message.author}</b>
                        <p>{message.text}</p><time>{data(message.createdAt)}</time>
                      </div>
                    );
                  })}
                  {detail.messages.length === 0 && <p style={{ color: "#8a7a70", fontSize: 12 }}>Ainda sem mensagens nesta conversa.</p>}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(229,179,79,.16)" }}>
                  {detail?.conversation.status === "intermedio-solicitado" && <button type="button" disabled={enviando} onClick={() => void avancar("intermedio-assumido")} style={actionStyle}>🛡️ Assumir intermédio</button>}
                  {detail?.conversation.status === "intermedio-assumido" && <>
                    <strong style={{ color: "#f0d194", fontSize: 11 }}>Recebimentos em custódia</strong>
                    <button type="button" disabled={enviando || detail.conversation.vpItemReceived} onClick={() => void avancar("vp-produto-recebido")} style={actionStyle}>{detail.conversation.vpItemReceived ? "✓ Produto recebido do vendedor" : "📦 Confirmar produto recebido do vendedor"}</button>
                    <button type="button" disabled={enviando || detail.conversation.vpPaymentReceived} onClick={() => void avancar("vp-pagamento-recebido")} style={actionStyle}>{detail.conversation.vpPaymentReceived ? "✓ Pagamento recebido do comprador" : "💰 Confirmar pagamento recebido do comprador"}</button>
                    {detail.conversation.vpItemReceived && detail.conversation.vpPaymentReceived && <>
                      <strong style={{ color: "#f0d194", fontSize: 11, marginTop: 5 }}>Entregas às partes</strong>
                      <button type="button" disabled={enviando || detail.conversation.vpItemDelivered} onClick={() => void avancar("vp-produto-entregue")} style={actionStyle}>{detail.conversation.vpItemDelivered ? "✓ Produto entregue ao comprador" : "📤 Confirmar produto entregue ao comprador"}</button>
                      <button type="button" disabled={enviando || detail.conversation.vpPaymentDelivered} onClick={() => void avancar("vp-pagamento-entregue")} style={actionStyle}>{detail.conversation.vpPaymentDelivered ? "✓ Pagamento entregue ao vendedor" : "📤 Confirmar pagamento entregue ao vendedor"}</button>
                    </>}
                  </>}
                  {assumido && <button type="button" disabled={enviando} onClick={() => void avancar("encerrada")} style={{ alignSelf: "flex-start", padding: "8px 13px", borderRadius: 8, cursor: "pointer", border: "1px solid rgba(195,54,41,.35)", background: "rgba(38,12,11,.45)", color: "#e0a49b" }}>Encerrar sem conclusão</button>}
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                    <textarea value={texto} onChange={(e) => setTexto(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void enviar(texto); } }}
                      placeholder="Escreva como moderador da VP…" rows={2}
                      style={{ flex: 1, resize: "vertical", padding: "10px 12px", borderRadius: 9, border: "1px solid rgba(216,138,74,.22)", background: "#0b0706", color: "#f7eee7", font: "400 13px/1.4 Inter", boxSizing: "border-box" }} />
                    <button type="button" disabled={enviando || !texto.trim()} onClick={() => void enviar(texto)}
                      style={{ flex: "none", padding: "10px 16px", borderRadius: 9, cursor: enviando || !texto.trim() ? "not-allowed" : "pointer", border: "1px solid rgba(229,179,79,.45)", background: "linear-gradient(180deg,#241813,#160f0c)", font: "700 11.5px/1 Inter", letterSpacing: ".06em", textTransform: "uppercase", color: "#e5b34f", opacity: enviando || !texto.trim() ? 0.55 : 1 }}>
                      Enviar
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

const actionStyle: CSSProperties = { alignSelf: "stretch", padding: "9px 15px", borderRadius: 8, cursor: "pointer", border: "1px solid rgba(126,217,162,.5)", background: "linear-gradient(180deg,rgba(46,122,80,.75),rgba(24,70,46,.8))", font: "700 11.5px/1 Inter", color: "#dcffe6", textAlign: "left" };
