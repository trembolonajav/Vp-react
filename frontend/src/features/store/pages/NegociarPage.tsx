import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useConfig } from "../../../hooks/useConfig";
import { brl } from "../../../utils/format";
import { waLink } from "../../../utils/whatsapp";

const CHIPS = [50, 100, 250, 500, 1000];
const clampInt = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.round(Number(v) || min)));

export function NegociarPage() {
  const { config } = useConfig();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [qty, setQty] = useState(100);

  const game = useMemo(() => {
    if (!config) return undefined;
    const byId = config.games.find((g) => g.id === params.get("g") && g.ativo);
    return byId ?? config.games.find((g) => g.ativo);
  }, [config, params]);

  const min = Math.max(1, game?.min ?? 1);
  const max = game?.max ?? 1000;

  useEffect(() => {
    if (game) setQty(clampInt(100, min, max));
  }, [game, min, max]);

  if (!config) {
    return (
      <main className="page">
        <div className="container">Carregando…</div>
      </main>
    );
  }
  if (!game) {
    return (
      <main className="page">
        <div className="container">Nenhum jogo disponível no momento.</div>
      </main>
    );
  }

  const preco = mode === "buy" ? game.precoCompra : game.precoVenda;
  const total = qty * preco;
  const setQuantity = (v: number | string) => setQty(clampInt(Number(v), min, max));

  const negociar = () => {
    const acao = mode === "buy" ? "COMPRAR" : "VENDER";
    const msg =
      `Olá, VP Store! Quero ${acao} ${qty} ${game.item.toLowerCase()} do ${game.nome} ` +
      `(${brl(preco)}/${game.unidade} — total ${brl(total)}).`;
    window.open(waLink(config.whatsapp, msg), "_blank", "noopener");
  };

  return (
    <main className="page">
      <div className="container">
        <div className="section-head center">
          <div>
            <span className="kicker">{game.nome}</span>
            <h1>{game.item} — compra e venda com segurança</h1>
            <p className="section-sub">
              Escolha a operação e a quantidade. Você finaliza direto no WhatsApp, sem cadastro.
            </p>
            <div className="ornament" aria-hidden="true"></div>
          </div>
        </div>

        <div className="trade-layout">
          <aside className="trade-side">
            {game.icone && <img className="diamond" src={game.icone} alt="Item do jogo" />}
            <div>
              <span className="game-tag">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2 2 9l10 13L22 9Z" />
                </svg>
                <span>{game.nome}</span>
              </span>
              <h2>{game.item}</h2>
              <p className="rate">
                Cotação de compra: <strong>{brl(game.precoCompra)}</strong> por {game.unidade}
                <br />
                Cotação de venda: <strong>{brl(game.precoVenda)}</strong> por {game.unidade}
              </p>
            </div>
          </aside>

          <section className="trade-panel" aria-label="Negociação">
            <div className="tabs" role="tablist">
              <button
                className={`tab ${mode === "buy" ? "active" : ""}`}
                role="tab"
                aria-selected={mode === "buy"}
                onClick={() => setMode("buy")}
              >
                Comprar
              </button>
              <button
                className={`tab ${mode === "sell" ? "active" : ""}`}
                role="tab"
                aria-selected={mode === "sell"}
                onClick={() => setMode("sell")}
              >
                Vender
              </button>
            </div>

            <div className="field-label">
              <span>Quantidade</span>
              <output>{qty} {game.item.toLowerCase()}</output>
            </div>
            <div className="counter">
              <button type="button" aria-label="Diminuir" onClick={() => setQuantity(qty - 1)}>−</button>
              <input
                type="number"
                inputMode="numeric"
                min={min}
                max={max}
                value={qty}
                onChange={(e) => setQuantity(e.target.value)}
                aria-label="Quantidade"
              />
              <button type="button" aria-label="Aumentar" onClick={() => setQuantity(qty + 1)}>+</button>
            </div>
            <div className="chips" aria-label="Quantidades rápidas">
              {CHIPS.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`chip ${qty === v ? "active" : ""}`}
                  onClick={() => setQuantity(v)}
                >
                  {v}
                </button>
              ))}
            </div>
            <input
              className="range"
              type="range"
              min={min}
              max={max}
              step={1}
              value={qty}
              onChange={(e) => setQuantity(e.target.value)}
              aria-label="Ajustar quantidade"
            />
            <div className="range-labels">
              <span>{min}</span><span>250</span><span>500</span><span>750</span><span>{max}</span>
            </div>

            <div className="quote">
              <span>{mode === "buy" ? "Cotação de compra" : "Cotação de venda"}</span>
              <strong>1 {game.unidade} = {brl(preco)}</strong>
            </div>

            <div className="total">
              <span>{mode === "buy" ? "Você pagará" : "Você receberá"}</span>
              <strong>{brl(total)}</strong>
            </div>

            <button className="cta" type="button" onClick={negociar}>
              {mode === "buy" ? "Comprar via WhatsApp" : "Vender via WhatsApp"}
            </button>
            <p className="safe">
              Transação 100% acompanhada — pagamento e entrega confirmados no atendimento oficial.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
