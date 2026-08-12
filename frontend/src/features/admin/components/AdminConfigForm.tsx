import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { getConfig, saveConfig } from "../../../services/configService";
import { ApiError } from "../../../services/api";
import type { AdminConfigRequest, Banner, Contact, Game, SiteConfig } from "../../../types/config";

// Editor de configuração do site — extraído do antigo AdminPage sem alterar o
// comportamento (fromConfig/save/patch*). É a vista "Configurações" do painel.

const ICONES = [
  "instagram", "youtube", "twitch", "whatsapp", "tiktok", "discord",
  "x", "telegram", "facebook", "kick", "email", "site",
];

interface AdminState {
  whatsapp: string;
  msgNegociar: string;
  bazaarAtivo: boolean;
  msgInteresse: string;
  msgAnunciar: string;
  servidoresText: string;
  categoriasText: string;
  games: Game[];
  banners: Banner[];
  contatos: Contact[];
}

function fromConfig(config: SiteConfig): AdminState {
  return {
    whatsapp: config.whatsapp,
    msgNegociar: config.msgNegociar,
    bazaarAtivo: config.bazaar.ativo,
    msgInteresse: config.bazaar.msgInteresse,
    msgAnunciar: config.bazaar.msgAnunciar,
    servidoresText: config.bazaar.servidores.join("\n"),
    categoriasText: config.bazaar.categorias.join("\n"),
    games: config.games.map((g) => ({ ...g })),
    banners: config.banners.map((b) => ({ ...b })),
    contatos: config.contatos.map((c) => ({ ...c })),
  };
}

const linhas = (text: string): string[] =>
  text.split("\n").map((s) => s.trim()).filter(Boolean);

type Scope = "store" | "hub" | "bazaar" | "all";

// O form sempre carrega e salva a config INTEIRA (o endpoint substitui tudo);
// `scope` só controla quais seções aparecem, para dividir por produto no painel.
// Salve antes de trocar de aba — edições não salvas são descartadas ao remontar.
export function AdminConfigForm({ scope = "all" }: { scope?: Scope } = {}) {
  const showStore = scope === "all" || scope === "store";
  const showHub = scope === "all" || scope === "hub";
  const showBazaar = scope === "all" || scope === "bazaar";
  const [state, setState] = useState<AdminState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getConfig(controller.signal)
      .then((config) => setState(fromConfig(config)))
      .catch((err: Error) => {
        if (err.name !== "AbortError") setError(err.message);
      });
    return () => controller.abort();
  }, []);

  if (error && !state) {
    return <div className="bz-empty"><strong>Erro ao carregar as configurações</strong><p>{error}</p></div>;
  }
  if (!state) {
    return <div className="bz-empty"><strong>Carregando configurações…</strong></div>;
  }

  const patch = (change: Partial<AdminState>) => setState((s) => (s ? { ...s, ...change } : s));
  const patchGame = (i: number, change: Partial<Game>) =>
    patch({ games: state.games.map((g, j) => (j === i ? { ...g, ...change } : g)) });
  const patchBanner = (i: number, change: Partial<Banner>) =>
    patch({ banners: state.banners.map((b, j) => (j === i ? { ...b, ...change } : b)) });
  const patchContato = (i: number, change: Partial<Contact>) =>
    patch({ contatos: state.contatos.map((c, j) => (j === i ? { ...c, ...change } : c)) });

  const novoGame = (): Game => ({
    id: "", nome: "", item: "Itens", unidade: "item", botao: "", img: "", icone: "",
    precoCompra: 0, precoVenda: 0, min: 1, max: 1000, ativo: true,
  });

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(false);
    setBusy(true);
    const body: AdminConfigRequest = {
      whatsapp: state.whatsapp,
      msgNegociar: state.msgNegociar,
      banners: state.banners,
      games: state.games,
      bazaar: {
        ativo: state.bazaarAtivo,
        msgInteresse: state.msgInteresse,
        msgAnunciar: state.msgAnunciar,
        servidores: linhas(state.servidoresText),
        categorias: linhas(state.categoriasText),
      },
      contatos: state.contatos,
    };
    try {
      const salvo = await saveConfig(body);
      setState(fromConfig(salvo));
      setOk(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao salvar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="an-form">
      {showStore && (
      <section className="admin-section">
        <h2 className="an-block-title">Loja</h2>
        <div className="an-form-grid">
          <div className="bz-group">
            <label htmlFor="ad-wa">WhatsApp (55 + DDD + número)</label>
            <input className="bz-input" id="ad-wa" value={state.whatsapp}
              onChange={(e) => patch({ whatsapp: e.target.value })} />
          </div>
          <div className="bz-group">
            <label htmlFor="ad-neg">Mensagem de negociação</label>
            <input className="bz-input" id="ad-neg" value={state.msgNegociar}
              onChange={(e) => patch({ msgNegociar: e.target.value })} />
          </div>
        </div>
      </section>
      )}

      {showBazaar && (
      <section className="admin-section">
        <h2 className="an-block-title">Bazaar</h2>
        <label className="admin-check">
          <input type="checkbox" checked={state.bazaarAtivo}
            onChange={(e) => patch({ bazaarAtivo: e.target.checked })} /> Bazaar ativo
        </label>
        <div className="an-form-grid">
          <div className="bz-group">
            <label htmlFor="ad-int">Mensagem de interesse</label>
            <input className="bz-input" id="ad-int" value={state.msgInteresse}
              onChange={(e) => patch({ msgInteresse: e.target.value })} />
          </div>
          <div className="bz-group">
            <label htmlFor="ad-anu">Mensagem de anunciar</label>
            <input className="bz-input" id="ad-anu" value={state.msgAnunciar}
              onChange={(e) => patch({ msgAnunciar: e.target.value })} />
          </div>
          <div className="bz-group">
            <label htmlFor="ad-serv">Servidores (um por linha)</label>
            <textarea className="bz-input" id="ad-serv" rows={4} value={state.servidoresText}
              onChange={(e) => patch({ servidoresText: e.target.value })} />
          </div>
          <div className="bz-group">
            <label htmlFor="ad-cat">Categorias (uma por linha)</label>
            <textarea className="bz-input" id="ad-cat" rows={4} value={state.categoriasText}
              onChange={(e) => patch({ categoriasText: e.target.value })} />
          </div>
        </div>
      </section>
      )}

      {showStore && (
      <section className="admin-section">
        <div className="admin-section-head">
          <h2 className="an-block-title">Jogos</h2>
          <button type="button" className="bz-clear" onClick={() => patch({ games: [...state.games, novoGame()] })}>
            + Adicionar
          </button>
        </div>
        {state.games.map((g, i) => (
          <div key={i} className="admin-row">
            <div className="an-form-grid">
              <input className="bz-input" placeholder="id (slug)" value={g.id} onChange={(e) => patchGame(i, { id: e.target.value })} />
              <input className="bz-input" placeholder="Nome" value={g.nome} onChange={(e) => patchGame(i, { nome: e.target.value })} />
              <input className="bz-input" placeholder="Item (plural)" value={g.item} onChange={(e) => patchGame(i, { item: e.target.value })} />
              <input className="bz-input" placeholder="Unidade" value={g.unidade} onChange={(e) => patchGame(i, { unidade: e.target.value })} />
              <input className="bz-input" placeholder="Arte do card (URL)" value={g.img} onChange={(e) => patchGame(i, { img: e.target.value })} />
              <input className="bz-input" placeholder="Ícone (URL)" value={g.icone} onChange={(e) => patchGame(i, { icone: e.target.value })} />
              <input className="bz-input" type="number" step="0.01" placeholder="Preço compra" value={g.precoCompra} onChange={(e) => patchGame(i, { precoCompra: Number(e.target.value) })} />
              <input className="bz-input" type="number" step="0.01" placeholder="Preço venda" value={g.precoVenda} onChange={(e) => patchGame(i, { precoVenda: Number(e.target.value) })} />
              <input className="bz-input" type="number" placeholder="Mín" value={g.min} onChange={(e) => patchGame(i, { min: Number(e.target.value) })} />
              <input className="bz-input" type="number" placeholder="Máx" value={g.max} onChange={(e) => patchGame(i, { max: Number(e.target.value) })} />
            </div>
            <div className="admin-row-foot">
              <label className="admin-check">
                <input type="checkbox" checked={g.ativo} onChange={(e) => patchGame(i, { ativo: e.target.checked })} /> Ativo
              </label>
              <button type="button" className="bz-clear" onClick={() => patch({ games: state.games.filter((_, j) => j !== i) })}>
                Remover
              </button>
            </div>
          </div>
        ))}
      </section>
      )}

      {showHub && (<>
      <section className="admin-section">
        <div className="admin-section-head">
          <h2 className="an-block-title">Banners</h2>
          <button type="button" className="bz-clear" onClick={() => patch({ banners: [...state.banners, { img: "", alt: "", link: "" }] })}>
            + Adicionar
          </button>
        </div>
        {state.banners.map((b, i) => (
          <div key={i} className="admin-row">
            <div className="an-form-grid">
              <input className="bz-input" placeholder="Imagem (URL)" value={b.img} onChange={(e) => patchBanner(i, { img: e.target.value })} />
              <input className="bz-input" placeholder="Texto alternativo" value={b.alt} onChange={(e) => patchBanner(i, { alt: e.target.value })} />
              <input className="bz-input" placeholder="Link" value={b.link} onChange={(e) => patchBanner(i, { link: e.target.value })} />
            </div>
            <div className="admin-row-foot">
              <button type="button" className="bz-clear" onClick={() => patch({ banners: state.banners.filter((_, j) => j !== i) })}>
                Remover
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="admin-section">
        <div className="admin-section-head">
          <h2 className="an-block-title">Contatos</h2>
          <button type="button" className="bz-clear" onClick={() => patch({ contatos: [...state.contatos, { icone: "site", nome: "", info: "", url: "" }] })}>
            + Adicionar
          </button>
        </div>
        {state.contatos.map((c, i) => (
          <div key={i} className="admin-row">
            <div className="an-form-grid">
              <select className="bz-select" value={c.icone} onChange={(e) => patchContato(i, { icone: e.target.value })}>
                {ICONES.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
              </select>
              <input className="bz-input" placeholder="Nome" value={c.nome} onChange={(e) => patchContato(i, { nome: e.target.value })} />
              <input className="bz-input" placeholder="Info" value={c.info} onChange={(e) => patchContato(i, { info: e.target.value })} />
              <input className="bz-input" placeholder="URL" value={c.url} onChange={(e) => patchContato(i, { url: e.target.value })} />
            </div>
            <div className="admin-row-foot">
              <button type="button" className="bz-clear" onClick={() => patch({ contatos: state.contatos.filter((_, j) => j !== i) })}>
                Remover
              </button>
            </div>
          </div>
        ))}
      </section>
      </>)}

      {error && <p className="bz-form-error">{error}</p>}
      {ok && <p className="bz-form-ok">Configuração salva.</p>}

      <button className="bz-submit" type="submit" disabled={busy}>
        {busy ? "Salvando…" : "Salvar configuração"}
      </button>
    </form>
  );
}
