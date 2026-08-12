import { useAdminCfg } from "./AdminConfigContext";
import { Icon } from "../../shared/Icon";

// Porte fiel das abas "Banners" e "Contatos" do painel antigo.

const ICONES = ["instagram", "youtube", "twitch", "whatsapp", "tiktok", "discord", "x", "telegram", "facebook", "kick", "email", "site"];
const NOME_ICONE: Record<string, string> = {
  instagram: "Instagram", youtube: "YouTube", twitch: "Twitch", whatsapp: "WhatsApp", tiktok: "TikTok",
  discord: "Discord", x: "X (Twitter)", telegram: "Telegram", facebook: "Facebook", kick: "Kick", email: "E-mail", site: "Site / outro",
};

export function AdminHubPanel() {
  const { cfg, patchItem, moveItem, removeItem, addItem, pickImage } = useAdminCfg();
  if (!cfg) return null;

  return (
    <div className="admin-cfg">
      <div className="a-title" style={{ font: "800 10.5px/1 Inter", letterSpacing: ".16em", textTransform: "uppercase", color: "#c33629" }}>Banners do carrossel</div>

      {cfg.banners.map((b, i) => (
        <div key={i} className="a-card">
          <div className="a-card-head">
            <img className="a-thumb banner" src={b.img} alt="" />
            <div className="a-title">Banner {i + 1}</div>
            <div className="order">
              <button className="mini-btn" title="Mover para cima" disabled={i === 0} onClick={() => moveItem("banners", i, -1)}>↑</button>
              <button className="mini-btn" title="Mover para baixo" disabled={i === cfg.banners.length - 1} onClick={() => moveItem("banners", i, 1)}>↓</button>
            </div>
          </div>
          <div className="a-row">
            <div className="a-field"><label>Descrição (texto alternativo)</label>
              <input value={b.alt} onChange={(e) => patchItem("banners", i, { alt: e.target.value })} placeholder="Ex.: Sorteio semanal de 50 diamantes" /></div>
            <div className="a-field"><label>Link ao clicar</label>
              <input value={b.link} onChange={(e) => patchItem("banners", i, { link: e.target.value })} placeholder="https://… ou /comunidade" />
              <div className="sub">Pode ser um endereço externo ou uma página do site.</div></div>
          </div>
          <div className="a-card-actions">
            <button className="a-btn small" onClick={() => pickImage((url) => patchItem("banners", i, { img: url }))}>Trocar imagem</button>
            <button className="a-btn small danger" onClick={() => { if (window.confirm("Remover este banner?")) removeItem("banners", i); }}>Remover banner</button>
          </div>
        </div>
      ))}
      <button className="a-btn a-add" onClick={() => pickImage((url) => addItem("banners", { img: url, alt: "", link: "" }))}>+ Adicionar banner</button>

      <div className="a-title" style={{ marginTop: 8, font: "800 10.5px/1 Inter", letterSpacing: ".16em", textTransform: "uppercase", color: "#c33629" }}>Contatos da comunidade</div>

      {cfg.contatos.map((c, i) => (
        <div key={i} className="a-card">
          <div className="a-card-head">
            <span className="prev-box"><Icon name={c.icone} /></span>
            <div className="a-title">{c.nome || "Novo contato"}</div>
            <div className="order">
              <button className="mini-btn" title="Mover para cima" disabled={i === 0} onClick={() => moveItem("contatos", i, -1)}>↑</button>
              <button className="mini-btn" title="Mover para baixo" disabled={i === cfg.contatos.length - 1} onClick={() => moveItem("contatos", i, 1)}>↓</button>
            </div>
          </div>
          <div className="a-row three">
            <div className="a-field"><label>Ícone</label>
              <select value={c.icone} onChange={(e) => patchItem("contatos", i, { icone: e.target.value })}>
                {ICONES.map((ic) => <option key={ic} value={ic}>{NOME_ICONE[ic]}</option>)}
              </select></div>
            <div className="a-field"><label>Nome da rede</label>
              <input value={c.nome} onChange={(e) => patchItem("contatos", i, { nome: e.target.value })} placeholder="Ex.: Instagram" /></div>
            <div className="a-field"><label>Texto de apoio (@, descrição)</label>
              <input value={c.info} onChange={(e) => patchItem("contatos", i, { info: e.target.value })} placeholder="Ex.: @vperts_ot" /></div>
          </div>
          <div className="a-row single">
            <div className="a-field"><label>Link</label>
              <input type="url" value={c.url} onChange={(e) => patchItem("contatos", i, { url: e.target.value })} placeholder="https://…" />
              <div className="sub">Deixe vazio para abrir o WhatsApp da loja.</div></div>
          </div>
          <div className="a-card-actions">
            <button className="a-btn small danger" onClick={() => { if (window.confirm(`Remover "${c.nome}"?`)) removeItem("contatos", i); }}>Remover contato</button>
          </div>
        </div>
      ))}
      <button className="a-btn a-add" onClick={() => addItem("contatos", { icone: "site", nome: "", info: "", url: "" })}>+ Adicionar contato</button>
    </div>
  );
}
