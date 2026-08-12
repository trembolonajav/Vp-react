import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { getConfig, saveConfig } from "../../../services/configService";
import { uploadImage } from "../../../services/mediaService";
import { ApiError } from "../../../services/api";
import type { AdminConfigRequest, Banner, Contact, Game, SiteConfig } from "../../../types/config";
import "../../../styles/admin-config.css";

// Porte fiel do painel antigo (apps/vpertz-store/public/admin.js): uma única `cfg`
// compartilhada por todas as abas de configuração, um "Salvar e publicar" que
// persiste tudo, e Backup/Importar/Restaurar. O upload usa o mediaService atual.

type Listable = "games" | "banners" | "contatos";
type ItemOf<K extends Listable> = K extends "games" ? Game : K extends "banners" ? Banner : Contact;

interface Toast { msg: string; kind: "ok" | "err" }

interface AdminCfg {
  cfg: SiteConfig | null;
  dirty: boolean;
  busy: boolean;
  toast: Toast | null;
  erro: string | null;
  setToast: (t: Toast | null) => void;
  patch: (change: Partial<SiteConfig>) => void;
  patchBazaar: (change: Partial<SiteConfig["bazaar"]>) => void;
  patchItem: <K extends Listable>(key: K, index: number, change: Partial<ItemOf<K>>) => void;
  moveItem: (key: Listable, index: number, delta: number) => void;
  removeItem: (key: Listable, index: number) => void;
  addItem: <K extends Listable>(key: K, item: ItemOf<K>) => void;
  pickImage: (onUrl: (url: string) => void) => void;
  save: () => Promise<void>;
  backup: () => void;
  importFile: (file: File) => void;
  reload: () => void;
}

const Ctx = createContext<AdminCfg | null>(null);
// eslint-disable-next-line react-refresh/only-export-components
export const useAdminCfg = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAdminCfg fora do AdminConfigProvider");
  return v;
};

function toRequest(cfg: SiteConfig): AdminConfigRequest {
  return {
    whatsapp: cfg.whatsapp,
    msgNegociar: cfg.msgNegociar,
    banners: cfg.banners,
    games: cfg.games,
    bazaar: {
      ativo: cfg.bazaar.ativo,
      msgInteresse: cfg.bazaar.msgInteresse,
      msgAnunciar: cfg.bazaar.msgAnunciar,
      servidores: cfg.bazaar.servidores,
      categorias: cfg.bazaar.categorias,
    },
    contatos: cfg.contatos,
  };
}

export function AdminConfigProvider({ children }: { children: ReactNode }) {
  const [cfg, setCfg] = useState<SiteConfig | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const flash = (msg: string, kind: "ok" | "err" = "ok") => {
    setToast({ msg, kind });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 3800);
  };

  const carregar = (signal?: AbortSignal) =>
    getConfig(signal).then((c) => { setCfg(c); setDirty(false); }).catch((e: Error) => {
      if (e.name !== "AbortError") setErro(e.message);
    });

  useEffect(() => {
    const controller = new AbortController();
    void carregar(controller.signal);
    return () => controller.abort();
  }, []);

  // aviso ao sair com alterações não salvas (igual ao painel antigo)
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const patch: AdminCfg["patch"] = (change) => { setCfg((c) => c ? { ...c, ...change } : c); setDirty(true); };
  const patchBazaar: AdminCfg["patchBazaar"] = (change) =>
    setCfg((c) => { if (!c) return c; setDirty(true); return { ...c, bazaar: { ...c.bazaar, ...change } }; });

  const patchItem: AdminCfg["patchItem"] = (key, index, change) =>
    setCfg((c) => {
      if (!c) return c;
      setDirty(true);
      const arr = (c[key] as unknown[]).map((it, i) => i === index ? { ...(it as object), ...change } : it);
      return { ...c, [key]: arr };
    });

  const moveItem: AdminCfg["moveItem"] = (key, index, delta) =>
    setCfg((c) => {
      if (!c) return c;
      const arr = [...(c[key] as unknown[])];
      const j = index + delta;
      if (j < 0 || j >= arr.length) return c;
      [arr[index], arr[j]] = [arr[j], arr[index]];
      setDirty(true);
      return { ...c, [key]: arr };
    });

  const removeItem: AdminCfg["removeItem"] = (key, index) =>
    setCfg((c) => {
      if (!c) return c;
      setDirty(true);
      return { ...c, [key]: (c[key] as unknown[]).filter((_, i) => i !== index) };
    });

  const addItem: AdminCfg["addItem"] = (key, item) =>
    setCfg((c) => { if (!c) return c; setDirty(true); return { ...c, [key]: [...(c[key] as unknown[]), item] }; });

  const pickImage: AdminCfg["pickImage"] = (onUrl) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > 2.5 * 1024 * 1024) { flash("Imagem muito pesada (máx. 2,5MB). Comprima antes — WebP é o ideal.", "err"); return; }
      flash("Enviando imagem…");
      try { onUrl(await uploadImage(file)); flash("Imagem enviada."); }
      catch (e) { flash(e instanceof ApiError ? e.message : "Falha no envio da imagem.", "err"); }
    };
    input.click();
  };

  const save: AdminCfg["save"] = async () => {
    if (!cfg) return;
    setBusy(true); setErro(null);
    try {
      const salvo = await saveConfig(toRequest(cfg));
      setCfg(salvo); setDirty(false);
      flash("Publicado! A atualização pode levar até 1 minuto para todos.");
    } catch (e) { flash(e instanceof ApiError ? e.message : "Não foi possível salvar.", "err"); }
    finally { setBusy(false); }
  };

  const backup: AdminCfg["backup"] = () => {
    if (!cfg) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(cfg, null, 2)], { type: "application/json" }));
    a.download = "vpertsz-config-backup.json";
    a.click();
    URL.revokeObjectURL(a.href);
    flash("Backup baixado.");
  };

  const importFile: AdminCfg["importFile"] = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!data.games || !data.banners || !data.contatos) throw new Error("estrutura inválida");
        if (!data.bazaar) data.bazaar = { ativo: true, msgInteresse: "", msgAnunciar: "", servidores: [], categorias: [], anuncios: [] };
        if (!Array.isArray(data.bazaar.anuncios)) data.bazaar.anuncios = cfg?.bazaar.anuncios ?? [];
        setCfg(data as SiteConfig); setDirty(true);
        flash("Backup carregado — confira e clique em Salvar e publicar.");
      } catch { flash("Arquivo inválido: use um backup gerado por este painel.", "err"); }
    };
    reader.readAsText(file);
  };

  const reload: AdminCfg["reload"] = () => { void carregar(); flash("Configuração recarregada do servidor."); };

  return (
    <Ctx.Provider value={{ cfg, dirty, busy, toast, erro, setToast, patch, patchBazaar, patchItem, moveItem, removeItem, addItem, pickImage, save, backup, importFile, reload }}>
      {children}
    </Ctx.Provider>
  );
}
