import { useAdminCfg } from "./AdminConfigContext";
import type { Game } from "../../../types/config";

// Porte fiel da aba "Jogos e preços" + WhatsApp da loja do painel antigo.

const novoGame = (): Game => ({
  id: "jogo-" + Date.now(), nome: "", item: "", unidade: "", botao: "",
  img: "/assets/logo-vp-store-quadrada.webp", icone: "/assets/diamante-pokeidle-oficial.png",
  precoCompra: 0, precoVenda: 0, min: 1, max: 1000, ativo: false,
});

export function AdminStorePanel() {
  const { cfg, patch, patchItem, moveItem, removeItem, addItem, pickImage } = useAdminCfg();
  if (!cfg) return null;

  return (
    <div className="admin-cfg">
      <div className="a-card">
        <div className="a-title" style={{ marginBottom: 14 }}>WhatsApp da loja</div>
        <div className="a-row">
          <div className="a-field">
            <label>Número (só dígitos, com país e DDD)</label>
            <input value={cfg.whatsapp} onChange={(e) => patch({ whatsapp: e.target.value.replace(/\D/g, "") })} placeholder="5547988930280" />
            <div className="sub">Formato: 55 + DDD + número. Ex.: 5547988930280.</div>
          </div>
        </div>
        <div className="a-row single">
          <div className="a-field">
            <label>Mensagem do botão "Negociar" (topo do site)</label>
            <textarea value={cfg.msgNegociar} onChange={(e) => patch({ msgNegociar: e.target.value })} />
            <div className="sub">É a mensagem que chega pronta no seu WhatsApp quando clicam em Negociar.</div>
          </div>
        </div>
      </div>

      {cfg.games.map((g, i) => (
        <div key={i} className={`a-card ${g.ativo ? "" : "disabled"}`}>
          <div className="a-card-head">
            <img className="a-thumb square" src={g.img} alt="" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="a-title">{g.nome || "Novo jogo"}</div>
              <label className="a-check" style={{ marginTop: 6 }}>
                <input type="checkbox" checked={g.ativo} onChange={(e) => patchItem("games", i, { ativo: e.target.checked })} /> Visível na loja
              </label>
            </div>
            <div className="order">
              <button className="mini-btn" title="Mover para cima" disabled={i === 0} onClick={() => moveItem("games", i, -1)}>↑</button>
              <button className="mini-btn" title="Mover para baixo" disabled={i === cfg.games.length - 1} onClick={() => moveItem("games", i, 1)}>↓</button>
            </div>
          </div>

          <div className="a-row">
            <div className="a-field"><label>Nome do jogo</label>
              <input value={g.nome} onChange={(e) => patchItem("games", i, { nome: e.target.value })} placeholder="Ex.: PokeIdle World" /></div>
            <div className="a-field"><label>Texto do botão do card</label>
              <input value={g.botao} onChange={(e) => patchItem("games", i, { botao: e.target.value })} placeholder="Ex.: [PokeIdle] Diamonds" /></div>
          </div>
          <div className="a-row">
            <div className="a-field"><label>Item negociado (plural)</label>
              <input value={g.item} onChange={(e) => patchItem("games", i, { item: e.target.value })} placeholder="Ex.: Diamonds" /></div>
            <div className="a-field"><label>Item no singular</label>
              <input value={g.unidade} onChange={(e) => patchItem("games", i, { unidade: e.target.value })} placeholder="Ex.: diamante" />
              <div className="sub">Usado na cotação: "1 diamante = R$ 0,30".</div></div>
          </div>
          <div className="a-row">
            <div className="a-field"><label>Preço de COMPRA — cliente paga (R$)</label>
              <input type="number" step="0.01" min="0" value={g.precoCompra} onChange={(e) => patchItem("games", i, { precoCompra: Number(e.target.value) || 0 })} /></div>
            <div className="a-field"><label>Preço de VENDA — cliente recebe (R$)</label>
              <input type="number" step="0.01" min="0" value={g.precoVenda} onChange={(e) => patchItem("games", i, { precoVenda: Number(e.target.value) || 0 })} /></div>
          </div>
          <div className="a-row">
            <div className="a-field"><label>Quantidade mínima</label>
              <input type="number" step="1" min="1" value={g.min} onChange={(e) => patchItem("games", i, { min: Number(e.target.value) || 0 })} /></div>
            <div className="a-field"><label>Quantidade máxima</label>
              <input type="number" step="1" min="1" value={g.max} onChange={(e) => patchItem("games", i, { max: Number(e.target.value) || 0 })} /></div>
          </div>

          <div className="a-card-actions">
            <button className="a-btn small" onClick={() => pickImage((url) => patchItem("games", i, { img: url }))}>Trocar arte do card</button>
            <button className="a-btn small" onClick={() => pickImage((url) => patchItem("games", i, { icone: url }))}>Trocar imagem do item</button>
            <img className="a-thumb icon-p" src={g.icone} alt="" title="Imagem do item (página de negociação)" />
            <span className="spacer" />
            <button className="a-btn small danger" onClick={() => { if (window.confirm(`Remover o jogo "${g.nome}"?`)) removeItem("games", i); }}>Remover jogo</button>
          </div>
        </div>
      ))}

      <button className="a-btn a-add" onClick={() => addItem("games", novoGame())}>+ Adicionar jogo</button>
    </div>
  );
}
