import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyProfile, updateMyProfile } from "../../../services/profileService";
import { listMine, updateListingStatus } from "../../../services/listingsService";
import { useAuth } from "../../../contexts/AuthContext";
import { ApiError } from "../../../services/api";
import type { Listing } from "../../../types/listing";
import { AdCard, AVATARES, ativo, iniciaisDe, JOGOS, SPRITES } from "./profileShared";

// Migração pixel-perfect da vista "Minha conta" de "VP Bazaar - Perfil.dc.html".
// Campos com backend real (bio, avatar) são persistidos; nick/e-mail vêm da conta;
// preferências de aviso e vínculos de jogo ficam locais até ganharem endpoint próprio.

const SCOPED = `
.bzconta input:focus,.bzconta textarea:focus{outline:none;border-color:#e5b34f}
.bzconta input::placeholder,.bzconta textarea::placeholder{color:#7d6d64}
.bzconta [data-h=sec]:hover{border-color:rgba(229,179,79,.4) !important}
.bzconta [data-h=sair]:hover{border-color:#c33629 !important;color:#f7d9d2 !important}
.bzconta [data-h=av]:hover{border-color:rgba(229,179,79,.55) !important}
.bzconta [data-h=vinc]:hover{border-color:#e5b34f !important;color:#f6d68f !important}
.bzconta [data-h=ad]:hover{border-color:rgba(229,179,79,.42) !important;transform:translateY(-2px)}
.bzconta [data-h=acao]:hover{border-color:#e5b34f !important;color:#f6d68f !important}
.bzconta [data-h=salvar]:hover,.bzconta [data-h=chat]:hover{filter:brightness(1.13)}
.bzconta [data-h=reset]:hover,.bzconta [data-h=filtro]:hover{color:#f6d68f}
`;

const AVISOS: Array<[string, string, string]> = [
  ["proposta", "Nova proposta", "Alguém ofereceu um valor em um anúncio seu"],
  ["mensagem", "Mensagem no chat", "Resposta em uma negociação aberta"],
  ["intermedio", "Intermédio", "Moderador entrou ou liberou a entrega"],
  ["resumo", "Resumo semanal", "Quantas visitas e propostas seus anúncios tiveram"],
];

const rotuloEstado: Record<string, string> = { ativos: "Ativos", pausados: "Pausados", vendidos: "Vendidos" };
const chaveEstado: Record<string, string> = { ativos: "ativo", pausados: "pausado", vendidos: "vendido" };

export function ContaPage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [secao, setSecao] = useState<"dados" | "notificacoes">("dados");
  const [bio, setBio] = useState("");
  const [contact, setContact] = useState("");
  const [preferredContact, setPreferredContact] = useState("Chat do Bazaar");
  const [avatar, setAvatar] = useState("inicial");
  const [avisos, setAvisos] = useState<Record<string, boolean>>({ proposta: true, mensagem: true, intermedio: true, resumo: false });
  const [vinculado, setVinculado] = useState<Record<string, string>>({ pip: "", pwg: "" });
  const [filtro, setFiltro] = useState<"ativos" | "pausados" | "vendidos">("ativos");
  const [anuncios, setAnuncios] = useState<Listing[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [alterando, setAlterando] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.username) return;
    const controller = new AbortController();
    setCarregando(true);
    getMyProfile(controller.signal)
      .then((result) => {
        setBio(result.bio);
        setContact(result.contact);
        setPreferredContact(result.preferredContact || "Chat do Bazaar");
        setAvatar(result.avatar || "inicial");
        setCarregando(false);
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") {
          setErro(err.message);
          setCarregando(false);
        }
      });
    listMine(controller.signal).then(setAnuncios).catch(() => undefined);
    return () => controller.abort();
  }, [user?.username]);

  const salvar = async () => {
    setErro(null);
    setSalvando(true);
    try {
      await updateMyProfile({ bio, contact, preferredContact, avatar });
      await refreshUser();
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2600);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  };

  const mudarEstado = async (l: Listing, status: string) => {
    setAlterando(l.id);
    try {
      const atualizado = await updateListingStatus(l.id, status);
      setAnuncios((prev) => prev.map((item) => (item.id === l.id ? atualizado : item)));
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Falha ao alterar o status.");
    } finally {
      setAlterando(null);
    }
  };

  if (carregando) {
    return (
      <main style={{ background: "#0a0605", minHeight: "100vh", paddingBottom: 52 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 26px", color: "#a4937e" }}>Carregando conta…</div>
      </main>
    );
  }

  const nick = user?.username ?? "";
  const iniciais = iniciaisDe(nick);
  const contagem = {
    ativos: anuncios.filter((a) => a.status === "ativo").length,
    pausados: anuncios.filter((a) => a.status === "pausado").length,
    vendidos: anuncios.filter((a) => a.status === "vendido").length,
  };
  const lista = anuncios.filter((a) => a.status === chaveEstado[filtro]);

  const secoes: Array<{ id: "dados" | "notificacoes"; rotulo: string; sub: string; icone: string }> = [
    { id: "dados", rotulo: "Dados e avatar", sub: "Nick, e-mail, bio e vínculos", icone: "☰" },
    { id: "notificacoes", rotulo: "Notificações", sub: "O que você quer receber", icone: "◆" },
  ];

  return (
    <main className="bzconta" style={{ background: "#0a0605", minHeight: "100vh", paddingBottom: 52 }}>
      <style>{SCOPED}</style>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "22px 26px 0" }}>

        <div>
          <span style={{ font: "800 10px/1 Inter", letterSpacing: ".2em", textTransform: "uppercase", color: "#c33629" }}>Conta</span>
          <h1 style={{ margin: "11px 0 0", font: "700 28px/1.1 Cinzel, serif", color: "#f7eee7" }}>Minha conta</h1>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "#a4937e" }}>Olá, <b style={{ color: "#e5b34f", fontWeight: 600 }}>{nick}</b> — seus dados, como você aparece nos anúncios e o que recebe de aviso.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "264px minmax(0,1fr)", gap: 16, alignItems: "start", marginTop: 16 }} data-grid="conta">

          <aside style={{ position: "sticky", top: 74, display: "flex", flexDirection: "column", gap: 5, padding: 8, borderRadius: 12, border: "1px solid rgba(216,138,74,.2)", background: "linear-gradient(180deg,#181110,#110b0a)" }}>
            {secoes.map((s) => {
              const on = secao === s.id, a = ativo(on);
              return (
                <button key={s.id} data-h="sec" type="button" onClick={() => setSecao(s.id)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 12px", borderRadius: 9, cursor: "pointer", border: `1px solid ${a.borda}`, background: a.fundo, textAlign: "left" }}>
                  <span style={{ flex: "none", width: 20, textAlign: "center", fontSize: 13, color: on ? "#e5b34f" : "#7d6d64" }}>{s.icone}</span>
                  <span style={{ minWidth: 0 }}>
                    <b style={{ display: "block", font: "700 12.5px/1.2 Inter", color: a.cor }}>{s.rotulo}</b>
                    <small style={{ display: "block", marginTop: 3, fontSize: 10.5, color: "#7d6d64" }}>{s.sub}</small>
                  </span>
                </button>
              );
            })}
            <button data-h="sair" type="button" onClick={() => { logout(); navigate("/bazaar/login"); }} style={{ display: "block", marginTop: 4, padding: "11px 12px", borderRadius: 9, cursor: "pointer", border: "1px solid rgba(195,54,41,.26)", background: "none", font: "600 11.5px/1 Inter", textAlign: "center", color: "#e0a49b" }}>Sair da conta</button>
          </aside>

          <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>

            {secao === "dados" && (
              <>
                <section style={{ padding: "18px 20px 20px", borderRadius: 12, border: "1px solid rgba(216,138,74,.2)", background: "linear-gradient(180deg,#1a1210,#100b09)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                    <b style={{ font: "800 10px/1 Inter", letterSpacing: ".16em", textTransform: "uppercase", color: "#e5b34f" }}>Dados da conta</b>
                    {salvo && <span style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 11px", borderRadius: 999, border: "1px solid rgba(126,217,162,.4)", background: "rgba(20,50,36,.4)", font: "700 10px/1 Inter", color: "#a8f0c4" }}>✓ Alterações salvas</span>}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginTop: 15 }} data-grid="dados">
                    <label style={{ display: "block" }}>
                      <span style={{ display: "block", font: "800 9px/1 Inter", letterSpacing: ".14em", textTransform: "uppercase", color: "#c9a86a", marginBottom: 7 }}>Nick no Bazaar</span>
                      <input type="text" value={nick} readOnly style={{ width: "100%", boxSizing: "border-box", padding: "12px 13px", borderRadius: 9, border: "1px solid rgba(216,138,74,.2)", background: "rgba(10,6,5,.65)", color: "#f7eee7", fontSize: 13 }} />
                    </label>
                    <label style={{ display: "block" }}>
                      <span style={{ display: "block", font: "800 9px/1 Inter", letterSpacing: ".14em", textTransform: "uppercase", color: "#c9a86a", marginBottom: 7 }}>E-mail</span>
                      <input type="email" value={user?.email ?? ""} readOnly style={{ width: "100%", boxSizing: "border-box", padding: "12px 13px", borderRadius: 9, border: "1px solid rgba(216,138,74,.2)", background: "rgba(10,6,5,.65)", color: "#f7eee7", fontSize: 13 }} />
                    </label>
                  </div>

                  <label style={{ display: "block", marginTop: 11 }}>
                    <span style={{ display: "block", font: "800 9px/1 Inter", letterSpacing: ".14em", textTransform: "uppercase", color: "#c9a86a", marginBottom: 7 }}>Sobre você <i style={{ fontStyle: "normal", letterSpacing: 0, textTransform: "none", color: "#7d6d64" }}>— aparece no seu perfil público</i></span>
                    <textarea value={bio} onChange={(e) => { setBio(e.target.value); setSalvo(false); }} rows={2} placeholder="O que você costuma vender, como entrega, horários…" style={{ width: "100%", boxSizing: "border-box", padding: "12px 13px", borderRadius: 9, border: "1px solid rgba(216,138,74,.2)", background: "rgba(10,6,5,.65)", color: "#f7eee7", fontSize: 13, lineHeight: 1.5, resize: "vertical" }} />
                  </label>

                  <div style={{ marginTop: 15, paddingTop: 14, borderTop: "1px solid rgba(216,138,74,.14)" }}>
                    <b style={{ font: "800 9px/1 Inter", letterSpacing: ".14em", textTransform: "uppercase", color: "#c9a86a" }}>Contas do jogo vinculadas</b>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginTop: 10 }}>
                      {(["pip", "pwg"] as const).map((id) => {
                        const j = JOGOS[id], vinc = vinculado[id];
                        return (
                          <div key={id} style={{ display: "flex", alignItems: "center", gap: 11, padding: 12, borderRadius: 10, border: `1px solid ${vinc ? j.borda : "rgba(216,138,74,.16)"}`, background: vinc ? j.fundo : "rgba(10,6,5,.45)" }}>
                            <i role="img" aria-label={j.nome} style={{ flex: "none", width: 32, height: 24, background: `url(${j.logo})`, backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat", opacity: vinc ? 1 : .5 }} />
                            <span style={{ minWidth: 0, flex: 1 }}>
                              <b style={{ display: "block", font: "700 11px/1.2 Inter", color: vinc ? "#f7eee7" : "#a4937e" }}>{j.nome}</b>
                              <small style={{ display: "block", marginTop: 4, fontSize: 10.5, color: vinc ? "#7fd9a2" : "#7d6d64" }}>{vinc ? `Vinculada · ${vinc}` : "Sem vínculo"}</small>
                            </span>
                            <button data-h="vinc" type="button" onClick={() => setVinculado((v) => ({ ...v, [id]: vinc ? "" : nick }))} style={{ flex: "none", padding: "7px 11px", borderRadius: 7, cursor: "pointer", border: "1px solid rgba(216,138,74,.26)", background: "none", font: "700 10px/1 Inter", color: "#c9a86a" }}>{vinc ? "Trocar" : "Vincular"}</button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(216,138,74,.14)" }}>
                    <Link data-h="reset" to="/bazaar/login" style={{ font: "600 12px/1 Inter", color: "#c9a86a" }}>Redefinir senha →</Link>
                    {erro && <span style={{ fontSize: 11.5, color: "#e0a49b" }}>{erro}</span>}
                    <button data-h="salvar" type="button" onClick={salvar} disabled={salvando} style={{ padding: "12px 22px", borderRadius: 9, cursor: "pointer", border: "1px solid rgba(240,200,130,.45)", background: "linear-gradient(180deg,#a51f22,#6a1215)", boxShadow: "inset 0 1px 0 rgba(255,220,160,.24)", font: "700 11.5px/1 Cinzel, serif", letterSpacing: ".14em", textTransform: "uppercase", color: "#fff" }}>{salvando ? "Salvando…" : "Salvar alterações"}</button>
                  </div>
                </section>

                <section style={{ padding: "18px 20px 20px", borderRadius: 12, border: "1px solid rgba(216,138,74,.2)", background: "linear-gradient(180deg,#1a1210,#100b09)" }}>
                  <b style={{ font: "800 10px/1 Inter", letterSpacing: ".16em", textTransform: "uppercase", color: "#e5b34f" }}>Avatar</b>
                  <p style={{ margin: "7px 0 12px", fontSize: 12, lineHeight: 1.5, color: "#8a7a70" }}>Use as iniciais do seu nick ou um sprite da sua coleção. Aparece no chat, nos anúncios e no seu perfil.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(88px,1fr))", gap: 9 }}>
                    {AVATARES.map(([id, nome, dex]) => {
                      const on = avatar === id, a = ativo(on);
                      return (
                        <button key={id} data-h="av" type="button" onClick={() => { setAvatar(id); setSalvo(false); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, padding: "11px 6px", borderRadius: 10, cursor: "pointer", border: `1px solid ${a.borda}`, background: a.fundo }}>
                          <span style={{ width: 44, height: 44, display: "grid", placeItems: "center", borderRadius: "50%", background: dex ? "radial-gradient(60% 60% at 50% 45%, #3b2415, #1a1009)" : "linear-gradient(160deg,#f0d194,#c08a3a)", border: "1px solid rgba(240,200,130,.32)", overflow: "hidden" }}>
                            <i role="img" aria-label={nome} style={{ width: "100%", height: "100%", background: dex ? `url(${SPRITES}shiny/${dex}.png)` : "none", backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat", imageRendering: "pixelated", display: dex ? "block" : "none" }} />
                            <span style={{ display: dex ? "none" : "block", font: "800 12px/1 Inter", color: "#2a1608" }}>{iniciais}</span>
                          </span>
                          <span style={{ font: "600 10px/1.2 Inter", textAlign: "center", color: a.cor }}>{nome}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </>
            )}

            {secao === "notificacoes" && (
              <section style={{ padding: "18px 20px 20px", borderRadius: 12, border: "1px solid rgba(216,138,74,.2)", background: "linear-gradient(180deg,#1a1210,#100b09)" }}>
                <b style={{ font: "800 10px/1 Inter", letterSpacing: ".16em", textTransform: "uppercase", color: "#e5b34f" }}>Notificações</b>
                <p style={{ margin: "7px 0 13px", fontSize: 12, lineHeight: 1.5, color: "#8a7a70" }}>Avisos por e-mail e no Discord vinculado.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 1, borderRadius: 10, overflow: "hidden", background: "rgba(216,138,74,.12)" }}>
                  {AVISOS.map(([id, rotulo, sub]) => {
                    const on = !!avisos[id];
                    return (
                      <button key={id} type="button" onClick={() => setAvisos((a) => ({ ...a, [id]: !a[id] }))} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 15px", cursor: "pointer", border: 0, background: "#150e0c", textAlign: "left" }}>
                        <span style={{ minWidth: 0, flex: 1 }}>
                          <b style={{ display: "block", font: "700 12.5px/1.2 Inter", color: "#f7eee7" }}>{rotulo}</b>
                          <small style={{ display: "block", marginTop: 4, fontSize: 11, color: "#8a7a70" }}>{sub}</small>
                        </span>
                        <span style={{ flex: "none", width: 38, height: 21, padding: 2, boxSizing: "border-box", borderRadius: 999, background: on ? "rgba(126,217,162,.3)" : "rgba(10,6,5,.7)", border: `1px solid ${on ? "rgba(126,217,162,.5)" : "rgba(216,138,74,.22)"}`, display: "flex", justifyContent: on ? "flex-end" : "flex-start" }}>
                          <span style={{ width: 15, height: 15, borderRadius: "50%", background: on ? "#7fd9a2" : "#5d4c3c" }} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            <section style={{ padding: "18px 20px 20px", borderRadius: 12, border: "1px solid rgba(216,138,74,.2)", background: "linear-gradient(180deg,#1a1210,#100b09)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 5, padding: 4, borderRadius: 10, border: "1px solid rgba(216,138,74,.18)", background: "rgba(10,6,5,.6)" }}>
                  {(["ativos", "pausados", "vendidos"] as const).map((id) => {
                    const on = filtro === id, a = ativo(on);
                    return (
                      <button key={id} data-h="filtro" type="button" onClick={() => setFiltro(id)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 13px", borderRadius: 7, cursor: "pointer", border: `1px solid ${a.borda}`, background: a.fundo, font: "700 11.5px/1 Inter", color: a.cor }}>
                        {rotuloEstado[id]}<span style={{ fontWeight: 700, color: on ? "#e5b34f" : "#7d6d64" }}>{contagem[id]}</span>
                      </button>
                    );
                  })}
                </div>
                <span style={{ fontSize: 11.5, color: "#7d6d64" }}>Editar, pausar ou encerrar direto na lista.</span>
              </div>

              {lista.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 11, marginTop: 14 }}>
                  {lista.map((l) => {
                    const acoes = [
                      { icone: "✎", titulo: "Editar anúncio", cor: "#c9a86a", borda: "rgba(216,138,74,.24)", aoClicar: () => navigate(`/bazaar/anunciar/${l.id}`) },
                      { icone: l.status === "pausado" ? "▶" : "❙❙", titulo: l.status === "pausado" ? "Reativar anúncio" : "Pausar anúncio", cor: "#c9a86a", borda: "rgba(216,138,74,.24)", aoClicar: () => mudarEstado(l, l.status === "pausado" ? "ativo" : "pausado") },
                      { icone: "✕", titulo: "Marcar como vendido", cor: "#e0a49b", borda: "rgba(195,54,41,.28)", aoClicar: () => mudarEstado(l, "vendido") },
                    ];
                    return (
                      <AdCard key={l.id} listing={l} thumbTo={`/bazaar/anuncio/${l.id}`} tituloTo={`/bazaar/anuncio/${l.id}`}
                        rodape={
                          <span style={{ marginLeft: "auto", display: "flex", gap: 5, flex: "none" }}>
                            {acoes.map((b, i) => (
                              <button key={i} data-h="acao" type="button" title={b.titulo} disabled={alterando === l.id} onClick={b.aoClicar} style={{ width: 26, height: 26, display: "grid", placeItems: "center", borderRadius: 7, cursor: "pointer", border: `1px solid ${b.borda}`, background: "rgba(10,6,5,.5)", fontSize: 11, color: b.cor }}>{b.icone}</button>
                            ))}
                          </span>
                        } />
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 11, padding: "44px 20px", marginTop: 14, border: "1px dashed rgba(216,138,74,.22)", borderRadius: 11, textAlign: "center" }}>
                  <b style={{ font: "700 15px/1.2 Cinzel, serif", color: "#f7eee7" }}>{filtro === "vendidos" ? "Nada vendido ainda" : "Nenhum anúncio aqui"}</b>
                  <p style={{ margin: 0, maxWidth: "40ch", fontSize: 12, lineHeight: 1.5, color: "#8a7a70" }}>Publique um anúncio para ele aparecer nesta lista.</p>
                  <Link data-h="chat" to="/bazaar/anunciar" style={{ padding: "11px 19px", borderRadius: 8, border: "1px solid rgba(216,138,74,.34)", background: "rgba(229,179,79,.1)", font: "700 11.5px/1 Inter", color: "#f0d194" }}>Criar anúncio</Link>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
