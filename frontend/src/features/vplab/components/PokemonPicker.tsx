import { useEffect, useMemo, useState } from "react";

export interface PickerOption { slug: string; name: string; dexNo: number; suffix?: string }

const SCOPED = `
.vp-pk{position:relative}
.vp-pk .vp-pk-search{position:relative}
.vp-pk .vp-pk-search::before{content:"⌕";position:absolute;left:14px;top:50%;z-index:1;transform:translateY(-52%);font-size:21px;line-height:1;color:#e5a334;pointer-events:none}
.vp-pk .vp-pk-search input{width:100%;box-sizing:border-box;height:50px;padding:11px 42px 11px 37px;border:1px solid #d89a29;border-radius:7px;background:#090605;color:#f7eee7;font:inherit;font-size:16px;box-shadow:0 0 0 3px rgba(229,163,52,.08);transition:border-color .15s,box-shadow .15s}
.vp-pk .vp-pk-search input:focus{outline:none;border-color:#efb542;box-shadow:0 0 0 3px rgba(229,179,79,.12)}
.vp-pk .vp-pk-clear{position:absolute;right:11px;top:50%;z-index:2;transform:translateY(-50%);width:27px;height:27px;border:0;background:transparent;color:#8f7b70;font-size:20px;line-height:1;cursor:pointer}
.vp-pk .vp-pk-options{position:absolute;z-index:30;top:calc(100% + 9px);left:0;right:0;max-height:300px;margin:0;padding:5px 0;overflow-y:auto;overscroll-behavior:contain;list-style:none;border:1px solid rgba(218,160,48,.52);border-radius:9px;background:#0d0806;box-shadow:0 18px 40px rgba(0,0,0,.68)}
.vp-pk .vp-pk-option{display:flex;align-items:center;justify-content:space-between;gap:18px;width:100%;padding:11px 15px;border:0;background:transparent;color:#fff;text-align:left;cursor:pointer;font:inherit}
.vp-pk .vp-pk-option:hover,.vp-pk .vp-pk-option[aria-selected=true]{background:rgba(229,179,79,.1)}
.vp-pk .vp-pk-option strong{font-size:15px;font-weight:650}
.vp-pk .vp-pk-option small{color:#e7903b;font:700 10px ui-monospace,"Cascadia Code",Consolas,monospace}
.vp-pk .vp-pk-empty{padding:17px 15px;color:#8f7b70;font-size:13px}
`;

/**
 * Busca padrão de Pokémon do VPLab: input com lupa, resultado ao digitar,
 * nome à esquerda e nº da dex em laranja à direita. Mesmo padrão da Rota de caça.
 */
export function PokemonPicker({ options, value, onSelect, placeholder = "Buscar Pokémon...", ariaLabel = "Buscar Pokémon" }: {
  options: PickerOption[]; value: string; onSelect: (slug: string) => void; placeholder?: string; ariaLabel?: string;
}) {
  const selected = options.find((o) => o.slug === value);
  const [query, setQuery] = useState(selected?.name ?? "");
  const [open, setOpen] = useState(false);

  // Sincroniza o texto com a seleção quando ela muda por fora (ex.: ?p=, clique em outro lugar).
  useEffect(() => { setQuery(selected?.name ?? ""); }, [value, selected?.name]);

  const pristine = query.trim() === (selected?.name ?? "").trim();
  const filtered = useMemo(() => {
    if (pristine) return options;
    const q = query.trim().toLocaleLowerCase("pt-BR").replace(/^#/, "");
    return options.filter((o) => o.name.toLocaleLowerCase("pt-BR").includes(q) || String(o.dexNo).padStart(3, "0").includes(q));
  }, [options, query, pristine]);

  const pick = (o: PickerOption) => { onSelect(o.slug); setQuery(o.name); setOpen(false); };

  return (
    <div className="vp-pk">
      <style>{SCOPED}</style>
      <div className="vp-pk-search">
        <input
          role="combobox" aria-label={ariaLabel} aria-expanded={open} aria-autocomplete="list"
          placeholder={placeholder} value={query}
          onFocus={(e) => { setOpen(true); e.target.select(); }}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Enter" && open && filtered[0]) { e.preventDefault(); pick(filtered[0]); }
          }}
        />
        {query && <button className="vp-pk-clear" type="button" aria-label="Limpar busca" onMouseDown={(e) => e.preventDefault()} onClick={() => { setQuery(""); setOpen(true); }}>×</button>}
      </div>
      {open && (
        <ul className="vp-pk-options" role="listbox">
          {filtered.map((o) => (
            <li key={o.slug} role="presentation">
              <button className="vp-pk-option" type="button" role="option" aria-selected={o.slug === value} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(o)}>
                <strong>{o.name}{o.suffix ?? ""}</strong>
                <small>#{String(o.dexNo).padStart(3, "0")}</small>
              </button>
            </li>
          ))}
          {!filtered.length && <li className="vp-pk-empty">Nenhum Pokémon encontrado.</li>}
        </ul>
      )}
    </div>
  );
}
