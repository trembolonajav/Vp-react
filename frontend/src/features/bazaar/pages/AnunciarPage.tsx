import { useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useConfig } from "../../../hooks/useConfig";
import { createListing } from "../../../services/listingsService";
import { ApiError } from "../../../services/api";
import type { ListingWriteRequest } from "../../../types/listing";
import { TIPOS_ORDEM, TYPE_COLOR, TYPE_LABEL } from "../constants";

const IV_NOMES = ["HP", "Ataque", "Defesa", "Atq. Esp.", "Def. Esp.", "Velocidade"];

interface FormState {
  titulo: string;
  categoria: string;
  servidor: string;
  intencao: string;
  moeda: string;
  preco: string;
  negociavel: boolean;
  img: string;
  descricao: string;
  dex: string;
  nivel: string;
  poder: string;
  shiny: boolean;
  quantidade: string;
  aceitaTroca: boolean;
  qualidade: string;
  natureza: string;
  habilidade: string;
  genero: string;
  forma: string;
  disponibilidade: string;
  tipos: string[];
  ivs: string[];
  moves: string[];
}

const INITIAL: FormState = {
  titulo: "", categoria: "", servidor: "", intencao: "venda", moeda: "brl",
  preco: "", negociavel: false, img: "", descricao: "",
  dex: "", nivel: "", poder: "", shiny: false, quantidade: "", aceitaTroca: false,
  qualidade: "", natureza: "", habilidade: "", genero: "", forma: "", disponibilidade: "",
  tipos: [], ivs: ["", "", "", "", "", ""], moves: ["", "", "", ""],
};

const numero = (v: string): number | undefined => (v.trim() === "" ? undefined : Number(v));
const texto = (v: string): string | undefined => (v.trim() === "" ? undefined : v.trim());

export function AnunciarPage() {
  const { config } = useConfig();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleTipo = (t: string) =>
    set("tipos", form.tipos.includes(t) ? form.tipos.filter((x) => x !== t) : [...form.tipos, t].slice(0, 2));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const ivsNums = form.ivs.map((v) => v.trim());
    const ivsCompletos = ivsNums.every((v) => v !== "");
    const body: ListingWriteRequest = {
      titulo: form.titulo.trim(),
      categoria: texto(form.categoria),
      servidor: texto(form.servidor),
      intencao: form.intencao,
      moeda: form.moeda,
      preco: numero(form.preco),
      negociavel: form.negociavel,
      img: texto(form.img),
      descricao: texto(form.descricao),
      dex: numero(form.dex),
      nivel: numero(form.nivel),
      poder: numero(form.poder),
      shiny: form.shiny,
      quantidade: numero(form.quantidade),
      aceitaTroca: form.aceitaTroca,
      qualidade: numero(form.qualidade),
      natureza: texto(form.natureza),
      habilidade: texto(form.habilidade),
      genero: texto(form.genero),
      forma: texto(form.forma),
      disponibilidade: texto(form.disponibilidade),
      tipos: form.tipos,
      ivs: ivsCompletos ? ivsNums.map(Number) : undefined,
      moves: form.moves.map((m) => m.trim()).filter(Boolean),
    };

    try {
      const criado = await createListing(body);
      navigate(`/anuncio/${criado.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível publicar o anúncio.");
    } finally {
      setBusy(false);
    }
  };

  const categorias = config?.bazaar.categorias ?? [];
  const servidores = config?.bazaar.servidores ?? [];

  return (
    <main className="page">
      <div className="container an-form-wrap">
        <h1 className="bz-form-title">Criar anúncio</h1>

        <form onSubmit={submit} className="an-form">
          <div className="an-form-grid">
            <div className="bz-group">
              <label htmlFor="a-titulo">Título *</label>
              <input className="bz-input" id="a-titulo" value={form.titulo}
                onChange={(e) => set("titulo", e.target.value)} required maxLength={90} />
            </div>

            <div className="bz-group">
              <label htmlFor="a-cat">Categoria</label>
              <select className="bz-select" id="a-cat" value={form.categoria}
                onChange={(e) => set("categoria", e.target.value)}>
                <option value="">—</option>
                {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="bz-group">
              <label htmlFor="a-serv">Servidor</label>
              <select className="bz-select" id="a-serv" value={form.servidor}
                onChange={(e) => set("servidor", e.target.value)}>
                <option value="">—</option>
                {servidores.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="bz-group">
              <span className="bz-group-title">Intenção</span>
              <select className="bz-select" value={form.intencao} onChange={(e) => set("intencao", e.target.value)}>
                <option value="venda">À venda</option>
                <option value="compra">Procura-se</option>
              </select>
            </div>

            <div className="bz-group">
              <span className="bz-group-title">Moeda</span>
              <select className="bz-select" value={form.moeda} onChange={(e) => set("moeda", e.target.value)}>
                <option value="brl">Reais</option>
                <option value="diamonds">Diamonds</option>
              </select>
            </div>

            <div className="bz-group">
              <label htmlFor="a-preco">Preço</label>
              <input className="bz-input" id="a-preco" type="number" min="0" step="0.01"
                value={form.preco} onChange={(e) => set("preco", e.target.value)} />
            </div>

            <div className="bz-group">
              <label htmlFor="a-dex">Nº na Pokédex (sprite)</label>
              <input className="bz-input" id="a-dex" type="number" min="0" max="1025"
                value={form.dex} onChange={(e) => set("dex", e.target.value)} />
            </div>
            <div className="bz-group">
              <label htmlFor="a-nivel">Nível</label>
              <input className="bz-input" id="a-nivel" type="number" min="0" max="100"
                value={form.nivel} onChange={(e) => set("nivel", e.target.value)} />
            </div>
            <div className="bz-group">
              <label htmlFor="a-poder">Poder</label>
              <input className="bz-input" id="a-poder" type="number" min="0"
                value={form.poder} onChange={(e) => set("poder", e.target.value)} />
            </div>
            <div className="bz-group">
              <label htmlFor="a-qtd">Quantidade</label>
              <input className="bz-input" id="a-qtd" type="number" min="0"
                value={form.quantidade} onChange={(e) => set("quantidade", e.target.value)} />
            </div>
            <div className="bz-group">
              <label htmlFor="a-qual">Qualidade</label>
              <input className="bz-input" id="a-qual" type="number" min="0" step="0.001"
                value={form.qualidade} onChange={(e) => set("qualidade", e.target.value)} />
            </div>

            <div className="bz-group">
              <label htmlFor="a-nat">Natureza</label>
              <input className="bz-input" id="a-nat" value={form.natureza} maxLength={40}
                onChange={(e) => set("natureza", e.target.value)} />
            </div>
            <div className="bz-group">
              <label htmlFor="a-hab">Habilidade</label>
              <input className="bz-input" id="a-hab" value={form.habilidade} maxLength={40}
                onChange={(e) => set("habilidade", e.target.value)} />
            </div>
            <div className="bz-group">
              <span className="bz-group-title">Gênero</span>
              <select className="bz-select" value={form.genero} onChange={(e) => set("genero", e.target.value)}>
                <option value="">—</option>
                <option value="macho">Macho ♂</option>
                <option value="femea">Fêmea ♀</option>
                <option value="sem">Sem gênero</option>
              </select>
            </div>
            <div className="bz-group">
              <span className="bz-group-title">Disponibilidade</span>
              <select className="bz-select" value={form.disponibilidade}
                onChange={(e) => set("disponibilidade", e.target.value)}>
                <option value="">—</option>
                <option value="Venda">Venda</option>
                <option value="Troca">Troca</option>
                <option value="Venda e Troca">Venda e Troca</option>
              </select>
            </div>

            <div className="bz-group">
              <label htmlFor="a-img">Imagem (URL do card)</label>
              <input className="bz-input" id="a-img" value={form.img} placeholder="assets/… ou https://…"
                onChange={(e) => set("img", e.target.value)} />
            </div>
          </div>

          <div className="bz-group">
            <span className="bz-group-title">Tipagem (até 2)</span>
            <div className="bz-type-grid an-type-grid">
              {TIPOS_ORDEM.map((t) => (
                <button key={t} type="button" title={TYPE_LABEL[t]} aria-pressed={form.tipos.includes(t)}
                  className={`bz-type-cell ${form.tipos.includes(t) ? "on" : ""}`}
                  style={{ "--c": TYPE_COLOR[t] } as CSSProperties}
                  onClick={() => toggleTipo(t)}>
                  <i style={{ backgroundImage: `url(/assets/bazaar/types/${t}.webp)` }} />
                </button>
              ))}
            </div>
          </div>

          <div className="bz-group">
            <span className="bz-group-title">IVs (0–32)</span>
            <div className="an-iv-inputs">
              {form.ivs.map((iv, i) => (
                <label key={IV_NOMES[i]} className="an-iv-input">
                  <span>{IV_NOMES[i]}</span>
                  <input className="bz-input" type="number" min="0" max="32" value={iv}
                    onChange={(e) => set("ivs", form.ivs.map((v, j) => (j === i ? e.target.value : v)))} />
                </label>
              ))}
            </div>
          </div>

          <div className="bz-group">
            <span className="bz-group-title">Golpes (até 4)</span>
            <div className="an-form-grid">
              {form.moves.map((mv, i) => (
                <input key={i} className="bz-input" value={mv} maxLength={40} placeholder={`Golpe ${i + 1}`}
                  onChange={(e) => set("moves", form.moves.map((v, j) => (j === i ? e.target.value : v)))} />
              ))}
            </div>
          </div>

          <div className="bz-group">
            <label htmlFor="a-desc">Descrição</label>
            <textarea className="bz-input" id="a-desc" rows={4} value={form.descricao} maxLength={1200}
              onChange={(e) => set("descricao", e.target.value)} />
          </div>

          <div className="an-checks">
            <label><input type="checkbox" checked={form.negociavel}
              onChange={(e) => set("negociavel", e.target.checked)} /> Aceita propostas</label>
            <label><input type="checkbox" checked={form.shiny}
              onChange={(e) => set("shiny", e.target.checked)} /> Shiny</label>
            <label><input type="checkbox" checked={form.aceitaTroca}
              onChange={(e) => set("aceitaTroca", e.target.checked)} /> Aceita troca</label>
          </div>

          {error && <p className="bz-form-error">{error}</p>}

          <button className="bz-submit" type="submit" disabled={busy}>
            {busy ? "Publicando…" : "Publicar anúncio"}
          </button>
        </form>
      </div>
    </main>
  );
}
