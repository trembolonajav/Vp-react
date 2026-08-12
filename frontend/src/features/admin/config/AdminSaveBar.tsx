import { useRef } from "react";
import { useAdminCfg } from "./AdminConfigContext";

// Rodapé fixo do editor de configuração: Salvar e publicar + Backup / Importar /
// Restaurar. Fiel ao painel antigo; o toast e o estado "não salvo" vêm do contexto.

export function AdminSaveBar() {
  const { dirty, busy, toast, save, backup, importFile, reload } = useAdminCfg();
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div className="admin-savebar">
        <button className="a-btn primary" disabled={busy} onClick={() => void save()}>
          {busy ? "Publicando…" : "Salvar e publicar"}
        </button>
        <span className={`dirty ${dirty ? "" : "saved"}`}>{dirty ? "● Alterações não salvas" : "✓ Tudo salvo"}</span>
        <span className="spacer" />
        <button className="a-btn small" onClick={backup}>Backup</button>
        <button className="a-btn small" onClick={() => fileRef.current?.click()}>Importar</button>
        <button className="a-btn small danger" onClick={() => { if (window.confirm("Descartar alterações e recarregar a configuração salva no servidor?")) reload(); }}>Restaurar</button>
        <input ref={fileRef} type="file" accept="application/json" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile(f); e.target.value = ""; }} />
      </div>
      {toast && <div className={`admin-cfg-toast ${toast.kind}`}>{toast.msg}</div>}
    </>
  );
}
