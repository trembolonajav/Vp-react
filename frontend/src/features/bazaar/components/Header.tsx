import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { PlatformHeader } from "../../shared/PlatformHeader";
import { listConversations, markRead } from "../../../services/chatService";
import type { ConversationSummary } from "../../../types/conversation";
import { AvatarCirculo } from "../pages/profileShared";

export function Header() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<ConversationSummary[]>([]);
  const [unread, setUnread] = useState(0);
  const [popPos, setPopPos] = useState<CSSProperties>({});
  const userbar = useRef<HTMLDivElement>(null);
  const active = (path: string) =>
    location.pathname === path || (path !== "/bazaar" && location.pathname.startsWith(path));

  // O subnav da plataforma usa overflow-x:auto, que clipa dropdowns absolutos e cria scroll.
  // Posicionamos os pops com position:fixed (via rect do userbar) para que escapem desse clip.
  const posicionar = () => {
    const r = userbar.current?.getBoundingClientRect();
    if (r) setPopPos({ position: "fixed", top: Math.round(r.bottom + 8), right: Math.max(12, Math.round(window.innerWidth - r.right)) });
  };

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!userbar.current?.contains(event.target as Node)) {
        setMenuOpen(false);
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    let running = false;
    const syncNotifications = () => {
      if (running || document.hidden) return;
      running = true;
      listConversations(controller.signal).then((result) => {
        setNotifications(result.conversations.slice(0, 5));
        setUnread(result.unread);
      })
      .catch(() => undefined)
      .finally(() => { running = false; });
    };
    syncNotifications();
    const timer = window.setInterval(syncNotifications, 1500);
    const refresh = () => { if (!document.hidden) syncNotifications(); };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => { controller.abort(); window.clearInterval(timer); document.removeEventListener("visibilitychange", refresh); window.removeEventListener("focus", refresh); };
  }, [user]);

  const markAllRead = async () => {
    await Promise.all(notifications.filter((item) => item.unread > 0).map((item) => markRead(item.conversation.id)));
    setNotifications((items) => items.map((item) => ({ ...item, unread: 0 })));
    setUnread(0);
  };

  return (
    <PlatformHeader activeArea="bazaar" subnavLabel="Seções do VP Bazaar">
          <div className="bz-subnav-row">
          <div className="nav-links">
            <Link className={`nav-link ${active("/bazaar") ? "active" : ""}`} to="/bazaar">Marketplace</Link>
            <Link className={`nav-link ${active("/bazaar/anunciar") ? "active" : ""}`} to="/bazaar/anunciar">Anunciar</Link>
            {user && (
              <>
                <Link className={`nav-link ${active("/bazaar/meus-anuncios") ? "active" : ""}`} to="/bazaar/meus-anuncios">Meus anúncios</Link>
                <Link className={`nav-link ${active("/bazaar/chat") ? "active" : ""}`} to="/bazaar/chat">Chat</Link>
              </>
            )}
            {user?.role === "ADMIN" && (
              <Link className="nav-link" to="/admin">Painel</Link>
            )}
          </div>
          <div className="header-actions">
            {loading ? (
              <div aria-label="Verificando sessão" aria-busy="true" style={{ width: 190, height: 44, display: "flex", alignItems: "center", gap: 10, padding: "0 13px", boxSizing: "border-box", borderRadius: 12, border: "1px solid rgba(216,138,74,.16)", background: "rgba(20,13,11,.6)" }}>
                <span style={{ width: 30, height: 30, flex: "0 0 30px", borderRadius: "50%", background: "rgba(229,179,79,.12)" }} />
                <span style={{ width: 104, height: 9, borderRadius: 99, background: "rgba(229,179,79,.1)" }} />
              </div>
            ) : user ? (
              <div className="bz-userbar" ref={userbar}>
                <button
                  className="bz-notif-btn"
                  type="button"
                  aria-label="Abrir notificações"
                  aria-expanded={notificationsOpen}
                  onClick={() => { posicionar(); setNotificationsOpen((open) => !open); setMenuOpen(false); }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 8a6 6 0 0 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
                    <path d="M13.7 20a2 2 0 0 1-3.4 0" />
                  </svg>
                  {unread > 0 && <b>{unread > 99 ? "99+" : unread}</b>}
                </button>
                <button className="bz-profile-btn" type="button" aria-expanded={menuOpen} onClick={() => { posicionar(); setMenuOpen((open) => !open); setNotificationsOpen(false); }}>
                  <AvatarCirculo avatar={user.avatar || "inicial"} nick={user.username} size={32} fonte={11} />
                  <span className="bz-profile-id">
                    <b>{user.username}</b>
                    <small>Conta VP Bazaar</small>
                  </span>
                  <b className="bz-profile-caret" aria-hidden="true">{menuOpen ? "▲" : "▾"}</b>
                </button>
                {notificationsOpen && (
                  <div className="bz-user-pop bz-notif-pop" style={popPos}>
                    <div className="bz-notif-title">
                      <span>Notificações</span>
                      <button type="button" onClick={markAllRead} disabled={unread === 0}>Marcar todas como lidas</button>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="bz-notif-empty">Nenhuma notificação por enquanto.</p>
                    ) : notifications.map((item) => {
                      const conversation = item.conversation;
                      const other = user.username === conversation.buyer ? conversation.seller : conversation.buyer;
                      return (
                        <Link className={`bz-notif-item ${item.unread > 0 ? "unread" : ""}`} key={conversation.id} to={`/bazaar/chat?conversation=${encodeURIComponent(conversation.id)}`} onClick={() => setNotificationsOpen(false)}>
                          <span className="bz-notif-art" style={conversation.image ? { backgroundImage: `url("${conversation.image}")` } : undefined}><i>✦</i></span>
                          <span className="bz-notif-copy">
                            <strong>{item.lastMessage ? `Nova mensagem de ${other}` : `${other} abriu uma negociação com você`}</strong>
                            <small>{conversation.title}</small>
                          </span>
                          {item.unread > 0 && <i className="bz-notif-dot" />}
                        </Link>
                      );
                    })}
                    <Link className="bz-pop-all" to="/bazaar/chat" onClick={() => setNotificationsOpen(false)}>Ver todas as notificações →</Link>
                  </div>
                )}
                {menuOpen && (
                  <div className="bz-user-pop bz-profile-pop" style={popPos}>
                    <div className="bz-pop-identity">
                      <AvatarCirculo avatar={user.avatar || "inicial"} nick={user.username} size={42} fonte={15} />
                      <span><strong>{user.username}</strong><small>Conta VP Bazaar</small></span>
                    </div>
                    <Link to="/bazaar/meus-anuncios" onClick={() => setMenuOpen(false)}><span>◆</span>Meus anúncios</Link>
                    <Link to="/bazaar/chat" onClick={() => setMenuOpen(false)}><span>✉</span>Minhas conversas{unread > 0 && <b>{unread}</b>}</Link>
                    <Link to="/bazaar/conta" onClick={() => setMenuOpen(false)}><span>≡</span>Minha conta</Link>
                    <Link to="/bazaar/perfil" onClick={() => setMenuOpen(false)}><span>◎</span>Ver meu perfil público</Link>
                    <button type="button" onClick={() => { setMenuOpen(false); logout(); }}><span>→</span>Sair da conta</button>
                  </div>
                )}
              </div>
            ) : (
              <Link className="bz-conta-entrar" to="/bazaar/login" aria-label="Login ou cadastro">Entrar</Link>
            )}
          </div>
          </div>
    </PlatformHeader>
  );
}
