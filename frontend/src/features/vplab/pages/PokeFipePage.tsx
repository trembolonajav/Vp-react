import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { loadPokemonCatalog, type PokemonDexEntry } from "../services/ivCalculator";
import { calculateFipe, DIAMOND_BRL, LEVEL_BRL, UPDATED_AT } from "../services/pokeFipe";
import "./vplab.css";

const money = (value = 0) => value.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const sprite = (n?: number) => n ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${n}.png` : "";

export function PokeFipePage() {
  const [params] = useSearchParams();
  const [catalog,setCatalog] = useState<PokemonDexEntry[]>([]);
  const [pokemon,setPokemon] = useState(params.get("p") ?? "");
  const [iv,setIv] = useState(params.get("iv") ?? "110");
  const [multiplier,setMultiplier] = useState(params.get("multiplier") ?? "1.80");
  const [level,setLevel] = useState(params.get("level") ?? "1");
  const [submitted,setSubmitted] = useState(false);
  const [error,setError] = useState("");
  useEffect(() => { loadPokemonCatalog().then(setCatalog).catch(() => setError("Não foi possível carregar o catálogo.")); },[]);
  const selected = useMemo(() => catalog.find((entry) => entry.s === pokemon),[catalog,pokemon]);
  const result = useMemo(() => submitted ? calculateFipe({species:selected,iv,multiplier,level}) : null,
    [submitted,selected,iv,multiplier,level]);
  const submit = (event:FormEvent) => { event.preventDefault(); setSubmitted(true); };
  const clear = () => { setPokemon("");setIv("110");setMultiplier("1.80");setLevel("1");setSubmitted(false); };

  return <main className="vplab-react"><div className="container">
    <nav className="vplab-react__tools" aria-label="Ferramentas do VPLab">
      <Link to="/vplab/">Avaliar IV</Link><Link to="/vplab/pokedex">Pokédex</Link>
      <Link className="is-active" to="/vplab/pokefipe">PokeFipe</Link>
      <Link to="/vplab/rota">Rota de caça</Link><Link to="/vplab/breeding">Breeding</Link>
      <Link to="/vplab/clas">Clãs</Link><Link to="/vplab/profissoes">Profissões</Link>
    </nav>
    <header className="vplab-react__hero fipe-react-hero"><div><span className="vplab-react__eyebrow">PokeFipe · modelo 2.0</span>
      <h1>Quanto vale esse Pokémon hoje?</h1><p>Venda rápida, valor justo e preço para anunciar com base de mercado atualizada em {UPDATED_AT}.</p></div>
      <span className="vplab-react__privacy">Referência da comunidade</span>
    </header>
    <div className="fipe-react-layout">
      <form className="vplab-panel fipe-react-form" onSubmit={submit}>
        <div className="fipe-react-title"><span>01</span><div><h2>Dados do Pokémon</h2><small>Resultado = IV × multiplicador, somado à espécie e aos níveis.</small></div></div>
        <div className="fipe-react-species">{selected && <img src={sprite(selected.n)} alt="" width="104" height="104"/>}<label>Pokémon meta
          <select value={pokemon} onChange={(e)=>{setPokemon(e.target.value);setSubmitted(false)}}><option value="">Selecione uma espécie (opcional)</option>{catalog.map((entry)=><option key={entry.n} value={entry.s}>{entry.m}</option>)}</select>
          <small>Espécies sem amostra de mercado usam base provisória.</small></label></div>
        <div className="fipe-react-fields">
          <label>IV<input type="number" min="1" step=".01" value={iv} onChange={(e)=>{setIv(e.target.value);setSubmitted(false)}}/></label>
          <label>Multiplicador<input type="number" min=".01" step=".01" value={multiplier} onChange={(e)=>{setMultiplier(e.target.value);setSubmitted(false)}}/></label>
          <label>Nível<input type="number" min="1" step="1" value={level} onChange={(e)=>{setLevel(e.target.value);setSubmitted(false)}}/><small>Cada nível até 400 adiciona {money(LEVEL_BRL)}.</small></label>
        </div>
        {error && <p className="vplab-warning">{error}</p>}
        <div className="fipe-react-actions"><button type="submit">Calcular referência</button><button type="button" onClick={clear}>Limpar</button></div>
      </form>
      <section className="vplab-panel fipe-react-output" aria-live="polite">
        <div className="fipe-react-title"><span>02</span><div><h2>Estimativa PokeFipe</h2><small>Faixa informativa baseada no modelo atual.</small></div></div>
        {!result ? <div className="fipe-react-empty"><strong>Sua referência aparecerá aqui</strong><span>Preencha os dados e clique em calcular.</span></div> :
        !result.valid ? <p className="vplab-warning">{result.reason}</p> : <>
          <div className="fipe-react-result-head"><strong>{selected?.m ?? "Pokémon"}</strong><span>Pontuação {result.score} · base {result.confidence}</span></div>
          <div className="fipe-react-total"><small>Venda rápida até preço de anúncio</small><strong>{money(result.quick)} a {money(result.list)}</strong><span>Valor justo: {money(result.fair)}</span></div>
          <div className="fipe-react-breakdown"><article><small>Equivalente em diamonds</small><strong>{result.diamondsMin} a {result.diamondsMax}</strong></article>
            <article><small>Valor dos níveis</small><strong>{money(result.levelValue)}</strong></article>
            <article><small>Faixa do resultado</small><strong>{result.band?.label}</strong></article></div>
        </>}
      </section>
    </div>
    <div className="fipe-react-info"><article><small>Base do cálculo</small><strong>Espécie + resultado + níveis</strong></article>
      <article><small>Cotação da tabela</small><strong>{money(DIAMOND_BRL)} / diamante</strong></article>
      <article><small>Importante</small><strong>Referência, não oferta</strong></article></div>
  </div></main>;
}
