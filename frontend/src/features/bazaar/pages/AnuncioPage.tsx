import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getListing } from "../../../services/listingsService";
import { startConversation } from "../../../services/chatService";
import { createReport } from "../../../services/reportsService";
import type { Listing } from "../../../types/listing";

// Migração pixel-perfect de "VP Bazaar - Anuncio Pokemon.dc.html" (conteúdo; header/footer no BazaarLayout).
// Conteúdo de demonstração (Gardevoir Shiny) preservado do original; a busca por :id via API entra na integração.

const AB = (p: string) => `/assets/bazaar/${p}`;
const SPRITE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/282.png";
const F = (n: string) => `url(${AB("fields/" + n + ".webp")})`;

const IVS_BASE: Array<[string, number, string]> = [
  ["HP", 31, "hp-iv"], ["Ataque", 31, "ataque-iv"], ["Defesa", 31, "defesa-iv"],
  ["Atq. Esp.", 31, "ataque-especial-iv"], ["Def. Esp.", 30, "defesa-especial-iv"], ["Velocidade", 31, "velocidade-iv"],
];
const corIv = (v: number) => v >= 31 ? "#7fd9a2" : v >= 26 ? "#e5b34f" : v >= 16 ? "#e0743a" : "#c98d84";
const barraIv = (v: number) => v >= 31 ? "linear-gradient(90deg,#3f9c68,#7fd9a2)" : v >= 26 ? "linear-gradient(90deg,#c9962f,#f6e2b0)" : "linear-gradient(90deg,#8a4a2a,#e0743a)";

const SCOPED = `
.bzad a{color:#e5b34f;text-decoration:none}.bzad a:hover{color:#f6d68f}
.bzad input:focus{outline:none;border-color:#e5b34f}
.bzad [data-h=ghost]:hover{border-color:#e5b34f !important;color:#f7eee7 !important}
.bzad [data-h=neg]:hover{filter:brightness(1.14)}
.bzad [data-h=report]:hover{border-color:#c33629 !important;color:#f7d9d2 !important}
.bzad [data-h=motivo]:hover{border-color:rgba(229,179,79,.5) !important}
.bzad [data-h=send]:hover{filter:brightness(1.12)}
.bzad [data-h=copy]:hover{border-color:#e5b34f !important;color:#f7eee7 !important}
.bzad [data-h=wa]:hover{border-color:#25d366 !important;color:#dcffe6 !important}
.bzad [data-h=dc]:hover{border-color:#7289da !important;color:#e6ebff !important}
.bzad [data-h=tg]:hover{border-color:#409ede !important;color:#e2f1ff !important}
.bzad [data-h=x]:hover{border-color:#f7eee7 !important;color:#f7eee7 !important}
@media (max-width:1240px){.bzad-grid{grid-template-columns:minmax(0,1fr) 320px !important}.bzad-arte{grid-column:1}.bzad-lado{grid-column:2;grid-row:1 / span 2}.bzad-corpo{grid-column:1}}
@media (max-width:900px){.bzad-grid{grid-template-columns:minmax(0,1fr) !important}.bzad-lado{grid-column:1;grid-row:auto}.bzad-ivs{grid-template-columns:minmax(0,1fr) !important}}
`;

const PLATS: Array<[string, string, string, string, string, string, string]> = [
  ["wa", "WhatsApp", "#25d366", "rgba(12,34,22,.75)", "rgba(37,211,102,.28)", "rgba(18,48,32,.9)", "No WhatsApp a prévia é pequena: a miniatura entra ao lado do título, por isso qualidade, IV e preço também vão no texto."],
  ["dc", "Discord", "#7289da", "rgba(20,24,44,.7)", "rgba(114,137,218,.3)", "", "O Discord não tem link de compartilhamento: o botão copia a mensagem pronta e abre o app — você só cola no canal. O embed usa a cor da VP na barra lateral e mostra a imagem 1200×630 inteira."],
  ["tg", "Telegram", "#409ede", "rgba(12,28,44,.7)", "rgba(64,158,222,.3)", "rgba(16,36,54,.9)", "O Telegram monta a prévia com miniatura, título e descrição do link — o texto pronto segue junto na mensagem."],
  ["x", "X / Twitter", "#f7eee7", "rgba(16,12,11,.75)", "rgba(216,138,74,.26)", "", "No X o card usa summary_large_image: só a imagem 1200×630 e o título, então os dados precisam estar legíveis na arte."],
];
const MOTIVOS: Array<[string, string]> = [
  ["golpe", "Golpe ou tentativa de fraude"], ["spam", "Anúncio duplicado ou spam"], ["falso", "Preço ou informações falsas"],
  ["vendido", "Item já vendido / indisponível"], ["ofensivo", "Conteúdo ofensivo"], ["outro", "Outro motivo"],
];

export function AnuncioPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [erroApi, setErroApi] = useState("");
  const [modal, setModal] = useState("");
  const [plataforma, setPlataforma] = useState("wa");
  const [copiadoLink, setCopiadoLink] = useState(false);
  const [copiadoTexto, setCopiadoTexto] = useState(false);
  const [copiadoDiscord, setCopiadoDiscord] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [detalhes, setDetalhes] = useState("");
  const [enviada, setEnviada] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getListing(id, controller.signal).then(setListing).catch((error: Error) => {
      if (error.name !== "AbortError") setErroApi(error.message);
    });
    return () => controller.abort();
  }, [id]);

  const negociar = async () => {
    if (!listing) return;
    try {
      const conversa = await startConversation({ adId: listing.id, seller: listing.vendedor, title: listing.titulo, image: listing.img, price: listing.preco, currency: listing.moeda, details: listing.descricao });
      navigate(`/bazaar/chat?conversation=${encodeURIComponent(conversa.id)}`);
    } catch (error) { setErroApi(error instanceof Error ? error.message : "Não foi possível abrir a negociação."); }
  };

  const denunciar = async () => {
    if (!listing || !podeEnviar) return;
    try {
      await createReport({ adId: listing.id, title: listing.titulo, seller: listing.vendedor, reason: motivo, details: detalhes.trim() });
      setEnviada(true);
    } catch (error) { setErroApi(error instanceof Error ? error.message : "Não foi possível enviar a denúncia."); }
  };

  const ehPokemon = listing ? listing.tipo === "pokemon" : true;
  const ehCard = listing?.tipo === "shinycard" || listing?.categoria === "card";
  const ehItem = listing?.tipo === "item" || listing?.categoria === "item";
  const ivs = IVS_BASE.map(([label, fallback, icon], index) => [label, listing ? (listing.ivs[index] ?? 0) : fallback, icon] as [string, number, string]);
  const total = ivs.reduce((s, v) => s + v[1], 0);
  const pctTotal = Math.round(total / 192 * 100) + "%";
  const tituloAnuncio = listing?.titulo || "Gardevoir";
  const nivelAnuncio = listing?.nivel || 100;
  const itemSprites: Record<string, string> = {
    "strange pheromone": "https://poke.idleworld.online/assets/items/strange_pheromone.png",
    "rare pokémon picture": "/assets/vplab/professions/official/rare_pokemon_picture.png",
    "rare candy": "/assets/bazaar/sprite-rare-candy.png",
    "bronze boss token": "https://poke.idleworld.online/assets/items/bronze_boss_token.png",
  };
  const spriteAnuncio = listing?.img
    || (ehCard && listing?.dex ? `https://poke.idleworld.online/assets/cards/${16254 + listing.dex}.png` : "")
    || (ehItem ? itemSprites[tituloAnuncio.toLowerCase()] : "")
    || (listing?.dex ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${listing.shiny ? "shiny/" : ""}${listing.dex}.png` : SPRITE);
  const qualidadeAnuncio = listing?.qualidade ? listing.qualidade.toFixed(2).replace(".", ",") : "1,80";
  const precoAnuncio = listing ? listing.preco.toLocaleString("pt-BR") : "350";
  const vendedorAnuncio = listing?.vendedor || "MoonLight";
  // A rota de share entrega Open Graph ao crawler e redireciona pessoas para o anúncio.
  const url = `${window.location.origin}/api/v1/share/${encodeURIComponent(id)}`;
  const unidadeMoeda = listing?.moeda === "brl" ? "R$" : "◆";
  const detalhesCompartilhamento = ehPokemon
    ? `Lv. ${nivelAnuncio} · Qualidade ${qualidadeAnuncio} · IV ${total}/192`
    : `${ehCard ? "Shiny Card" : "Item"} · ${listing?.quantidade || 1} un.`;
  const resumoCompartilhamento = `${tituloAnuncio} — ${detalhesCompartilhamento} · ${unidadeMoeda} ${precoAnuncio}`;
  const mensagem = `${tituloAnuncio}\n${detalhesCompartilhamento}\n${unidadeMoeda} ${precoAnuncio} — ${listing?.negociavel !== false ? "aceita propostas" : "preço fechado"}\n${url}`;
  const copiar = (txt: string, set: (v: boolean) => void) => { if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(() => { }); set(true); window.setTimeout(() => set(false), 1800); };

  const atual = PLATS.find((p) => p[0] === plataforma) || PLATS[0];
  const prevGrande = plataforma === "dc" || plataforma === "x";
  const prevAcento = plataforma === "x" ? "#e5b34f" : "#c33629";
  const precisaDetalhe = motivo === "outro" && detalhes.trim().length < 10;
  const podeEnviar = !!motivo && !precisaDetalhe;

  const fichaTecnica = [
    { rotulo: "Nível", valor: String(nivelAnuncio), cor: "#f7eee7" }, { rotulo: "Forma", valor: listing?.forma || "Shiny", cor: "#a8f0c4" },
    { rotulo: "Qualidade", valor: qualidadeAnuncio, cor: "#e5b34f" }, { rotulo: "Disponível", valor: listing?.disponibilidade || "Venda e troca", cor: "#f7eee7" },
  ];
  const moves = ["Moonblast", "Psychic", "Thunderbolt", "Calm Mind"];
  const condicoes = ["Negocio apenas pelo chat da plataforma.", "Transferência em até 10 minutos.", "Aceito troca por shiny de qualidade parecida.", "Intermédio da VP disponível a pedido."];

  const fecharModal = () => setModal("");

  return (
    <div className="bzad" style={{ background: "#0a0605", minHeight: "calc(100vh - 150px)", paddingBottom: 56 }}>
      <style>{SCOPED}</style>
      {erroApi && <div role="alert" style={{ maxWidth: 1500, margin: "0 auto", padding: "10px 26px", color: "#e8a49a", fontSize: 12 }}>{erroApi}</div>}
      <div style={{ maxWidth: 1500, margin: "0 auto", padding: "18px 26px 0" }}>

        {/* BREADCRUMB */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: "#7d6d64", marginBottom: 14 }}>
          <Link to="/bazaar" style={{ color: "#a4937e" }}>Marketplace</Link><span style={{ color: "#5d4c3c" }}>›</span>
          <Link to="/bazaar" style={{ color: "#a4937e" }}>{ehCard ? "Shiny Cards" : ehItem ? "Itens" : "Pokémons"}</Link><span style={{ color: "#5d4c3c" }}>›</span>
          <span style={{ color: "#f7eee7" }}>{tituloAnuncio}</span>
        </div>

        <div className="bzad-grid" style={{ display: "grid", gridTemplateColumns: "392px minmax(0,1fr) 306px", gap: 16, alignItems: "start" }}>

          {/* ARTE */}
          <div className="bzad-arte" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ position: "relative", borderRadius: 12, border: "1px solid rgba(216,138,74,.2)", background: "linear-gradient(180deg,#1a1210,#100b09)", overflow: "hidden" }}>
              <span style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#2f6fb8,#63b3d8)" }} />
              <div style={{ position: "relative", aspectRatio: "1/1", display: "grid", placeItems: "center", background: "radial-gradient(58% 58% at 50% 44%, rgba(221,79,127,.2), rgba(10,6,5,.92))" }}>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "56%", aspectRatio: "1/1", borderRadius: "50%", border: "1px solid rgba(229,179,79,.14)" }} />
                <img src={spriteAnuncio} alt={tituloAnuncio} style={{ position: "relative", width: "66%", height: "66%", objectFit: "contain", imageRendering: "pixelated", filter: "drop-shadow(0 16px 22px rgba(0,0,0,.8))" }} />
                <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
                  <span style={{ padding: "5px 9px", borderRadius: 6, border: "1px solid rgba(229,179,79,.45)", background: "rgba(38,24,12,.75)", backdropFilter: "blur(3px)", font: "800 9.5px/1 Inter", letterSpacing: ".12em", textTransform: "uppercase", whiteSpace: "nowrap", color: "#ffe0b8" }}>À venda</span>
                  {(ehPokemon && listing?.shiny) || ehCard ? <span style={{ padding: "5px 9px", borderRadius: 6, border: "1px solid rgba(126,217,162,.45)", background: "rgba(20,50,36,.75)", backdropFilter: "blur(3px)", font: "800 9.5px/1 Inter", letterSpacing: ".12em", textTransform: "uppercase", color: "#a8f0c4" }}>{ehCard ? "Shiny Card" : "Shiny"}</span> : null}
                </div>
                <span title="Poke Idle World" style={{ position: "absolute", top: 8, right: 8, display: "flex", alignItems: "center", gap: 8, height: 44, padding: "0 12px", borderRadius: 10, border: "1px solid rgba(80,140,220,.5)", background: "rgba(12,24,46,.75)", backdropFilter: "blur(5px)" }}>
                  <img src={AB("logo-pokeidleworld.png")} alt="Poke Idle World" style={{ height: 30, width: "auto", display: "block" }} />
                  <span style={{ font: "800 9px/1.15 Inter", letterSpacing: ".06em", textTransform: "uppercase", color: "#9dbbe2" }}>Poke Idle<br />World</span>
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "rgba(216,138,74,.14)", borderTop: "1px solid rgba(216,138,74,.16)" }}>
                {((ehPokemon ? [["Nível", String(nivelAnuncio), "#f7eee7", "#7d6d64", false], ["IV total", String(total), "#e5b34f", "#7d6d64", true], ["Qualidade", qualidadeAnuncio, "#e5b34f", "#e5b34f", false]] : [["Categoria", ehCard ? "Shiny Card" : "Item", "#f7eee7", "#7d6d64", false], ["Quantidade", String(listing?.quantidade || 1), "#e5b34f", "#7d6d64", false]]) as Array<[string, string, string, string, boolean]>).map(([rot, val, valCor, rotCor, ivt]) => (
                  <div key={rot} style={{ padding: "11px 12px", background: "#150e0c" }}>
                    <div style={{ font: "700 8.5px/1 Inter", letterSpacing: ".14em", textTransform: "uppercase", color: rotCor }}>{rot}</div>
                    <div style={{ marginTop: 6, font: "700 17px/1 Cinzel, serif", color: valCor }}>{val}{ivt && <span style={{ fontSize: 12, color: "#8a7a70" }}>/192</span>}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", borderRadius: 11, border: "1px solid rgba(216,138,74,.16)", background: "rgba(20,13,11,.8)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ec97c", boxShadow: "0 0 8px #4ec97c", flex: "none" }} />
              <span style={{ font: "600 11.5px/1.4 Inter", color: "#a4937e" }}>Anúncio ativo · publicado há 2 horas</span>
            </div>
          </div>

          {/* CORPO */}
          <div className="bzad-corpo" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ borderRadius: 12, border: "1px solid rgba(216,138,74,.2)", background: "linear-gradient(180deg,#1a1210,#100b09)", padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  <h1 style={{ margin: 0, font: "700 31px/1.08 Cinzel, serif", color: "#f7eee7" }}>{tituloAnuncio} {ehPokemon && listing?.shiny && <span style={{ fontSize: 20, color: "#a8f0c4" }}>Shiny</span>}</h1>
                  <div style={{ display: "flex", gap: 6, marginTop: 11 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px 5px 7px", borderRadius: 999, border: "1px solid #dd4f7f", background: "rgba(221,79,127,.14)", font: "700 11.5px/1 Inter", color: "#f7c9d9" }}><img src={AB("types/psychic.webp")} alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />Psíquico</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px 5px 7px", borderRadius: 999, border: "1px solid #c96f9e", background: "rgba(201,111,158,.14)", font: "700 11.5px/1 Inter", color: "#f4d3e4" }}><img src={AB("types/fairy.webp")} alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />Fada</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 999, border: "1px solid rgba(216,138,74,.3)", background: "rgba(229,179,79,.08)", font: "700 11.5px/1 Inter", color: "#e5b34f" }}>Venda e troca</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "none", padding: "11px 16px", borderRadius: 11, border: "1px solid rgba(229,179,79,.3)", background: "linear-gradient(180deg,rgba(120,26,26,.5),rgba(48,14,12,.6))" }}>
                  <img src={AB("diamante.png")} alt="Diamonds" style={{ width: 30, height: 30, objectFit: "contain", filter: "drop-shadow(0 0 8px rgba(70,140,255,.5))" }} />
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}><span style={{ font: "700 30px/1 Cinzel, serif", color: "#f6e7c8" }}>{precoAnuncio}</span><span style={{ font: "700 10px/1 Inter", letterSpacing: ".16em", textTransform: "uppercase", color: "#c9a986" }}>{listing?.moeda === "brl" ? "Reais" : "Diamonds"}</span></div>
                    <div style={{ marginTop: 6, font: "600 10.5px/1 Inter", color: "#e5b34f" }}>Aceita propostas</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: ehPokemon ? undefined : "none", borderRadius: 12, border: "1px solid rgba(216,138,74,.18)", background: "linear-gradient(180deg,#181110,#100b09)", padding: "15px 18px 17px" }}>
              <div style={{ font: "800 9.5px/1 Inter", letterSpacing: ".16em", textTransform: "uppercase", color: "#e5b34f" }}>Descrição do anúncio</div>
              <p style={{ margin: "10px 0 0", fontSize: 13.5, lineHeight: 1.6, color: "#b5a196" }}>{listing?.descricao || "Pokémon anunciado pela comunidade VP Bazaar. Combine a entrega e as condições pelo chat da plataforma."}</p>
            </div>

            <div style={{ borderRadius: 12, border: "1px solid rgba(216,138,74,.18)", background: "linear-gradient(180deg,#181110,#100b09)", padding: "15px 18px 17px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                <div style={{ font: "800 9.5px/1 Inter", letterSpacing: ".16em", textTransform: "uppercase", color: "#e5b34f" }}>Informações do pokémon</div>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ font: "700 9.5px/1 Inter", letterSpacing: ".14em", textTransform: "uppercase", color: "#7d6d64" }}>IV total</span>
                  <span style={{ font: "700 15px/1 Cinzel, serif", color: "#e5b34f" }}>{total}<span style={{ fontSize: 11.5, color: "#8a7a70" }}>/192</span></span>
                  <span style={{ width: 96, height: 5, borderRadius: 3, background: "rgba(216,138,74,.16)", overflow: "hidden" }}><span style={{ display: "block", width: pctTotal, height: "100%", borderRadius: 3, background: "linear-gradient(90deg,#c9962f,#f6e2b0)" }} /></span>
                  <span style={{ font: "700 10.5px/1 Inter", color: "#7fd9a2" }}>{pctTotal}</span>
                </div>
              </div>
              <div className="bzad-ivs" style={{ display: "grid", gridTemplateColumns: "244px minmax(0,1fr)", gap: 18, marginTop: 14, alignItems: "start" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 1, borderRadius: 9, overflow: "hidden", background: "rgba(216,138,74,.12)" }}>
                  {fichaTecnica.map((f) => (
                    <div key={f.rotulo} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 12px", background: "#150e0c" }}>
                      <span style={{ flex: "none", font: "600 11.5px/1 Inter", whiteSpace: "nowrap", color: "#8a7a70" }}>{f.rotulo}</span>
                      <span style={{ minWidth: 0, textAlign: "right", font: "700 12.5px/1 Inter", whiteSpace: "nowrap", color: f.cor }}>{f.valor}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {ivs.map(([rotulo, v, icone]) => (
                    <div key={rotulo} style={{ display: "grid", gridTemplateColumns: "86px minmax(0,1fr) 52px", alignItems: "center", gap: 11 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 7, font: "600 11.5px/1 Inter", color: "#a4937e" }}><i role="img" aria-label={rotulo} style={{ flex: "none", width: 15, height: 15, background: F(icone), backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />{rotulo}</span>
                      <span style={{ height: 7, borderRadius: 4, background: "rgba(216,138,74,.14)", overflow: "hidden" }}><span style={{ display: "block", width: (v / 32 * 100).toFixed(1) + "%", height: "100%", borderRadius: 4, background: barraIv(v) }} /></span>
                      <span style={{ textAlign: "right", font: "700 12.5px/1 Inter", color: corIv(v) }}>{v}<span style={{ fontSize: 10, color: "#7d6d64" }}>/32</span></span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(216,138,74,.12)" }}>
                <span style={{ font: "800 9.5px/1 Inter", letterSpacing: ".16em", textTransform: "uppercase", color: "#7d6d64" }}>Moves</span>
                {moves.map((m) => <span key={m} style={{ padding: "6px 11px", borderRadius: 7, border: "1px solid rgba(216,138,74,.22)", background: "rgba(10,6,5,.55)", font: "600 11.5px/1 Inter", color: "#d8c4b6" }}>{m}</span>)}
              </div>
            </div>

            <div style={{ borderRadius: 12, border: "1px solid rgba(216,138,74,.18)", background: "rgba(18,12,10,.8)", padding: "14px 18px 16px" }}>
              <div style={{ font: "800 9.5px/1 Inter", letterSpacing: ".16em", textTransform: "uppercase", color: "#7d6d64" }}>Condições do vendedor</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "6px 22px", marginTop: 10 }}>
                {condicoes.map((c) => <div key={c} style={{ display: "flex", gap: 8, fontSize: 12.5, lineHeight: 1.45, color: "#a4937e" }}><span style={{ color: "#c33629" }}>◆</span>{c}</div>)}
              </div>
            </div>
          </div>

          {/* LADO */}
          <div className="bzad-lado" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ borderRadius: 12, border: "1px solid rgba(216,138,74,.22)", background: "linear-gradient(180deg,#1c1412,#110b09)", padding: 16 }}>
              <div style={{ font: "800 9.5px/1 Inter", letterSpacing: ".16em", textTransform: "uppercase", color: "#7d6d64" }}>Vendedor</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
                <span style={{ flex: "none", width: 52, height: 52, borderRadius: "50%", overflow: "hidden", display: "grid", placeItems: "center", border: "1px solid rgba(216,138,74,.34)", background: "radial-gradient(62% 62% at 50% 40%, rgba(221,79,127,.24), rgba(10,6,5,.9))" }}>
                  <img src={spriteAnuncio} alt={vendedorAnuncio} style={{ width: 44, height: 44, objectFit: "contain", imageRendering: "pixelated" }} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ font: "700 17px/1.1 Cinzel, serif", color: "#f7eee7" }}>{vendedorAnuncio}</div>
                  <div style={{ marginTop: 5, fontSize: 11.5, color: "#8a7a70" }}>Anunciante no VP Bazaar</div>
                </div>
              </div>
              <Link data-h="ghost" to="/bazaar/perfil/moonlight" style={{ display: "grid", placeItems: "center", marginTop: 12, padding: 10, borderRadius: 8, border: "1px solid rgba(216,138,74,.26)", font: "600 12px/1 Inter", color: "#d8c4b6", textDecoration: "none" }}>Ver perfil do vendedor</Link>
              <button data-h="neg" type="button" onClick={() => void negociar()} disabled={!listing} style={{ display: "grid", placeItems: "center", width: "100%", boxSizing: "border-box", marginTop: 8, padding: 13, borderRadius: 9, cursor: listing ? "pointer" : "default", border: "1px solid rgba(240,200,130,.5)", background: "linear-gradient(180deg,#a51f22,#6a1215)", boxShadow: "inset 0 1px 0 rgba(255,220,160,.3)", font: "700 13px/1 Cinzel, serif", letterSpacing: ".12em", textTransform: "uppercase", color: "#fff" }}>Negociar</button>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 8 }}>
                <button data-h="ghost" onClick={() => setModal("share")} style={{ padding: "10px 6px", borderRadius: 8, cursor: "pointer", border: "1px solid rgba(216,138,74,.22)", background: "rgba(10,6,5,.5)", font: "600 11.5px/1 Inter", color: "#a4937e" }}>Compartilhar</button>
                <button data-h="report" onClick={() => { setModal("report"); setEnviada(false); setMotivo(""); setDetalhes(""); }} style={{ padding: "10px 6px", borderRadius: 8, cursor: "pointer", border: "1px solid rgba(195,54,41,.34)", background: "rgba(38,12,11,.5)", font: "600 11.5px/1 Inter", color: "#e0a49b" }}>Denunciar</button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, padding: "13px 15px", borderRadius: 11, border: "1px solid rgba(216,138,74,.16)", background: "rgba(18,12,10,.8)" }}>
              <span style={{ flex: "none", width: 6, height: 6, marginTop: 5, borderRadius: "50%", background: "#c33629", boxShadow: "0 0 8px #c33629" }} />
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "#8a7a70" }}>Negocie sempre pelo chat da plataforma. A proteção da VP existe <b style={{ color: "#e5b34f", fontWeight: 600 }}>somente com o intermédio oficial</b>.</p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL SHARE */}
      {modal === "share" && (
        <div onClick={fecharModal} style={{ position: "fixed", inset: 0, zIndex: 60, display: "grid", placeItems: "center", padding: 26, background: "rgba(6,3,3,.8)", backdropFilter: "blur(5px)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 552, maxHeight: "88vh", overflow: "auto", borderRadius: 14, border: "1px solid rgba(229,179,79,.3)", background: "linear-gradient(180deg,#1c1412,#100b09)", boxShadow: "0 30px 70px rgba(0,0,0,.7)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 18px", borderBottom: "1px solid rgba(216,138,74,.16)" }}>
              <span style={{ font: "700 15px/1 Cinzel, serif", letterSpacing: ".06em", color: "#f7eee7" }}>Compartilhar anúncio</span>
              <button data-h="copy" onClick={fecharModal} style={{ width: 28, height: 28, display: "grid", placeItems: "center", borderRadius: 7, cursor: "pointer", border: "1px solid rgba(216,138,74,.24)", background: "none", fontSize: 14, color: "#a4937e" }}>×</button>
            </div>
            <div style={{ padding: "16px 18px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span style={{ font: "800 9px/1 Inter", letterSpacing: ".14em", textTransform: "uppercase", color: "#7d6d64" }}>Como chega para a pessoa</span>
                <div style={{ display: "flex", gap: 4, padding: 3, borderRadius: 8, border: "1px solid rgba(216,138,74,.16)", background: "rgba(10,6,5,.6)" }}>
                  {PLATS.map(([id, rotulo]) => {
                    const on = plataforma === id;
                    return <button key={id} onClick={() => setPlataforma(id)} style={{ padding: "6px 10px", borderRadius: 6, cursor: "pointer", border: `1px solid ${on ? "rgba(229,179,79,.5)" : "transparent"}`, background: on ? "rgba(229,179,79,.12)" : "transparent", font: "700 10px/1 Inter", color: on ? "#f7eee7" : "#8a7a70" }}>{rotulo}</button>;
                  })}
                </div>
              </div>

              <div style={{ marginTop: 11, padding: 12, borderRadius: 11, border: "1px solid rgba(216,138,74,.14)", background: atual[3] }}>
                {prevGrande ? (
                  <div style={{ borderRadius: 9, overflow: "hidden", border: `1px solid ${atual[4]}`, borderLeft: `4px solid ${prevAcento}`, background: "rgba(12,8,7,.92)" }}>
                    <div style={{ padding: "11px 13px 12px" }}>
                      <div style={{ font: "700 8.5px/1 Inter", letterSpacing: ".14em", textTransform: "uppercase", color: prevAcento }}>VP Bazaar</div>
                      <div style={{ marginTop: 7, font: "700 14px/1.25 Inter", color: "#8ea1e1" }}>{resumoCompartilhamento}</div>
                      <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.45, color: "#b9b0a7" }}>{mensagem.split("\n").slice(1, 3).join(" · ")}. Anúncio da comunidade com intermédio opcional da VP.</div>
                    </div>
                    <div style={{ position: "relative", aspectRatio: "1200/630", display: "grid", placeItems: "center", background: "radial-gradient(58% 58% at 62% 44%, rgba(221,79,127,.2), rgba(10,6,5,.95))", borderTop: "1px solid rgba(216,138,74,.12)" }}>
                      <img src={AB("logo-vpbazaar.webp")} alt="VP Bazaar" style={{ position: "absolute", top: 10, left: 12, height: 16, width: "auto", opacity: .9 }} />
                      <div style={{ position: "absolute", left: 12, bottom: 10 }}>
                        <div style={{ font: "700 17px/1 Cinzel, serif", color: "#f7eee7" }}>{tituloAnuncio}</div>
                        <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
                          <span style={{ padding: "3px 7px", borderRadius: 4, border: "1px solid rgba(229,179,79,.4)", font: "700 8.5px/1 Inter", color: "#f0d194" }}>Lendária 1,80</span>
                          <span style={{ padding: "3px 7px", borderRadius: 4, border: "1px solid rgba(126,217,162,.4)", font: "700 8.5px/1 Inter", color: "#a8f0c4" }}>IV {total}/192</span>
                          <span style={{ padding: "3px 7px", borderRadius: 4, border: "1px solid rgba(216,138,74,.3)", font: "700 8.5px/1 Inter", color: "#d8c4b6" }}>Lv. 100</span>
                        </div>
                      </div>
                      <div style={{ position: "absolute", right: 12, bottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                        <img src={AB("diamante.png")} alt="" style={{ width: 17, height: 17, objectFit: "contain" }} />
                        <span style={{ font: "700 19px/1 Cinzel, serif", color: "#e5b34f" }}>{precoAnuncio}</span>
                      </div>
                      <img src={spriteAnuncio} alt={tituloAnuncio} style={{ width: "46%", height: "80%", objectFit: "contain", imageRendering: "pixelated", transform: "translateX(18%)" }} />
                    </div>
                  </div>
                ) : (
                  <div style={{ maxWidth: 340, marginLeft: "auto", borderRadius: 9, overflow: "hidden", border: `1px solid ${atual[4]}`, background: atual[5] || "rgba(18,48,32,.9)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 78px", gap: 10, padding: 8, borderRadius: 7, background: "rgba(10,6,5,.55)", margin: 6 }}>
                      <div style={{ minWidth: 0, padding: "2px 0 0 4px" }}>
                        <div style={{ font: "700 11.5px/1.3 Inter", color: "#f7eee7" }}>{tituloAnuncio}</div>
                        <div style={{ marginTop: 5, fontSize: 10.5, color: "#b9b0a7" }}>{detalhesCompartilhamento} · {unidadeMoeda} {precoAnuncio}</div>
                        <div style={{ marginTop: 6, fontSize: 9.5, color: "#7d6d64" }}>{window.location.host}</div>
                      </div>
                      <i role="img" aria-label={tituloAnuncio} style={{ width: 78, height: 78, borderRadius: 6, background: `url(${spriteAnuncio}) center/78% no-repeat, radial-gradient(60% 60% at 50% 44%, rgba(221,79,127,.22), rgba(10,6,5,.9))`, imageRendering: "pixelated" }} />
                    </div>
                    <div style={{ padding: "2px 12px 10px", font: "400 11.5px/1.5 Inter", whiteSpace: "pre-line", color: "#e6ded6" }}>{mensagem}</div>
                  </div>
                )}
              </div>

              <p style={{ margin: "9px 0 0", fontSize: 11, lineHeight: 1.5, color: "#8a7a70" }}>{atual[6]}</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
                <a data-h="wa" href={"https://wa.me/?text=" + encodeURIComponent(mensagem)} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 13px", borderRadius: 9, border: "1px solid rgba(37,211,102,.34)", background: "rgba(12,34,22,.6)", font: "700 12px/1 Inter", color: "#a8e6bf", textDecoration: "none" }}>WhatsApp<span style={{ marginLeft: "auto", fontSize: 11, opacity: .6 }}>↗</span></a>
                <a data-h="dc" href="https://discord.com/channels/@me" onClick={() => copiar(mensagem, setCopiadoDiscord)} target="_blank" rel="noreferrer" title="Copia a mensagem pronta e abre o Discord" style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 13px", borderRadius: 9, border: "1px solid rgba(114,137,218,.34)", background: "rgba(24,28,52,.6)", font: "700 12px/1 Inter", color: "#c6cff2", textDecoration: "none" }}>{copiadoDiscord ? "Copiado — cole no canal" : "Discord"}<span style={{ marginLeft: "auto", fontSize: 11, opacity: .6 }}>↗</span></a>
                <a data-h="tg" href={"https://t.me/share/url?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent(resumoCompartilhamento)} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 13px", borderRadius: 9, border: "1px solid rgba(64,158,222,.34)", background: "rgba(12,28,44,.6)", font: "700 12px/1 Inter", color: "#b9d8f2", textDecoration: "none" }}>Telegram<span style={{ marginLeft: "auto", fontSize: 11, opacity: .6 }}>↗</span></a>
                <a data-h="x" href={"https://twitter.com/intent/tweet?text=" + encodeURIComponent(mensagem)} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 13px", borderRadius: 9, border: "1px solid rgba(216,138,74,.26)", background: "rgba(16,12,11,.7)", font: "700 12px/1 Inter", color: "#d8c4b6", textDecoration: "none" }}>X / Twitter<span style={{ marginLeft: "auto", fontSize: 11, opacity: .6 }}>↗</span></a>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <input type="text" value={url} readOnly style={{ flex: 1, minWidth: 0, padding: "11px 13px", borderRadius: 9, border: "1px solid rgba(216,138,74,.2)", background: "rgba(10,6,5,.65)", color: "#d8c4b6", fontSize: 12.5 }} />
                <button data-h="copy" onClick={() => copiar(url, setCopiadoLink)} style={{ flex: "none", padding: "11px 17px", borderRadius: 9, cursor: "pointer", border: "1px solid rgba(229,179,79,.4)", background: "rgba(229,179,79,.12)", font: "700 11.5px/1 Inter", letterSpacing: ".06em", color: "#f0d194" }}>{copiadoLink ? "Copiado ✓" : "Copiar"}</button>
              </div>
              <button data-h="ghost" onClick={() => copiar(mensagem, setCopiadoTexto)} style={{ display: "grid", placeItems: "center", width: "100%", marginTop: 8, padding: 11, borderRadius: 9, cursor: "pointer", border: "1px dashed rgba(216,138,74,.3)", background: "none", font: "600 11.5px/1 Inter", color: "#a4937e" }}>{copiadoTexto ? "Mensagem copiada ✓" : "Copiar mensagem pronta (nome, nível, qualidade, IV e preço)"}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REPORT */}
      {modal === "report" && (
        <div onClick={fecharModal} style={{ position: "fixed", inset: 0, zIndex: 60, display: "grid", placeItems: "center", padding: 26, background: "rgba(6,3,3,.8)", backdropFilter: "blur(5px)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 500, maxHeight: "88vh", overflow: "auto", borderRadius: 14, border: "1px solid rgba(195,54,41,.34)", background: "linear-gradient(180deg,#1d1210,#100b09)", boxShadow: "0 30px 70px rgba(0,0,0,.7)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 18px", borderBottom: "1px solid rgba(195,54,41,.22)" }}>
              <span style={{ font: "700 15px/1 Cinzel, serif", letterSpacing: ".06em", color: "#f7eee7" }}>Denunciar anúncio</span>
              <button data-h="copy" onClick={fecharModal} style={{ width: 28, height: 28, display: "grid", placeItems: "center", borderRadius: 7, cursor: "pointer", border: "1px solid rgba(216,138,74,.24)", background: "none", fontSize: 14, color: "#a4937e" }}>×</button>
            </div>
            {enviada ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "34px 24px 30px", textAlign: "center" }}>
                <span style={{ width: 44, height: 44, display: "grid", placeItems: "center", borderRadius: "50%", border: "1px solid rgba(126,217,162,.45)", background: "rgba(20,50,36,.6)", fontSize: 18, color: "#a8f0c4" }}>✓</span>
                <div style={{ font: "700 17px/1.2 Cinzel, serif", color: "#f7eee7" }}>Denúncia registrada</div>
                <p style={{ margin: 0, maxWidth: "36ch", fontSize: 12.5, lineHeight: 1.55, color: "#8a7a70" }}>Protocolo <b style={{ color: "#e5b34f", fontWeight: 600 }}>#VP-4821</b>. A administração da VP recebeu o caso com o histórico do anúncio. O vendedor não sabe quem denunciou.</p>
                <button data-h="copy" onClick={fecharModal} style={{ marginTop: 4, padding: "11px 20px", borderRadius: 9, cursor: "pointer", border: "1px solid rgba(216,138,74,.3)", background: "rgba(229,179,79,.1)", font: "700 11.5px/1 Inter", color: "#f0d194" }}>Fechar</button>
              </div>
            ) : (
              <div style={{ padding: "16px 18px 18px" }}>
                <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: "#a4937e" }}>A denúncia vai direto para a administração da VP com o histórico do anúncio. O vendedor <b style={{ color: "#f7eee7", fontWeight: 600 }}>não é notificado</b> de quem denunciou.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 13 }}>
                  {MOTIVOS.map(([id, rotulo]) => {
                    const on = motivo === id;
                    return (
                      <button key={id} data-h="motivo" onClick={() => setMotivo(id)} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", padding: "11px 13px", borderRadius: 9, cursor: "pointer", border: `1px solid ${on ? "rgba(229,179,79,.5)" : "rgba(216,138,74,.16)"}`, background: on ? "rgba(229,179,79,.1)" : "rgba(10,6,5,.5)", font: "600 12.5px/1.3 Inter", color: on ? "#f7eee7" : "#a4937e" }}>
                        <span style={{ flex: "none", width: 15, height: 15, borderRadius: "50%", display: "grid", placeItems: "center", border: `1px solid ${on ? "#e5b34f" : "rgba(216,138,74,.35)"}` }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: on ? "#e5b34f" : "transparent" }} /></span>{rotulo}
                      </button>
                    );
                  })}
                </div>
                <label style={{ display: "block", marginTop: 13 }}>
                  <span style={{ display: "block", font: "800 9px/1 Inter", letterSpacing: ".14em", textTransform: "uppercase", color: "#7d6d64", marginBottom: 7 }}>Detalhes {motivo === "outro" ? "(obrigatório)" : "(opcional)"}</span>
                  <textarea value={detalhes} onChange={(e) => setDetalhes(e.target.value)} rows={3} placeholder="Conte o que aconteceu, prints e nicks envolvidos…" style={{ width: "100%", boxSizing: "border-box", padding: "11px 13px", borderRadius: 9, border: "1px solid rgba(216,138,74,.2)", background: "rgba(10,6,5,.65)", color: "#f7eee7", fontSize: 12.5, lineHeight: 1.5, resize: "vertical" }} />
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 8, marginTop: 13 }}>
                  <button data-h="copy" onClick={fecharModal} style={{ padding: 12, borderRadius: 9, cursor: "pointer", border: "1px solid rgba(216,138,74,.22)", background: "rgba(10,6,5,.5)", font: "600 12px/1 Inter", color: "#a4937e" }}>Cancelar</button>
                  <button data-h="send" onClick={() => void denunciar()} disabled={!podeEnviar || !listing} style={{ padding: 12, borderRadius: 9, cursor: podeEnviar && listing ? "pointer" : "default", border: `1px solid ${podeEnviar ? "rgba(240,200,130,.45)" : "rgba(216,138,74,.18)"}`, background: podeEnviar ? "linear-gradient(180deg,#a51f22,#6a1215)" : "rgba(10,6,5,.5)", font: "700 12px/1 Inter", letterSpacing: ".06em", color: podeEnviar ? "#fff" : "#7d6d64", opacity: podeEnviar ? 1 : .7 }}>Enviar denúncia</button>
                </div>
                <p style={{ margin: "9px 0 0", fontSize: 11, lineHeight: 1.45, color: "#7d6d64" }}>{!motivo ? "Escolha um motivo para enviar." : precisaDetalhe ? "Para \"outro motivo\", descreva o que aconteceu em pelo menos uma frase." : "Denúncias falsas em série também são analisadas pela administração."}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
