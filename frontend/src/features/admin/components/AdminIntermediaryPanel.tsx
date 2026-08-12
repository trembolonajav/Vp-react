import { useEffect, useState } from "react";
import { getAdminConversation, listAdminConversations } from "../../../services/adminModerationService";
import type { ConversationDetail, ConversationSummary } from "../../../types/conversation";

const data = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export function AdminIntermediaryPanel() {
  const [items, setItems] = useState<ConversationSummary[]>([]);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    listAdminConversations("intermedio-solicitado", controller.signal)
      .then((result) => setItems(result.conversations))
      .catch((err: Error) => { if (err.name !== "AbortError") setError(err.message); });
    return () => controller.abort();
  }, []);

  const abrir = async (id: string) => {
    try {
      setError(null);
      setDetail(await getAdminConversation(id));
    } catch (err) {
      setError((err as Error).message);
    }
  };

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
            {!detail ? <p>Selecione uma solicitação para visualizar o chat.</p> : (
              <>
                <header><strong>{detail.conversation.title}</strong><span>{detail.conversation.buyer} ↔ {detail.conversation.seller}</span></header>
                <div className="admin-intermediary-messages">
                  {detail.messages.map((message) => (
                    <div key={message.id}><b>{message.author}</b><p>{message.text}</p><time>{data(message.createdAt)}</time></div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
