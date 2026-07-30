import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { analyzeIv, findSpecies, loadPokemonCatalog } from "../services/ivCalculator";
import type { PokemonDexEntry } from "../services/ivCalculator";
import { scanPokeIdleImage } from "../services/paddleIvScanner";
import { EMPTY_IV_SCAN, STAT_LABELS } from "../types/ivScanner";
import type { IvScanFields } from "../types/ivScanner";
import "./vplab.css";

function imageFromClipboard(event: ClipboardEvent): File | null {
  const item = [...(event.clipboardData?.items ?? [])].find((candidate) => candidate.type.startsWith("image/"));
  return item?.getAsFile() ?? null;
}

export function IvScannerPage() {
  const [searchParams] = useSearchParams();
  const [fields, setFields] = useState<IvScanFields>(EMPTY_IV_SCAN);
  const [catalog, setCatalog] = useState<PokemonDexEntry[]>([]);
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState("Selecione, arraste ou cole um print com Ctrl + V.");
  const [busy, setBusy] = useState(false);
  const [rawText, setRawText] = useState("");
  const previewRef = useRef("");
  const requestRef = useRef(0);

  useEffect(() => {
    void loadPokemonCatalog().then((entries) => {
      setCatalog(entries);
      const requested = searchParams.get("p");
      const species = requested ? entries.find((entry) => entry.s === requested) : undefined;
      if (species) setFields((current) => ({ ...current, species: species.m }));
    }).catch((error) =>
      setStatus(error instanceof Error ? error.message : "Não foi possível carregar a Pokédex."));
  }, [searchParams]);

  const read = async (file: File) => {
    const request = ++requestRef.current;
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(file);
    previewRef.current = url;
    setPreview(url);
    setBusy(true);
    setStatus("Inicializando PP-OCRv6 e analisando a imagem…");
    setRawText("");
    try {
      const result = await scanPokeIdleImage(file);
      if (request !== requestRef.current) return;
      setFields(result.fields);
      setRawText(result.rawText);
      const count = [result.fields.level, result.fields.quality, result.fields.ivTotal,
        result.fields.power, ...result.fields.stats].filter(Boolean).length;
      setStatus(`${result.engine}: ${count} campos reconhecidos em ${Math.round(result.elapsedMs)} ms ` +
        `(confiança média ${Math.round(result.confidence * 100)}%). Confira os dados abaixo.`);
    } catch (error) {
      if (request === requestRef.current) {
        setStatus(error instanceof Error ? error.message : "Não foi possível ler a imagem.");
      }
    } finally {
      if (request === requestRef.current) setBusy(false);
    }
  };

  useEffect(() => {
    const paste = (event: ClipboardEvent) => {
      const file = imageFromClipboard(event);
      if (file) void read(file);
    };
    window.addEventListener("paste", paste);
    return () => {
      window.removeEventListener("paste", paste);
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  const setField = (key: keyof Omit<IvScanFields, "stats">, value: string) =>
    setFields((current) => ({ ...current, [key]: value }));
  const setStat = (index: number, value: string) => setFields((current) => {
    const stats = [...current.stats] as IvScanFields["stats"];
    stats[index] = value;
    return { ...current, stats };
  });
  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void read(file);
    event.target.value = "";
  };
  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = [...event.dataTransfer.files].find((candidate) => candidate.type.startsWith("image/"));
    if (file) void read(file);
  };
  const selectedSpecies = useMemo(() => findSpecies(catalog, fields.species), [catalog, fields.species]);
  const analysis = useMemo(() => selectedSpecies ? analyzeIv(fields, selectedSpecies) : null,
    [fields, selectedSpecies]);

  return (
    <main className="vplab-react">
      <div className="container">
        <nav className="vplab-react__tools" aria-label="Ferramentas do VPLab">
          <Link to="/vplab/" className="is-active">Avaliar IV</Link>
          <Link to="/vplab/pokedex">Pokédex</Link><Link to="/vplab/pokefipe">PokeFipe</Link>
          <Link to="/vplab/rota">Rota de caça</Link><a href="/vplab/legacy/?tab=breeding">Breeding</a>
          <a href="/vplab/legacy/?tab=clas">Clãs</a><a href="/vplab/legacy/?tab=profissoes">Profissões</a>
        </nav>
        <header className="vplab-react__hero">
          <div><span className="vplab-react__eyebrow">React · leitor neural local</span>
            <h1>Avaliar IV por imagem</h1><p>PaddleOCR PP-OCRv6 para card completo e tooltip do inventário.</p></div>
          <span className="vplab-react__privacy">A imagem não sai do seu navegador</span>
        </header>

        <div className="vplab-react__grid">
          <section className="vplab-panel">
            <label className={`vplab-drop ${busy ? "is-busy" : ""}`}
              onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onFile} disabled={busy} />
              {preview ? <img src={preview} alt="Print selecionado" /> : <span className="vplab-drop__icon">◇</span>}
              <strong>{busy ? "Lendo imagem…" : "Selecionar ou arrastar print"}</strong>
              <small>PNG, JPG ou WebP · também funciona com Ctrl + V</small>
            </label>
            <p className="vplab-status" role="status">{status}</p>
            {rawText && <details className="vplab-raw"><summary>Texto reconhecido para diagnóstico</summary><pre>{rawText}</pre></details>}
          </section>
          <section className="vplab-panel">
            <h2>Dados reconhecidos</h2>
            <div className="vplab-fields">
              <label>Espécie<input list="vplab-species" value={fields.species} onChange={(e) => setField("species", e.target.value)} /></label>
              <datalist id="vplab-species">{catalog.map((entry) => <option key={entry.n} value={entry.m} />)}</datalist>
              <label>Nível<input inputMode="numeric" value={fields.level} onChange={(e) => setField("level", e.target.value)} /></label>
              <label>Qualidade<input inputMode="decimal" value={fields.quality} onChange={(e) => setField("quality", e.target.value)} /></label>
              <label>IV total<input inputMode="numeric" value={fields.ivTotal} onChange={(e) => setField("ivTotal", e.target.value)} /></label>
              <label>Poder<input inputMode="numeric" value={fields.power} onChange={(e) => setField("power", e.target.value)} /></label>
            </div>
            <h3>Atributos</h3>
            <div className="vplab-stats">{STAT_LABELS.map((label, index) => (
              <label key={label}>{label}<input inputMode="numeric" value={fields.stats[index]} onChange={(e) => setStat(index, e.target.value)} /></label>
            ))}</div>
            {!selectedSpecies && fields.species && <p className="vplab-warning">Espécie não encontrada na Pokédex. Corrija o nome para calcular.</p>}
          </section>
        </div>

        <section className="vplab-panel vplab-result" aria-live="polite">
          <div className="vplab-result__title"><div><span className="vplab-react__eyebrow">Resultado calculado</span>
            <h2>Análise de IV</h2></div></div>
          {analysis ? <>
            <div className="vplab-summary">
              <article><small>IV provável</small><strong>{analysis.total.likely}<span>/192</span></strong><em>{analysis.total.low}–{analysis.total.high}</em></article>
              <article><small>Confiança do cálculo</small><strong>{analysis.confidence}%</strong><em>arredondamento dos atributos</em></article>
              <article><small>Potencial ponderado</small><strong>{analysis.potential}%</strong><em>espécie e qualidade</em></article>
              <article><small>Poder recalculado</small><strong>{analysis.calculatedPower.toLocaleString("pt-BR")}</strong><em>{analysis.powerDifference === null ? "sem poder informado" : `diferença ${analysis.powerDifference >= 0 ? "+" : ""}${analysis.powerDifference}`}</em></article>
            </div>
            <div className="vplab-iv-list">{STAT_LABELS.map((label, index) => <div key={label}><span>{label}</span>
              <strong>{analysis.ivs[index]}</strong><small>{analysis.ranges[index].low}–{analysis.ranges[index].high}</small></div>)}</div>
            <Link className="fipe-from-iv" to={`/vplab/pokefipe?p=${analysis.species.s}&iv=${analysis.total.likely}&multiplier=${fields.quality}&level=${fields.level}`}>Ver estimativa na PokeFipe →</Link>
            {analysis.warnings.map((warning) => <p className="vplab-warning" key={warning}>{warning}</p>)}
          </> : <p className="vplab-result__empty">Informe espécie, nível, qualidade e os seis atributos para gerar a análise.</p>}
        </section>
      </div>
    </main>
  );
}
