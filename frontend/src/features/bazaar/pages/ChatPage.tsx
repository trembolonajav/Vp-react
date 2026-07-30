import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getConversation,
  listConversations,
  markRead,
  sendMessage,
  setStatus,
} from "../../../services/chatService";
import { useAuth } from "../../../contexts/AuthContext";
import { CONVERSATION_STATUS } from "../../../types/conversation";
import type { ConversationDetail, ConversationSummary } from "../../../types/conversation";

const STATUS_OPCOES = Object.keys(CONVERSATION_STATUS);

export function ChatPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [conversas, setConversas] = useState<ConversationSummary[]>([]);
  const [ativa, setAtiva] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<ConversationDetail | null>(null);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);

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
  }, []);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!ativa || !texto.trim()) return;
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

  const outro = (c: ConversationSummary["conversation"]) =>
    user?.username === c.buyer ? c.seller : c.buyer;

  return (
    <main className="page">
      <div className="container">
        <h1 className="bz-form-title" style={{ margin: "24px 0 16px" }}>Conversas</h1>
        {error && <p className="bz-form-error">{error}</p>}

        <div className="chat-grid">
          <aside className="chat-list">
            {conversas.length === 0 ? (
              <p className="chat-vazio">Nenhuma conversa ainda.</p>
            ) : (
              conversas.map((c) => (
                <button
                  key={c.conversation.id}
                  type="button"
                  className={`chat-item ${ativa === c.conversation.id ? "on" : ""}`}
                  onClick={() => abrir(c.conversation.id)}
                >
                  <div className="chat-item-top">
                    <strong>{outro(c.conversation)}</strong>
                    {c.unread > 0 && <span className="chat-badge">{c.unread}</span>}
                  </div>
                  <span className="chat-item-title">{c.conversation.title || "Anúncio"}</span>
                  {c.lastMessage && <span className="chat-item-last">{c.lastMessage.text}</span>}
                </button>
              ))
            )}
          </aside>

          <section className="chat-panel">
            {!detalhe ? (
              <div className="chat-empty">Selecione uma conversa.</div>
            ) : (
              <>
                <div className="chat-head">
                  <div>
                    <strong>{outro(detalhe.conversation)}</strong>
                    <span className="chat-head-sub">{detalhe.conversation.title}</span>
                  </div>
                  <select
                    className="bz-select chat-status"
                    value={detalhe.conversation.status}
                    onChange={(e) => mudarStatus(e.target.value)}
                  >
                    {STATUS_OPCOES.map((s) => (
                      <option key={s} value={s}>
                        {CONVERSATION_STATUS[s]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="chat-msgs">
                  {detalhe.messages.map((m) => (
                    <div key={m.id} className={`chat-msg ${m.authorId === user?.id ? "meu" : ""}`}>
                      <span className="chat-msg-autor">{m.author}</span>
                      <p>{m.text}</p>
                    </div>
                  ))}
                  {detalhe.messages.length === 0 && (
                    <p className="chat-vazio">Envie a primeira mensagem.</p>
                  )}
                </div>

                <form className="chat-send" onSubmit={enviar}>
                  <input
                    className="bz-input"
                    value={texto}
                    placeholder="Escreva uma mensagem…"
                    maxLength={1000}
                    onChange={(e) => setTexto(e.target.value)}
                  />
                  <button className="bz-submit chat-send-btn" type="submit" disabled={!texto.trim()}>
                    Enviar
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
