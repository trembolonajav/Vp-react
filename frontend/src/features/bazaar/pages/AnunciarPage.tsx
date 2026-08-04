import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { createListing } from "../../../services/listingsService";
import { loadPokemonCatalog, type PokemonDexEntry } from "../../vplab/services/ivCalculator";

// Migração pixel-perfect de "VP Bazaar - Criar Anuncio.dc.html" (conteúdo; header/footer no BazaarLayout).
// Wizard de 6 passos + prévia do card. A publicação real via API entra no estágio de integração.

const AB = (p: string) => `/assets/bazaar/${p}`;
const S = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";

const JOGOS: Record<string, { nome: string; cor: string; borda: string; fundo: string; linha: string; logo: string }> = {
  pip: { nome: "Poke Idle World", cor: "#9dbbe2", borda: "rgba(80,140,220,.5)", fundo: "rgba(12,24,46,.72)", linha: "linear-gradient(90deg,#2f6fb8,#63b3d8)", logo: AB("logo-pokeidleworld.png") },
  pwg: { nome: "Poke Web Games", cor: "#e8aaaa", borda: "rgba(200,60,60,.5)", fundo: "rgba(38,12,14,.72)", linha: "linear-gradient(90deg,#a51f22,#e0743a)", logo: AB("logo-pokewebgames.png") },
};
const SHINY_CARD_DEX = new Set([3, 6, 9, 12, 15, 18, 22, 26, 34, 42, 43, 45, 46, 47, 48, 49, 59, 65, 68, 72, 73, 76, 82, 83, 88, 89, 94, 95, 97, 98, 99, 100, 101, 104, 105, 106, 107, 112, 114, 117, 122, 123, 124, 125, 126, 127, 128, 130, 142, 143, 147, 148]);
const ITENS: Array<[string, string, string, string]> = [
  ["strange-pheromone", "Strange Pheromone", "https://poke.idleworld.online/assets/items/strange_pheromone.png", "Atrai encontros raros na caça. Consumível: cada unidade vale um uso."],
  ["rare-pokemon-picture", "Rare Pokémon Picture", "/assets/vplab/professions/official/rare_pokemon_picture.png", "Recebida ao encontrar um Shiny e usada na profissão Treinador de Prestígio."],
  ["rare-candy", "Rare Candy", "/assets/bazaar/sprite-rare-candy.png", "Sobe 1 nível do Pokémon. Consumível: cada unidade vale um uso."],
  ["bronze-boss-token", "Bronze Boss Token", "https://poke.idleworld.online/assets/items/bronze_boss_token.png", "Dá direito a enfrentar o boss uma vez. Consumível: usou, acabou."],
];

const fmtQual = (qv: string) => {
  const n = parseFloat(String(qv).replace(",", "."));
  if (isNaN(n)) return { nome: "—", cor: "#8a7a70", valor: "—" };
  const bandas: Array<[string, number, string]> = [["Fraca", 1.0, "#6b5a52"], ["Comum", 1.1, "#8a7a70"], ["Incomum", 1.3, "#7fd9a2"], ["Rara", 1.5, "#5b9bd6"], ["Épica", 1.7, "#9a6fbb"], ["Lendária", 1.8, "#e5b34f"], ["Mítica", 2.2, "#e8654a"], ["Anciã", 2.9, "#d84f9e"], ["Divina", 3.6, "#f2f0e6"]];
  const b = bandas.find((x) => n <= x[1]) || bandas[bandas.length - 1];
  return { nome: b[0], cor: b[2], valor: n.toFixed(2).replace(".", ",") };
};
const ativo = (on: boolean, corAtiva?: string) => ({ borda: on ? "rgba(229,179,79,.62)" : "rgba(216,138,74,.18)", fundo: on ? "rgba(229,179,79,.12)" : "rgba(10,6,5,.5)", cor: on ? (corAtiva || "#f7eee7") : "#a4937e" });

const SCOPED = `
.bznew input:focus,.bznew select:focus,.bznew textarea:focus{outline:none;border-color:#e5b34f}
.bznew input::placeholder,.bznew textarea::placeholder{color:#7d6d64}
.bznew [data-scroll]::-webkit-scrollbar{width:6px}.bznew [data-scroll]::-webkit-scrollbar-thumb{background:rgba(216,138,74,.28);border-radius:3px}
.bznew [data-h=voltar]:hover{border-color:#e5b34f !important;color:#f7eee7 !important}
.bznew [data-h=pick]:hover{border-color:rgba(229,179,79,.6) !important}
.bznew [data-h=opt]:hover{border-color:rgba(229,179,79,.55) !important}
.bznew [data-h=avancar]:hover{filter:brightness(1.13)}
@media (max-width:1080px){.bznew-wizard{grid-template-columns:minmax(0,1fr) !important}.bznew-previa{position:static !important}.bznew-campos{grid-template-columns:repeat(2,minmax(0,1fr)) !important}.bznew-ivs6{grid-template-columns:repeat(3,minmax(0,1fr)) !important}}
`;

const fieldInput: CSSProperties = { width: "100%", boxSizing: "border-box", padding: "11px 12px", borderRadius: 9, border: "1px solid rgba(216,138,74,.2)", background: "rgba(10,6,5,.65)", color: "#f7eee7", fontSize: 13 };
const fieldCap: CSSProperties = { font: "800 9px/1 Inter", letterSpacing: ".14em", textTransform: "uppercase", color: "#e5b34f" };

interface State {
  passo: number; jogo: string; intencao: string; categoria: string; escolha: string; busca: string;
  nivel: string; forma: string; qualidade: string; disponivel: string; ivs: number[];
  quantidade: string; lote: string; moeda: string; preco: string; propostas: string; descricao: string;
  publicado: boolean; editado: boolean;
}

export function AnunciarPage() {
  const navigate = useNavigate();
  const [pokemons, setPokemons] = useState<PokemonDexEntry[]>([]);
  const [st, setSt] = useState<State>({
    passo: 1, jogo: "", intencao: "", categoria: "", escolha: "", busca: "",
    nivel: "100", forma: "Shiny", qualidade: "1,80", disponivel: "Venda e troca", ivs: [31, 31, 31, 31, 30, 31],
    quantidade: "1", lote: "lote", moeda: "dia", preco: "", propostas: "sim", descricao: "", publicado: false, editado: false,
  });
  const [salvando, setSalvando] = useState(false);
  const [erroPublicacao, setErroPublicacao] = useState("");
  const [anuncioId, setAnuncioId] = useState("");
  useEffect(() => {
    void loadPokemonCatalog()
      .then(setPokemons)
      .catch(() => setErroPublicacao("Não foi possível carregar o catálogo de Pokémon."));
  }, []);
  const set = (o: Partial<State>) => setSt((s) => {
    const soNavegacao = Object.keys(o).every((k) => k === "passo" || k === "busca" || k === "publicado" || k === "editado");
    return { ...s, ...(s.publicado && !soNavegacao ? { editado: true } : {}), ...o };
  });

  const passo = st.passo;
  const ehPokemon = st.categoria === "pokemon", ehCard = st.categoria === "card", ehItem = st.categoria === "item";
  const vendendo = st.intencao === "venda";

  const nomeEscolha = () => {
    if (!st.escolha) return "";
    if (ehItem) { const i = ITENS.find((x) => x[0] === st.escolha); return i ? i[1] : ""; }
    const p = pokemons.find((x) => String(x.n) === String(st.escolha));
    return p ? (ehCard ? "Shiny Card — " + p.m : p.m) : "";
  };

  const rotulosTrilha: Array<[string, string]> = [
    ["Jogo", st.jogo ? JOGOS[st.jogo].nome : ""],
    ["Intenção", st.intencao ? (vendendo ? "Vender" : "Procurar") : ""],
    ["Categoria", ehPokemon ? "Pokémon" : ehCard ? "Shiny Card" : ehItem ? "Item" : ""],
    ["Escolha", nomeEscolha()],
    ["Ficha", ""],
    ["Revisar", ""],
  ];
  const trilha = rotulosTrilha.map(([nome, valor], i) => {
    const n = i + 1, feito = n < passo, atual = n === passo;
    return {
      rotulo: atual ? nome : (valor || nome), marca: feito ? "✓" : String(n), cursor: feito ? "pointer" : "default",
      aoClicar: () => { if (feito) set({ passo: n }); },
      borda: atual ? "rgba(229,179,79,.55)" : feito ? "rgba(126,217,162,.3)" : "rgba(216,138,74,.14)",
      fundo: atual ? "rgba(229,179,79,.12)" : "transparent",
      cor: atual ? "#f7eee7" : feito ? "#a8d9bd" : "#7d6d64",
      bordaNum: atual ? "#e5b34f" : feito ? "rgba(126,217,162,.5)" : "rgba(216,138,74,.24)",
      corNum: atual ? "#f0d194" : feito ? "#7fd9a2" : "#7d6d64",
    };
  });

  const busca = st.busca.trim().toLowerCase();
  const opcoes = useMemo(() => {
    if (ehItem) return ITENS.map(([id, nome, arte]) => ({ nome, arteBg: `url(${arte})`, aoClicar: () => set({ escolha: id }), ...ativo(st.escolha === id) }));
    if (ehPokemon || ehCard) return pokemons
      .filter((pokemon) => (!ehCard || SHINY_CARD_DEX.has(pokemon.n)) && (!busca || pokemon.m.toLowerCase().includes(busca) || String(pokemon.n).includes(busca)))
      .map((pokemon) => ({
        nome: pokemon.m,
        arteBg: ehCard
          ? `url(https://poke.idleworld.online/assets/cards/${16254 + pokemon.n}.png)`
          : `url(${S}${st.forma === "Shiny" ? "shiny/" : ""}${pokemon.n}.png)`,
        aoClicar: () => set({ escolha: String(pokemon.n) }),
        ...ativo(String(st.escolha) === String(pokemon.n)),
      }));
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ehItem, ehPokemon, ehCard, busca, st.escolha, st.forma, pokemons]);

  const q = fmtQual(st.qualidade);
  const ivTotal = st.ivs.reduce((s, v) => s + (Number(v) || 0), 0);
  const atributosValidos = st.ivs.every((iv) => Number.isInteger(iv) && iv >= 1 && iv <= 32);
  const itemAtual = ITENS.find((x) => x[0] === st.escolha);
  const arte = ehItem ? (itemAtual ? itemAtual[2] : "/assets/bazaar/sprite-rare-candy.png") : null;
  const precoNum = Number(st.preco) || 0;
  const jogo = st.jogo ? JOGOS[st.jogo] : null;

  const statsPrev: Array<{ rotulo: string; corRotulo: string; valor: string; cor: string }> = [];
  if (ehPokemon) {
    statsPrev.push({ rotulo: "Nível", corRotulo: "#7d6d64", valor: st.nivel || "—", cor: "#f7eee7" });
    statsPrev.push({ rotulo: "IV total", corRotulo: "#7d6d64", valor: ivTotal + "/192", cor: "#e5b34f" });
    statsPrev.push({ rotulo: q.nome, corRotulo: q.cor, valor: q.valor, cor: q.cor });
  } else if (ehCard) {
    statsPrev.push({ rotulo: "Quantidade", corRotulo: "#7d6d64", valor: (st.quantidade || "1") + " un.", cor: "#f7eee7" });
    statsPrev.push({ rotulo: "Uso", corRotulo: "#7d6d64", valor: "Altar shiny", cor: "#dcc3f2" });
  } else if (ehItem) {
    statsPrev.push({ rotulo: "Quantidade", corRotulo: "#7d6d64", valor: (st.quantidade || "1") + " un.", cor: "#f7eee7" });
    statsPrev.push({ rotulo: "Tipo", corRotulo: "#7d6d64", valor: "Consumível", cor: "#7fd9a2" });
  }
  const detalhePrev = ehPokemon ? [st.forma, st.disponivel].filter(Boolean).join(" · ") : ehCard ? "Shiny Card · consumível" : ehItem ? "Item · consumível" : "—";

  let travado = false, aviso = "", rotuloAvancar = "Continuar";
  if (passo === 1) { travado = !st.jogo; aviso = "Escolha o jogo do anúncio."; }
  else if (passo === 2) { travado = !st.intencao; aviso = "Você está vendendo ou procurando?"; }
  else if (passo === 3) { travado = !st.categoria; aviso = "Escolha o que você vai anunciar."; }
  else if (passo === 4) { travado = !st.escolha; aviso = ehItem ? "Escolha um dos quatro itens permitidos." : "Selecione na lista para continuar."; }
  else if (passo === 5) {
    const qNum = parseFloat(String(st.qualidade).replace(",", "."));
    const qInvalida = ehPokemon && (isNaN(qNum) || qNum < 0.8 || qNum > 3.6);
    const nivelInvalido = ehPokemon && (!st.nivel || Number(st.nivel) < 1);
    const ivInvalido = ehPokemon && st.ivs.some((iv) => !Number.isInteger(iv) || iv < 1 || iv > 32);
    const quantidadeInvalida = !ehPokemon && (!st.quantidade || Number(st.quantidade) < 1);
    const precoInvalido = !st.preco || Number(st.preco) <= 0;
    travado = precoInvalido || qInvalida || nivelInvalido || ivInvalido || ivTotal > 192 || quantidadeInvalida;
    aviso = qInvalida ? "Qualidade precisa ser um número entre 0,80 e 3,60." : nivelInvalido ? "Informe um nível válido." : ivInvalido ? "Preencha os seis atributos com valores entre 1 e 32." : quantidadeInvalida ? "Informe uma quantidade maior que zero." : precoInvalido ? "Informe um preço maior que zero." : "Todos os campos obrigatórios foram preenchidos.";
    rotuloAvancar = "Revisar anúncio";
  } else {
    aviso = st.publicado ? (st.editado ? "Você mudou dados depois de publicar." : "Anúncio no ar.") : "Confira antes de publicar.";
    rotuloAvancar = st.publicado ? (st.editado ? "Salvar alterações" : "Ver no marketplace") : "Publicar anúncio";
  }

  const resumo: Array<{ rotulo: string; valor: string; cor: string }> = [
    { rotulo: "Jogo", valor: st.jogo ? JOGOS[st.jogo].nome : "—", cor: "#f7eee7" },
    { rotulo: "Anúncio", valor: vendendo ? "À venda" : "Procura-se", cor: "#e5b34f" },
    { rotulo: "Categoria", valor: ehPokemon ? "Pokémon" : ehCard ? "Shiny Card" : "Item", cor: "#f7eee7" },
    { rotulo: ehPokemon ? "Pokémon" : ehCard ? "Card de" : "Item", valor: nomeEscolha() || "—", cor: "#f7eee7" },
  ];
  if (ehPokemon) {
    resumo.push({ rotulo: "Nível / forma", valor: (st.nivel || "—") + " · " + st.forma, cor: "#f7eee7" });
    resumo.push({ rotulo: "Qualidade", valor: q.nome + " " + q.valor, cor: q.cor });
    resumo.push({ rotulo: "IV total", valor: ivTotal + " / 192", cor: "#e5b34f" });
    resumo.push({ rotulo: "Disponível para", valor: st.disponivel, cor: "#f7eee7" });
  } else {
    resumo.push({ rotulo: "Quantidade", valor: (st.quantidade || "1") + " unidades", cor: "#f7eee7" });
    resumo.push({ rotulo: "Venda", valor: st.lote === "lote" ? "Só o lote inteiro" : "Aceita por unidade", cor: "#f7eee7" });
  }
  resumo.push({ rotulo: "Preço", valor: (st.moeda === "dia" ? "◆ " : "R$ ") + (precoNum ? precoNum.toLocaleString("pt-BR") : "—") + (st.propostas === "sim" ? " · aceita propostas" : " · fechado"), cor: "#e5b34f" });
  if (st.descricao.trim()) resumo.push({ rotulo: "Descrição", valor: st.descricao.trim(), cor: "#b5a196" });

  const avancar = async () => {
    if (travado) return;
    if (passo < 6) { set({ passo: passo + 1 }); return; }
    if (st.publicado) {
      navigate(anuncioId ? `/bazaar/anuncio/${anuncioId}` : "/bazaar");
      return;
    }
    setSalvando(true);
    setErroPublicacao("");
    try {
      const criado = await createListing({
        titulo: nomeEscolha(), jogo: st.jogo === "pip" ? "pokeidle" : "pokewebgames", categoria: st.categoria,
        intencao: st.intencao === "procura" ? "compra" : "venda",
        moeda: st.moeda === "dia" ? "diamonds" : "brl", preco: precoNum, negociavel: st.propostas === "sim",
        status: "ativo", descricao: st.descricao.trim(),
        img: ehItem
          ? itemAtual?.[2]
          : ehCard
            ? `https://poke.idleworld.online/assets/cards/${16254 + Number(st.escolha)}.png`
            : `${S}${st.forma === "Shiny" ? "shiny/" : ""}${st.escolha}.png`,
        dex: ehItem ? 0 : Number(st.escolha) || 0,
        nivel: ehPokemon ? Number(st.nivel) || 0 : 0,
        shiny: st.forma === "Shiny" || ehCard,
        quantidade: ehPokemon ? 1 : Number(st.quantidade) || 1,
        aceitaTroca: st.disponivel.toLowerCase().includes("troca"),
        forma: ehPokemon ? st.forma : "",
        qualidade: ehPokemon ? Number(st.qualidade.replace(",", ".")) : 0,
        disponibilidade: ehPokemon ? st.disponivel.replace("troca", "Troca") : undefined,
        ivs: ehPokemon ? st.ivs : [], tipos: ehPokemon ? (pokemons.find((p) => String(p.n) === st.escolha)?.t || []) : [], moves: [], regras: "",
      });
      setAnuncioId(criado.id);
      set({ publicado: true });
    } catch (error) {
      setErroPublicacao(error instanceof Error ? error.message : "Não foi possível publicar o anúncio.");
    } finally {
      setSalvando(false);
    }
  };

  const camposIv = [["HP", 0, "hp-iv"], ["Ataque", 1, "ataque-iv"], ["Defesa", 2, "defesa-iv"], ["Atq. Esp.", 3, "ataque-especial-iv"], ["Def. Esp.", 4, "defesa-especial-iv"], ["Velocidade", 5, "velocidade-iv"]] as Array<[string, number, string]>;

  const titulo = passo === 1 ? "De qual jogo é o anúncio?" : passo === 2 ? "Você quer vender ou procurar?" : passo === 3 ? "O que você vai anunciar?" : passo === 4 ? (ehItem ? "Qual item?" : ehCard ? "Card de qual pokémon?" : "Qual pokémon?") : passo === 5 ? "Preencha a ficha" : "Revise e publique";
  const subtitulo = passo === 1 ? "O card mostra o selo do jogo para quem estiver navegando." : passo === 2 ? "Isso define o selo do card: à venda ou procura-se." : passo === 3 ? "Cada categoria pede informações diferentes." : passo === 4 ? (ehItem ? "Só esses quatro itens circulam no Bazaar hoje." : ehCard ? "O card serve para enfrentar o shiny dessa espécie." : "Busque pelo nome ou número e selecione na lista.") : passo === 5 ? "É com esses dados que o card e o filtro funcionam." : "Depois de publicar você ainda pode editar ou pausar.";

  return (
    <div className="bznew" style={{ background: "#0a0605", minHeight: "calc(100vh - 150px)", paddingBottom: 48 }}>
      <style>{SCOPED}</style>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "20px 26px 0" }}>

        {/* TRILHA */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", padding: "13px 16px", borderRadius: 12, border: "1px solid rgba(216,138,74,.18)", background: "linear-gradient(180deg,#181110,#100b09)" }}>
          <button data-h="voltar" onClick={() => { if (passo > 1) set({ passo: passo - 1 }); }} disabled={passo === 1} style={{ padding: "9px 14px", borderRadius: 8, cursor: passo === 1 ? "default" : "pointer", border: "1px solid rgba(216,138,74,.24)", background: "none", font: "600 12px/1 Inter", color: "#a4937e", opacity: passo === 1 ? .4 : 1 }}>← Voltar</button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {trilha.map((t, i) => (
              <button key={i} onClick={t.aoClicar} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 11px", borderRadius: 999, cursor: t.cursor, border: `1px solid ${t.borda}`, background: t.fundo, font: "700 10.5px/1 Inter", color: t.cor }}>
                <span style={{ width: 16, height: 16, display: "grid", placeItems: "center", borderRadius: "50%", border: `1px solid ${t.bordaNum}`, font: "700 8.5px/1 Inter", color: t.corNum }}>{t.marca}</span>{t.rotulo}
              </button>
            ))}
          </div>
          <span style={{ marginLeft: "auto", font: "800 10px/1 Inter", letterSpacing: ".16em", textTransform: "uppercase", color: "#7d6d64" }}>Passo {passo} de 6</span>
        </div>

        <div className="bznew-wizard" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 306px", gap: 16, alignItems: "start", marginTop: 16 }}>

          {/* FORM */}
          <div style={{ borderRadius: 12, border: "1px solid rgba(216,138,74,.2)", background: "linear-gradient(180deg,#1a1210,#100b09)", padding: "22px 24px 24px" }}>
            <div style={{ textAlign: "center" }}>
              <span style={{ font: "800 10px/1 Inter", letterSpacing: ".2em", textTransform: "uppercase", color: "#c33629" }}>Novo anúncio</span>
              <h1 style={{ margin: "11px 0 0", font: "700 29px/1.1 Cinzel, serif", color: "#f7eee7" }}>{titulo}</h1>
              <p style={{ margin: "9px 0 0", fontSize: 13, color: "#a4937e" }}>{subtitulo}</p>
              <div style={{ width: 170, height: 1, margin: "16px auto 0", background: "linear-gradient(90deg,transparent,rgba(229,179,79,.5),transparent)" }} />
            </div>

            {/* Passo 1: jogo */}
            {passo === 1 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20 }}>
                {(["pip", "pwg"] as const).map((id) => {
                  const on = st.jogo === id, j = JOGOS[id];
                  return (
                    <button key={id} data-h="pick" onClick={() => set({ jogo: id })} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "24px 16px", borderRadius: 12, cursor: "pointer", border: `1px solid ${on ? "rgba(229,179,79,.62)" : "rgba(216,138,74,.18)"}`, background: on ? "rgba(229,179,79,.1)" : "rgba(10,6,5,.5)" }}>
                      <img src={j.logo} alt={j.nome} style={{ height: 64, width: "auto", display: "block", opacity: st.jogo && st.jogo !== id ? .5 : 1 }} />
                      <b style={{ font: "700 14px/1 Inter", color: on ? "#f7eee7" : "#a4937e" }}>{j.nome}</b>
                      <small style={{ fontSize: 11.5, color: "#8a7a70" }}>Pokémons, shiny cards e itens</small>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Passo 2: intenção */}
            {passo === 2 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20 }}>
                {([["venda", "Vender", "Tenho o item e quero vender ou trocar."], ["procura", "Procurar", "Estou atrás disso e pago pelo item."]] as Array<[string, string, string]>).map(([id, rotulo, sub]) => {
                  const on = st.intencao === id, a = ativo(on);
                  const cor = on ? "#f0d194" : "#8a7a70";
                  return (
                    <button key={id} data-h="pick" onClick={() => set({ intencao: id })} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 9, padding: "24px 18px", borderRadius: 12, cursor: "pointer", border: `1px solid ${a.borda}`, background: a.fundo, textAlign: "center" }}>
                      <span style={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: 11, border: `1px solid ${on ? "#e5b34f" : "rgba(216,138,74,.24)"}`, color: cor }}>
                        {id === "venda" ? (
                          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2a2 2 0 0 1-.6-1.4V4a1 1 0 0 1 1-1h8a2 2 0 0 1 1.4.6l7.4 7.4a2 2 0 0 1 0 2.8Z" />
                            <circle cx="7.5" cy="7.5" r="1.4" fill="currentColor" stroke="none" />
                          </svg>
                        ) : (
                          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="10.5" cy="10.5" r="6.5" />
                            <path d="m20 20-4.6-4.6" />
                          </svg>
                        )}
                      </span>
                      <b style={{ font: "700 15px/1 Inter", color: a.cor }}>{rotulo}</b>
                      <small style={{ fontSize: 11.5, lineHeight: 1.45, color: "#8a7a70" }}>{sub}</small>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Passo 3: categoria */}
            {passo === 3 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 20 }}>
                {([["pokemon", "Pokémon", "Nível, forma, qualidade e IVs", `url(${S}shiny/282.png)`], ["card", "Shiny Card", "Consumível do Altar shiny", "url(https://poke.idleworld.online/assets/cards/16348.png)"], ["item", "Item", "Pheromone, Picture, Rare Candy e Token", "url(/assets/bazaar/sprite-rare-candy.png)"]] as Array<[string, string, string, string]>).map(([id, rotulo, sub, arteBg]) => {
                  const on = st.categoria === id, a = ativo(on);
                  return (
                    <button key={id} data-h="pick" onClick={() => set({ categoria: id, escolha: "", quantidade: id === "pokemon" ? "1" : "10" })} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "22px 14px", borderRadius: 12, cursor: "pointer", border: `1px solid ${a.borda}`, background: a.fundo, textAlign: "center" }}>
                      <i role="img" aria-label={rotulo} style={{ width: 52, height: 52, background: arteBg, backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat", imageRendering: "pixelated" }} />
                      <b style={{ font: "700 14px/1 Inter", color: a.cor }}>{rotulo}</b>
                      <small style={{ fontSize: 11, lineHeight: 1.45, color: "#8a7a70" }}>{sub}</small>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Passo 4: escolha */}
            {passo === 4 && (
              <div style={{ marginTop: 18 }}>
                {!ehItem && <input type="text" value={st.busca} onChange={(e) => set({ busca: e.target.value })} placeholder={ehCard ? "Buscar a espécie do card…" : "Buscar por nome…"} style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(216,138,74,.22)", background: "rgba(10,6,5,.65)", color: "#f7eee7", fontSize: 13.5 }} />}
                <div data-scroll="1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(104px,1fr))", gap: 9, marginTop: 12, maxHeight: 340, overflow: "auto", padding: 5, border: "1px solid rgba(216,138,74,.14)", borderRadius: 11, background: "rgba(10,6,5,.4)" }}>
                  {opcoes.map((o) => (
                    <button key={o.nome} data-h="opt" onClick={o.aoClicar} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, padding: "11px 6px", cursor: "pointer", borderRadius: 10, border: `1px solid ${o.borda}`, background: o.fundo }}>
                      <i role="img" aria-label={o.nome} style={{ width: 54, height: 54, background: o.arteBg, backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat", imageRendering: "pixelated" }} />
                      <span style={{ font: "600 11px/1.25 Inter", textAlign: "center", color: o.cor }}>{o.nome}</span>
                    </button>
                  ))}
                </div>
                <p style={{ margin: "11px 0 0", fontSize: 11.5, lineHeight: 1.5, color: "#8a7a70" }}>{ehItem ? "Rare Candy sobe nível, Strange Pheromone atrai encontros e Bronze Boss Token dá uma entrada no boss — todos consumíveis." : ehCard ? "A Shiny Card é consumida em uma tentativa contra o shiny da espécie escolhida." : "O sprite, os tipos e a pokédex vêm do catálogo do jogo — você só preenche a ficha."}</p>
              </div>
            )}

            {/* Passo 5: ficha */}
            {passo === 5 && (
              <div style={{ marginTop: 18 }}>
                {ehPokemon ? (
                  <div className="bznew-campos" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><span style={fieldCap}>Nível *</span><input type="number" min={1} required value={st.nivel} onChange={(e) => set({ nivel: e.target.value })} style={fieldInput} /></label>
                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><span style={fieldCap}>Forma *</span><select value={st.forma} onChange={(e) => set({ forma: e.target.value })} style={fieldInput}><option value="Shiny">Shiny</option><option value="Normal">Normal</option></select></label>
                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><span style={fieldCap}>Qualidade *</span><input type="text" value={st.qualidade} onChange={(e) => set({ qualidade: e.target.value })} placeholder="1,80" style={fieldInput} /></label>
                    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><span style={fieldCap}>Disponível *</span><select value={st.disponivel} onChange={(e) => set({ disponivel: e.target.value })} style={fieldInput}><option value="Venda e troca">Venda e troca</option><option value="Venda">Só venda</option><option value="Troca">Só troca</option></select></label>
                  </div>
                ) : null}

                {ehPokemon && (
                  <div style={{ marginTop: 14, padding: "14px 15px", borderRadius: 11, border: "1px solid rgba(216,138,74,.18)", background: "rgba(10,6,5,.45)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                      <span style={fieldCap}>Atributos <i style={{ fontStyle: "normal", letterSpacing: 0, textTransform: "none", color: "#7d6d64" }}>(0–32 cada)</i></span>
                      <output style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, border: `1px solid ${!atributosValidos ? "rgba(195,54,41,.45)" : "rgba(78,201,124,.4)"}`, background: !atributosValidos ? "rgba(195,54,41,.12)" : "rgba(78,201,124,.1)", font: "700 11px/1 Inter", color: !atributosValidos ? "#e8b4a8" : "#7fd9a2" }}>IV total {ivTotal} / 192 {!atributosValidos ? "✕" : "✓"}</output>
                    </div>
                    <div className="bznew-ivs6" style={{ display: "grid", gridTemplateColumns: "repeat(6,minmax(0,1fr))", gap: 8, marginTop: 11 }}>
                      {camposIv.map(([rotulo, i, icone]) => (
                        <label key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 6, font: "600 9.5px/1.1 Inter", color: "#8a7a70" }}><i role="img" aria-label={rotulo} style={{ flex: "none", width: 14, height: 14, background: `url(${AB("fields/" + icone + ".webp")})`, backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />{rotulo}</span>
                          <input type="number" min={1} max={32} required value={String(st.ivs[i])} onChange={(e) => { const v = st.ivs.slice(); v[i] = Math.max(0, Math.min(32, Number(e.target.value) || 0)); set({ ivs: v }); }} style={{ ...fieldInput, padding: "10px 8px", borderRadius: 8, textAlign: "center" }} />
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {(ehCard || ehItem) && (
                  <>
                    <div style={{ display: "flex", gap: 11, padding: "13px 15px", borderRadius: 11, border: "1px solid rgba(216,138,74,.18)", background: "rgba(10,6,5,.45)" }}>
                      <span style={{ flex: "none", width: 6, height: 6, marginTop: 5, borderRadius: "50%", background: "#e5b34f" }} />
                      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: "#a4937e" }}>{ehCard ? "Shiny Card é consumível: cada unidade vale uma tentativa contra o shiny da espécie. Por isso o anúncio só precisa de quantidade e preço." : (itemAtual ? itemAtual[3] : "Item consumível: cada unidade vale um uso.")}</p>
                    </div>
                    <div className="bznew-campos" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10, marginTop: 12 }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><span style={fieldCap}>Quantidade *</span><input type="number" min={1} required value={st.quantidade} onChange={(e) => set({ quantidade: e.target.value })} style={fieldInput} /></label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><span style={fieldCap}>Vende em lote?</span><select value={st.lote} onChange={(e) => set({ lote: e.target.value })} style={fieldInput}><option value="lote">Só o lote inteiro</option><option value="unidade">Aceito vender por unidade</option></select></label>
                    </div>
                  </>
                )}

                <div className="bznew-campos" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10, marginTop: 12 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><span style={fieldCap}>Moeda *</span><select value={st.moeda} onChange={(e) => set({ moeda: e.target.value })} style={fieldInput}><option value="dia">Diamonds</option><option value="brl">Reais (R$)</option></select></label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><span style={fieldCap}>{(ehCard || ehItem) && st.lote === "unidade" ? "Preço por unidade *" : "Preço *"}</span><input type="number" min={0.01} step="any" required value={st.preco} onChange={(e) => set({ preco: e.target.value })} placeholder="0" style={fieldInput} /></label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6 }}><span style={fieldCap}>Propostas</span><select value={st.propostas} onChange={(e) => set({ propostas: e.target.value })} style={fieldInput}><option value="sim">Aceito propostas</option><option value="nao">Preço fechado</option></select></label>
                </div>

                <label style={{ display: "block", marginTop: 12 }}>
                  <span style={{ display: "block", ...fieldCap, marginBottom: 7 }}>Descrição <i style={{ fontStyle: "normal", letterSpacing: 0, textTransform: "none", color: "#7d6d64" }}>(opcional)</i></span>
                  <textarea value={st.descricao} onChange={(e) => set({ descricao: e.target.value })} rows={3} placeholder={ehPokemon ? "Conte se é de PvP, se transfere na hora, o que aceita em troca…" : "Conte como entrega, se divide o lote, prazo…"} style={{ ...fieldInput, lineHeight: 1.5, resize: "vertical" }} />
                </label>
              </div>
            )}

            {/* Passo 6: revisão */}
            {passo === 6 && (
              <div style={{ marginTop: 18 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 1, borderRadius: 11, overflow: "hidden", background: "rgba(216,138,74,.12)" }}>
                  {resumo.map((r, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "12px 15px", background: "#150e0c" }}>
                      <span style={{ flex: "none", font: "600 11.5px/1 Inter", whiteSpace: "nowrap", color: "#8a7a70" }}>{r.rotulo}</span>
                      <span style={{ minWidth: 0, textAlign: "right", font: "700 12.5px/1.35 Inter", color: r.cor }}>{r.valor}</span>
                    </div>
                  ))}
                </div>
                {st.publicado && (
                  <div style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 13, padding: "14px 16px", borderRadius: 11, border: "1px solid rgba(126,217,162,.4)", background: "rgba(20,50,36,.5)" }}>
                    <span style={{ width: 26, height: 26, display: "grid", placeItems: "center", borderRadius: "50%", border: "1px solid rgba(126,217,162,.5)", fontSize: 13, color: "#a8f0c4" }}>✓</span>
                    <div>
                      <div style={{ font: "700 13px/1.2 Inter", color: "#dcffe6" }}>Anúncio publicado</div>
                      <div style={{ marginTop: 4, fontSize: 11.5, color: "#8fbfa2" }}>Já aparece no marketplace e pode receber propostas no chat.</div>
                    </div>
                  </div>
                )}
                <p style={{ margin: "12px 0 0", fontSize: 11.5, lineHeight: 1.5, color: "#8a7a70" }}>A proteção da VP vale quando a negociação usa o intermédio oficial — você pode pedir isso dentro do chat a qualquer momento.</p>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginTop: 22, paddingTop: 16, borderTop: "1px solid rgba(216,138,74,.14)" }}>
              <span style={{ fontSize: 11.5, color: erroPublicacao ? "#e8a49a" : "#7d6d64" }}>{erroPublicacao || aviso}</span>
              <button data-h="avancar" onClick={() => void avancar()} disabled={travado || salvando} style={{ display: "grid", placeItems: "center", minWidth: 216, padding: "13px 20px", borderRadius: 9, cursor: travado || salvando ? "default" : "pointer", border: `1px solid ${travado ? "rgba(216,138,74,.2)" : "rgba(240,200,130,.48)"}`, background: travado ? "rgba(10,6,5,.5)" : "linear-gradient(180deg,#a51f22,#6a1215)", boxShadow: "inset 0 1px 0 rgba(255,220,160,.24)", font: "700 12.5px/1 Cinzel, serif", letterSpacing: ".12em", textTransform: "uppercase", color: travado ? "#7d6d64" : "#fff", opacity: travado ? .55 : 1 }}>{salvando ? "Publicando…" : rotuloAvancar}</button>
            </div>
          </div>

          {/* PRÉVIA */}
          <div className="bznew-previa" style={{ position: "sticky", top: 74, borderRadius: 12, border: "1px solid rgba(216,138,74,.2)", background: "linear-gradient(180deg,#1a1210,#100b09)", padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <span style={{ font: "800 9px/1 Inter", letterSpacing: ".14em", textTransform: "uppercase", color: "#7d6d64" }}>Prévia do card</span>
              <span style={{ padding: "3px 8px", borderRadius: 5, border: `1px solid ${st.publicado ? "rgba(78,201,124,.4)" : "rgba(216,138,74,.26)"}`, font: "700 8.5px/1 Inter", letterSpacing: ".1em", textTransform: "uppercase", color: st.publicado ? "#7fd9a2" : "#c9a86a" }}>{st.publicado ? "No ar" : "Rascunho"}</span>
            </div>
            <div style={{ marginTop: 11, borderRadius: 11, border: "1px solid rgba(216,138,74,.18)", background: "linear-gradient(180deg,#1c1412,#100b09)", overflow: "hidden" }}>
              <span style={{ display: "block", height: 2, background: jogo ? jogo.linha : "rgba(216,138,74,.2)" }} />
              <div style={{ position: "relative", aspectRatio: "1/.86", display: "grid", placeItems: "center", background: ehCard ? "radial-gradient(58% 58% at 50% 46%, rgba(124,83,143,.26), rgba(10,6,5,.9))" : "radial-gradient(58% 58% at 50% 46%, rgba(195,54,41,.18), rgba(10,6,5,.9))" }}>
                <i role="img" aria-label={nomeEscolha() || "Seu anúncio"} style={{ width: "62%", height: "62%", background: st.escolha ? (ehItem ? `url(${arte})` : ehCard ? `url(https://poke.idleworld.online/assets/cards/${16254 + Number(st.escolha)}.png)` : `url(${S}${st.forma === "Shiny" ? "shiny/" : ""}${st.escolha}.png)`) : "none", backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat", imageRendering: "pixelated", filter: "drop-shadow(0 10px 14px rgba(0,0,0,.7))" }} />
                <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 5 }}>
                  <span style={{ padding: "4px 8px", borderRadius: 5, border: `1px solid ${vendendo ? "rgba(229,179,79,.45)" : st.intencao ? "rgba(195,54,41,.5)" : "rgba(216,138,74,.2)"}`, background: vendendo ? "rgba(38,24,12,.72)" : st.intencao ? "rgba(48,14,12,.72)" : "rgba(16,10,9,.7)", font: "800 8.5px/1 Inter", letterSpacing: ".12em", textTransform: "uppercase", whiteSpace: "nowrap", color: vendendo ? "#ffe0b8" : st.intencao ? "#ffc9b8" : "#a4937e" }}>{vendendo ? "À venda" : st.intencao ? "Procura-se" : "Rascunho"}</span>
                  {ehPokemon && st.forma === "Shiny" && <span style={{ padding: "4px 8px", borderRadius: 5, border: "1px solid rgba(126,217,162,.45)", background: "rgba(20,50,36,.7)", font: "800 8.5px/1 Inter", letterSpacing: ".12em", textTransform: "uppercase", whiteSpace: "nowrap", color: "#a8f0c4" }}>Shiny</span>}
                </div>
                {jogo && (
                  <span style={{ position: "absolute", top: 7, right: 7, display: "flex", alignItems: "center", height: 34, padding: "0 9px", borderRadius: 8, border: `1px solid ${jogo.borda}`, background: jogo.fundo }}>
                    <i role="img" aria-label={jogo.nome} style={{ width: 30, height: 24, background: `url(${jogo.logo})`, backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />
                  </span>
                )}
              </div>
              <div style={{ padding: "12px 13px 13px", borderTop: "1px solid rgba(216,138,74,.14)" }}>
                <div style={{ font: "700 14px/1.25 Inter", color: "#f7eee7" }}>{nomeEscolha() || "Seu anúncio"}</div>
                <div style={{ marginTop: 4, fontSize: 11.5, color: "#8a7a70" }}>{detalhePrev}</div>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, statsPrev.length)},1fr)`, gap: 1, marginTop: 10, borderRadius: 7, overflow: "hidden", background: "rgba(216,138,74,.14)" }}>
                  {statsPrev.map((s, i) => (
                    <div key={i} style={{ padding: "7px 8px", background: "#150e0c" }}>
                      <div style={{ font: "700 8px/1 Inter", letterSpacing: ".12em", textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: s.corRotulo }}>{s.rotulo}</div>
                      <div style={{ marginTop: 5, font: "700 12px/1 Inter", whiteSpace: "nowrap", color: s.cor }}>{s.valor}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 11 }}>
                  {st.moeda === "dia" && <img src={AB("diamante.png")} alt="Diamonds" style={{ width: 19, height: 19, objectFit: "contain" }} />}
                  <span style={{ font: "700 18px/1 Cinzel, serif", whiteSpace: "nowrap", color: "#e5b34f" }}>{precoNum ? (st.moeda === "dia" ? precoNum.toLocaleString("pt-BR") : "R$ " + precoNum.toLocaleString("pt-BR", { minimumFractionDigits: 2 })) : "—"}</span>
                  {st.propostas === "sim" && <span style={{ marginLeft: "auto", flex: "none", padding: "4px 7px", borderRadius: 5, border: "1px solid rgba(216,138,74,.24)", font: "700 8.5px/1 Inter", whiteSpace: "nowrap", color: "#c9a86a" }}>Propostas</span>}
                </div>
              </div>
            </div>
            <p style={{ margin: "11px 0 0", fontSize: 11, lineHeight: 1.5, color: "#8a7a70" }}>É esse card que aparece no marketplace e no link compartilhado.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
