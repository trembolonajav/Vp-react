import { useAdminCfg } from "./AdminConfigContext";

// Porte fiel dos ajustes do Bazaar (sem o editor de anúncios — anúncios são
// entidades do banco e vivem na aba "Anúncios" da moderação).

const lista = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean);

export function AdminBazaarPanel() {
  const { cfg, patchBazaar } = useAdminCfg();
  if (!cfg) return null;
  const bz = cfg.bazaar;

  return (
    <div className="admin-cfg">
      <div className="a-card">
        <div className="a-title" style={{ marginBottom: 14 }}>Configuração do marketplace</div>
        <label className="a-check" style={{ marginBottom: 14 }}>
          <input type="checkbox" checked={bz.ativo} onChange={(e) => patchBazaar({ ativo: e.target.checked })} /> Bazaar visível para os visitantes
        </label>
        <div className="a-row">
          <div className="a-field"><label>Servidores (separados por vírgula)</label>
            <input value={bz.servidores.join(", ")} onChange={(e) => patchBazaar({ servidores: lista(e.target.value) })} placeholder="Phoenix, Genesis, Aurora" /></div>
          <div className="a-field"><label>Categorias (separadas por vírgula)</label>
            <input value={bz.categorias.join(", ")} onChange={(e) => patchBazaar({ categorias: lista(e.target.value) })} placeholder="Pokémon, Itens, Diamonds" /></div>
        </div>
        <div className="a-row single">
          <div className="a-field"><label>Mensagem do botão "Tenho interesse"</label>
            <textarea value={bz.msgInteresse} onChange={(e) => patchBazaar({ msgInteresse: e.target.value })} placeholder="Olá! Tenho interesse no anúncio {titulo} (#{id})." />
            <div className="sub">Use {"{titulo}"} e {"{id}"} — são trocados pelo anúncio clicado.</div></div>
        </div>
        <div className="a-row single">
          <div className="a-field"><label>Mensagem do botão "Anunciar"</label>
            <textarea value={bz.msgAnunciar} onChange={(e) => patchBazaar({ msgAnunciar: e.target.value })} placeholder="Olá! Quero anunciar um item no marketplace." /></div>
        </div>
        <p className="sub" style={{ margin: 0 }}>Servidores e categorias removidos daqui somem do filtro e são limpos dos anúncios que os usavam ao salvar.</p>
      </div>
    </div>
  );
}
