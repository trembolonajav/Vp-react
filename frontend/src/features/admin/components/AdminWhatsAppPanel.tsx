import { useCallback, useEffect, useState } from "react";
import { configureWhatsAppGroup, connectWhatsApp, disconnectWhatsApp, getWhatsAppGroups, getWhatsAppStatus, testWhatsApp, type WhatsAppGroup, type WhatsAppStatus } from "../../../services/adminModerationService";

const LABEL: Record<string, string> = { connected: "Conectado", qr: "Aguardando leitura do QR", connecting: "Conectando", reconnecting: "Reconectando", disconnected: "Desconectado", starting: "Iniciando" };

export function AdminWhatsAppPanel() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => { try { setStatus(await getWhatsAppStatus()); } catch (err) { setMessage((err as Error).message); } }, []);
  useEffect(() => { void refresh(); const timer = window.setInterval(() => void refresh(), 3000); return () => clearInterval(timer); }, [refresh]);
  useEffect(() => { if (status?.status === "connected") getWhatsAppGroups().then(setGroups).catch(() => setGroups([])); }, [status?.status]);
  const action = async (fn: () => Promise<unknown>, ok: string) => { setBusy(true); setMessage(""); try { await fn(); setMessage(ok); await refresh(); } catch (err) { setMessage((err as Error).message); } finally { setBusy(false); } };
  return <section className="admin-section admin-whatsapp">
    <div className="admin-section-head"><div><span className="admin-intermediary-kicker">Integração interna</span><h2 className="an-block-title">WhatsApp conectado</h2></div><span className={`wa-state wa-${status?.status ?? "offline"}`}><i/>{LABEL[status?.status ?? ""] ?? "Indisponível"}</span></div>
    <div className="wa-grid"><div className="wa-connect-card">
      {status?.qr ? <><img className="wa-qr" src={status.qr} alt="QR Code para conectar o WhatsApp"/><strong>Escaneie em Aparelhos conectados</strong><p>WhatsApp → Configurações → Aparelhos conectados → Conectar aparelho</p></> : <><div className="wa-phone">{status?.status === "connected" ? "✓" : "⌁"}</div><strong>{status?.phone ? `+${status.phone}` : "Nenhum aparelho conectado"}</strong><p>A sessão fica salva no volume privado do serviço.</p></>}
      {status?.status === "connected" ? <button disabled={busy} onClick={() => void action(disconnectWhatsApp,"WhatsApp desconectado.")}>Desconectar</button> : <button disabled={busy} onClick={() => void action(connectWhatsApp,"QR gerado. Escaneie com o celular.")}>Gerar novo QR Code</button>}
    </div><div className="wa-settings">
      <label>Grupo que receberá os alertas<select className="bz-select" value={status?.groupJid ?? ""} disabled={status?.status !== "connected"} onChange={(e) => void action(() => configureWhatsAppGroup(e.target.value),"Grupo de alertas salvo.")}><option value="">Selecione um grupo</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name} ({group.size})</option>)}</select></label>
      <div className="wa-alert-row"><span>Intermédio solicitado</span><b>Ativo</b></div><p>Ao solicitar intermédio no chat, o sistema registra a fila administrativa e envia um alerta ao grupo escolhido.</p>
      <button className="bz-clear" disabled={busy || status?.status !== "connected" || !status.groupJid} onClick={() => void action(testWhatsApp,"Mensagem de teste enviada.")}>Enviar alerta de teste</button>{message && <p className="wa-message">{message}</p>}
    </div></div>
  </section>;
}
