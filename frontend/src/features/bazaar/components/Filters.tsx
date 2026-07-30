import type { ListingFilters } from "../../../types/listing";
import { TIPOS_ORDEM, TYPE_LABEL } from "../constants";

const QUALITIES = [
  { name: "Fraca", min: "0.80", max: "1.00", color: "#6b5a52" },
  { name: "Comum", min: "1.00", max: "1.10", color: "#8a7a70" },
  { name: "Incomum", min: "1.10", max: "1.30", color: "#7fd9a2" },
  { name: "Rara", min: "1.30", max: "1.50", color: "#5b9bd6" },
  { name: "Épica", min: "1.50", max: "1.70", color: "#9a6fbb" },
  { name: "Lendária", min: "1.70", max: "1.80", color: "#e5b34f" },
  { name: "Mítica", min: "1.80", max: "2.20", color: "#e8654a" },
  { name: "Anciã", min: "2.20", max: "2.90", color: "#d84f9e" },
  { name: "Divina", min: "2.90", max: "3.60", color: "#f2f0e6" },
];
const qualityPosition = (value: string, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(100, ((parsed - 0.8) / 2.8) * 100));
};

interface FiltersProps {
  filters: ListingFilters;
  onPatch: (patch: Partial<ListingFilters>) => void;
  onClear: () => void;
  collapsed: boolean;
}

interface SegOption {
  value: string;
  label: string;
  wide?: boolean;
}

function Segment({
  value,
  options,
  onSelect,
}: {
  value: string;
  options: SegOption[];
  onSelect: (value: string) => void;
}) {
  return (
    <div className="bz-seg">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`${value === opt.value ? "on" : ""} ${opt.wide ? "bz-seg-wide" : ""}`}
          onClick={() => onSelect(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Range({
  min,
  max,
  onMin,
  onMax,
  placeholderMin = "Mín.",
  placeholderMax = "Máx.",
  disabled = false,
}: {
  min: string;
  max: string;
  onMin: (v: string) => void;
  onMax: (v: string) => void;
  placeholderMin?: string;
  placeholderMax?: string;
  disabled?: boolean;
}) {
  return (
    <div className="bz-range">
      <input
        className="bz-input"
        type="number"
        value={min}
        placeholder={placeholderMin}
        disabled={disabled}
        onChange={(e) => onMin(e.target.value)}
      />
      <input
        className="bz-input"
        type="number"
        value={max}
        placeholder={placeholderMax}
        disabled={disabled}
        onChange={(e) => onMax(e.target.value)}
      />
    </div>
  );
}

export function Filters({ filters, onPatch, onClear, collapsed }: FiltersProps) {
  const moedaTravada = filters.moeda === "";

  const toggleTipoElementar = (t: string) => {
    const tipos = filters.tipos.includes(t)
      ? filters.tipos.filter((x) => x !== t)
      : [...filters.tipos, t];
    onPatch({ tipos });
  };

  return (
    <aside className="bz-filters" data-collapsed={collapsed ? "1" : "0"} aria-label="Filtros">
      <div className="bz-filters-head">
        <strong>Filtros</strong>
        <button className="bz-clear" type="button" onClick={onClear}>
          Limpar
        </button>
      </div>

      <div className="bz-group">
        <label htmlFor="f-q">Buscar</label>
        <input
          className="bz-input"
          type="search"
          id="f-q"
          value={filters.q}
          placeholder="Nome do item, pokémon…"
          onChange={(e) => onPatch({ q: e.target.value })}
        />
      </div>

      <div className="bz-group">
        <span className="bz-group-title">Tipo de anúncio</span>
        <Segment
          value={filters.tipo}
          onSelect={(tipo) => onPatch({ tipo })}
          options={[
            { value: "", label: "Todos" },
            { value: "pokemon", label: "Pokémon" },
            { value: "item", label: "Itens" },
            { value: "shinycard", label: "Shiny Cards", wide: true },
          ]}
        />
      </div>

      <div className="bz-group">
        <span className="bz-group-title">Intenção</span>
        <Segment
          value={filters.intencao}
          onSelect={(intencao) => onPatch({ intencao })}
          options={[
            { value: "", label: "Todas" },
            { value: "venda", label: "À venda" },
            { value: "compra", label: "Procura-se" },
          ]}
        />
      </div>

      <div className="bz-group">
        <span className="bz-group-title">Moeda</span>
        <Segment
          value={filters.moeda}
          onSelect={(moeda) => onPatch({ moeda, precoMin: "", precoMax: "" })}
          options={[
            { value: "", label: "Todas" },
            { value: "brl", label: "Reais" },
            { value: "diamonds", label: "Diamonds" },
          ]}
        />
        {moedaTravada && (
          <p className="bz-aviso">Escolha uma moeda acima para filtrar por valor.</p>
        )}
        <Range
          min={filters.precoMin}
          max={filters.precoMax}
          disabled={moedaTravada}
          onMin={(v) => onPatch({ precoMin: v })}
          onMax={(v) => onPatch({ precoMax: v })}
        />
      </div>

      <div className="bz-group">
        <span className="bz-group-title">Qualidade</span>
        <div className="bz-qual-chips">
          {QUALITIES.map((quality) => {
            const selected =
              filters.qualidadeMin === quality.min &&
              filters.qualidadeMax === quality.max;
            return (
              <button
                key={quality.name}
                type="button"
                className={`bz-qual ${selected ? "on" : ""}`}
                aria-pressed={selected}
                onClick={() =>
                  onPatch({
                    qualidadeMin: selected ? "" : quality.min,
                    qualidadeMax: selected ? "" : quality.max,
                  })
                }
              >
                <span className="dot" style={{ background: quality.color }} />
                {quality.name}
              </button>
            );
          })}
        </div>
        <div className="bz-qual-legend">
          <span>0,80</span><span className="bz-qual-legend-mid">escala de qualidade</span><span>3,60</span>
        </div>
        <div className="bz-qual-scale" aria-hidden="true">
          <span
            className="bz-qual-mask"
            style={{ left: 0, width: `${qualityPosition(filters.qualidadeMin, 0)}%` }}
          />
          <span
            className="bz-qual-mask"
            style={{
              left: `${qualityPosition(filters.qualidadeMax, 100)}%`,
              right: 0,
            }}
          />
          <span
            className="bz-qual-knob"
            style={{ left: `${qualityPosition(filters.qualidadeMin, 0)}%` }}
          />
          <span
            className="bz-qual-knob"
            style={{ left: `${qualityPosition(filters.qualidadeMax, 100)}%` }}
          />
        </div>
        <Range
          min={filters.qualidadeMin}
          max={filters.qualidadeMax}
          placeholderMin="Mín. 0,80"
          placeholderMax="Máx. 3,60"
          onMin={(v) => onPatch({ qualidadeMin: v })}
          onMax={(v) => onPatch({ qualidadeMax: v })}
        />
      </div>

      <div className="bz-group">
        <span className="bz-group-title">IV total (0–192)</span>
        <Range
          min={filters.ivMin}
          max={filters.ivMax}
          placeholderMin="Mín. 0"
          placeholderMax="Máx. 192"
          onMin={(v) => onPatch({ ivMin: v })}
          onMax={(v) => onPatch({ ivMax: v })}
        />
      </div>

      <div className="bz-group">
        <span className="bz-group-title">Nível</span>
        <Range
          min={filters.nivelMin}
          max={filters.nivelMax}
          placeholderMin="Mín. 1"
          placeholderMax="Máx. 100"
          onMin={(v) => onPatch({ nivelMin: v })}
          onMax={(v) => onPatch({ nivelMax: v })}
        />
      </div>

      <div className="bz-group">
        <span className="bz-group-title">Poder</span>
        <Range
          min={filters.poderMin}
          max={filters.poderMax}
          onMin={(v) => onPatch({ poderMin: v })}
          onMax={(v) => onPatch({ poderMax: v })}
        />
      </div>

      <div className="bz-group">
        <div className="bz-group-head">
          <span className="bz-group-title bz-group-title-inline">Tipo</span>
          {filters.tipos.length > 0 && (
            <button
              type="button"
              className="bz-type-count"
              onClick={() => onPatch({ tipos: [] })}
            >
              {filters.tipos.length} ativo{filters.tipos.length > 1 ? "s" : ""}
            </button>
          )}
        </div>
        <div className="bz-type-grid">
          {TIPOS_ORDEM.map((t) => (
            <button
              key={t}
              type="button"
              className={`bz-type-cell ${filters.tipos.includes(t) ? "on" : ""}`}
              title={TYPE_LABEL[t] ?? t}
              aria-label={TYPE_LABEL[t] ?? t}
              aria-pressed={filters.tipos.includes(t)}
              onClick={() => toggleTipoElementar(t)}
            >
              <i style={{ backgroundImage: `url(/assets/bazaar/types/${t}.webp)` }} />
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
