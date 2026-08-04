import { useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { ApiError } from "../../../services/api";

// Migração pixel-perfect de "VP Bazaar - Entrar.dc.html" (conteúdo; Header/Footer ficam no BazaarLayout).
// Formulário e-mail/senha integrados à autenticação real (useAuth: login/register).

const A = (p: string) => `/assets/bazaar/${p}`;
const JOGOS: Record<string, { nome: string; logo: string; cor: string }> = {
  pip: { nome: "Poke Idle World", logo: A("logo-pokeidleworld.png"), cor: "#9dbbe2" },
  pwg: { nome: "Poke Web Games", logo: A("logo-pokewebgames.png"), cor: "#e8aaaa" },
};
const ARGUMENTOS = [
  { marca: "1", texto: "Anúncios com nível, IV e qualidade reais — o filtro entende o que você procura." },
  { marca: "2", texto: "Chat próprio por anúncio, com histórico e confirmação de recebimento." },
  { marca: "3", texto: "Intermédio opcional: um moderador segura o item até as duas partes confirmarem." },
];
const PALETA = ["#5d4c3c", "#e8654a", "#e5b34f", "#7fd9a2", "#7fd9a2"];
const ROTULOS_FORCA = ["", "Fraca — use 8+ caracteres", "Razoável — misture números", "Boa senha", "Senha forte"];

const SCOPED = `
.bzauth input:focus{outline:none;border-color:#e5b34f}
.bzauth input::placeholder{color:#7d6d64}
.bzauth a{color:#e5b34f;text-decoration:none}.bzauth a:hover{color:#f6d68f}
.bzauth [data-h=ghost]:hover{color:#e5b34f}
.bzauth [data-h=submit]:hover,.bzauth [data-h=success-primary]:hover{filter:brightness(1.13)}
.bzauth [data-h=discord]:hover{border-color:#7289da !important;background:rgba(34,40,72,.8) !important}
.bzauth [data-h=game]:hover{border-color:rgba(229,179,79,.55) !important}
.bzauth [data-h=tab]:hover{color:#f7eee7}
.bzauth [data-h=success-secondary]:hover{border-color:#e5b34f !important;color:#f7eee7 !important}
@media (max-width:980px){.bzauth-grid{grid-template-columns:minmax(0,1fr) !important}.bzauth-art{display:none !important}}
`;

const inputStyle: CSSProperties = { width: "100%", boxSizing: "border-box", padding: "12px 13px", borderRadius: 9, border: "1px solid rgba(216,138,74,.22)", background: "rgba(10,6,5,.7)", color: "#f7eee7", fontSize: 13.5 };
const labelCap: CSSProperties = { display: "block", font: "800 9px/1 Inter", letterSpacing: ".14em", textTransform: "uppercase", color: "#e5b34f", marginBottom: 7 };
const primaryBtn: CSSProperties = { width: "100%", padding: 14, borderRadius: 9, cursor: "pointer", border: "1px solid rgba(240,200,130,.45)", background: "linear-gradient(180deg,#a51f22,#6a1215)", boxShadow: "inset 0 1px 0 rgba(255,220,160,.24)", font: "700 12.5px/1 Cinzel, serif", letterSpacing: ".14em", textTransform: "uppercase", color: "#fff" };

export function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [modo, setModo] = useState("login");
  const [aba, setAba] = useState("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nick, setNick] = useState("");
  const [nickJogo, setNickJogo] = useState("");
  const [jogo, setJogo] = useState("");
  const [lembrar, setLembrar] = useState(true);
  const [termos, setTermos] = useState(false);
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [linkEnviado, setLinkEnviado] = useState(false);
  const [busy, setBusy] = useState(false);

  const cadastro = aba === "cadastro";
  const forca = (() => { const s = senha; let n = 0; if (s.length >= 8) n++; if (/[A-Z]/.test(s) && /[a-z]/.test(s)) n++; if (/[0-9]/.test(s)) n++; if (/[^A-Za-z0-9]/.test(s) && s.length >= 10) n++; return s ? Math.max(1, n) : 0; })();
  const marca = (on: boolean) => on ? "✓" : "";
  const caixa = (on: boolean) => ({ borda: on ? "#e5b34f" : "rgba(216,138,74,.3)", fundo: on ? "#e5b34f" : "transparent" });
  const cx = caixa(termos), cl = caixa(lembrar);

  const enviar = async () => {
    if (cadastro) {
      if (!nick.trim()) return setErro("Escolha o nick que aparece nos seus anúncios.");
      if (!email.trim()) return setErro("Informe um e-mail para recuperar a conta depois.");
      if (senha.length < 8) return setErro("A senha precisa de ao menos 8 caracteres.");
      if (!termos) return setErro("Aceite as regras do Bazaar para continuar.");
    } else if (!email.trim() || !senha) {
      return setErro("Preencha e-mail (ou nick) e senha.");
    }
    setErro(""); setBusy(true);
    try {
      if (cadastro) await register(nick.trim(), email.trim(), senha);
      else await login(email.trim(), senha);
      setModo("pronto");
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Falha inesperada. Tente de novo.");
    } finally {
      setBusy(false);
    }
  };
  const enviarLink = () => setLinkEnviado(true);

  const modoAuth = modo === "login" || modo === "cadastro";

  return (
    <div className="bzauth" style={{ display: "flex", flexDirection: "column", minHeight: "calc(100vh - 150px)", background: "radial-gradient(120% 90% at 12% 0%, #23100e 0%, #140c0a 46%, #0a0605 100%)" }}>
      <style>{SCOPED}</style>
      <div className="bzauth-grid" style={{ flex: 1, display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,440px)", gap: 34, alignItems: "center", maxWidth: 1180, width: "100%", margin: "0 auto", padding: "34px 26px 44px", boxSizing: "border-box" }}>

        {/* ARTE */}
        <div className="bzauth-art" style={{ minWidth: 0 }}>
          <img src={A("brasao-vp.webp")} alt="VP Bazaar" style={{ width: 170, height: "auto", display: "block", filter: "drop-shadow(0 16px 34px rgba(0,0,0,.7))" }} />
          <h1 style={{ margin: "22px 0 0", font: "700 38px/1.08 Cinzel, serif", color: "#f7eee7", maxWidth: "16ch" }}>O bazaar dos dois mundos</h1>
          <p style={{ margin: "14px 0 0", maxWidth: "46ch", fontSize: 14, lineHeight: 1.6, color: "#a4937e" }}>Uma conta serve para os dois jogos. Você anuncia, negocia no chat e pede o intermédio oficial quando quiser garantia.</p>
          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 13px", borderRadius: 10, border: "1px solid rgba(80,140,220,.3)", background: "rgba(12,24,46,.5)" }}>
              <i role="img" aria-label="Poke Idle World" style={{ width: 34, height: 24, background: `url(${A("logo-pokeidleworld.png")})`, backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />
              <span style={{ font: "700 10.5px/1 Inter", color: "#9dbbe2" }}>Poke Idle World</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 13px", borderRadius: 10, border: "1px solid rgba(200,60,60,.3)", background: "rgba(38,12,14,.5)" }}>
              <i role="img" aria-label="Poke Web Games" style={{ width: 34, height: 24, background: `url(${A("logo-pokewebgames.png")})`, backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />
              <span style={{ font: "700 10.5px/1 Inter", color: "#e8aaaa" }}>Poke Web Games</span>
            </div>
          </div>
          <ul style={{ margin: "26px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 11 }}>
            {ARGUMENTOS.map((a) => (
              <li key={a.marca} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                <span style={{ flex: "none", width: 18, height: 18, marginTop: 1, display: "grid", placeItems: "center", borderRadius: "50%", border: "1px solid rgba(229,179,79,.4)", font: "700 9px/1 Inter", color: "#e5b34f" }}>{a.marca}</span>
                <span style={{ fontSize: 12.5, lineHeight: 1.5, color: "#b5a196" }}>{a.texto}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CARD */}
        <div style={{ minWidth: 0, borderRadius: 14, border: "1px solid rgba(216,138,74,.24)", background: "linear-gradient(180deg,#1c1412,#100b09)", boxShadow: "0 22px 48px rgba(0,0,0,.5)", padding: "24px 26px 26px" }}>

          {modo === "recuperar" && (
            <div>
              <button data-h="ghost" onClick={() => { setModo(aba); setLinkEnviado(false); }} style={{ padding: 0, border: 0, background: "none", cursor: "pointer", font: "600 11.5px/1 Inter", color: "#8a7a70" }}>← Voltar para entrar</button>
              <h2 style={{ margin: "16px 0 0", font: "700 23px/1.15 Cinzel, serif", color: "#f7eee7" }}>Recuperar acesso</h2>
              <p style={{ margin: "8px 0 0", fontSize: 12.5, lineHeight: 1.55, color: "#8a7a70" }}>Enviamos um link de redefinição para o e-mail cadastrado. Se você entrou pelo Discord, use o mesmo botão do Discord na tela anterior.</p>
              <label style={{ display: "block", marginTop: 18 }}>
                <span style={labelCap}>E-mail da conta</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" style={inputStyle} />
              </label>
              {linkEnviado && (
                <div style={{ display: "flex", gap: 10, marginTop: 14, padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(126,217,162,.38)", background: "rgba(20,50,36,.45)" }}>
                  <span style={{ flex: "none", fontSize: 13, color: "#a8f0c4" }}>✓</span>
                  <span style={{ fontSize: 12, lineHeight: 1.5, color: "#bfe9cf" }}>Link enviado. Confira a caixa de entrada e o spam.</span>
                </div>
              )}
              <button data-h="submit" onClick={enviarLink} style={{ ...primaryBtn, marginTop: 16 }}>Enviar link</button>
            </div>
          )}

          {modoAuth && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, padding: 4, borderRadius: 10, border: "1px solid rgba(216,138,74,.18)", background: "rgba(10,6,5,.6)" }}>
                {([["login", "Entrar"], ["cadastro", "Criar conta"]] as Array<[string, string]>).map(([id, rotulo]) => {
                  const on = aba === id;
                  return <button key={id} data-h="tab" onClick={() => { setAba(id); setModo(id); setErro(""); }} style={{ padding: 10, borderRadius: 7, cursor: "pointer", border: `1px solid ${on ? "rgba(229,179,79,.5)" : "transparent"}`, background: on ? "rgba(229,179,79,.13)" : "transparent", font: "700 12px/1 Inter", color: on ? "#f7eee7" : "#8a7a70" }}>{rotulo}</button>;
                })}
              </div>

              <h2 style={{ margin: "20px 0 0", font: "700 23px/1.15 Cinzel, serif", color: "#f7eee7" }}>{cadastro ? "Criar conta no Bazaar" : "Entrar no Bazaar"}</h2>
              <p style={{ margin: "7px 0 0", fontSize: 12.5, lineHeight: 1.5, color: "#8a7a70" }}>{cadastro ? "Uma conta vale para Poke Idle World e Poke Web Games." : "Use o mesmo acesso dos dois jogos."}</p>

              <button data-h="discord" onClick={() => setErro("O login com Discord estará disponível em breve. Use e-mail e senha por enquanto.")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", marginTop: 18, padding: 13, borderRadius: 9, cursor: "pointer", border: "1px solid rgba(114,137,218,.42)", background: "rgba(24,28,52,.7)", font: "700 12.5px/1 Inter", color: "#dbe2ff" }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="#7289da" aria-hidden="true"><path d="M20.32 4.94A19.8 19.8 0 0 0 15.44 3.4a.07.07 0 0 0-.8.04c-.21.38-.45.87-.61 1.26a18.3 18.3 0 0 0-5.5 0c-.17-.4-.41-.88-.63-1.26a.07.07 0 0 0-.08-.04A19.74 19.74 0 0 0 3.68 4.94a.07.07 0 0 0-.03.03C.53 9.6-.32 14.12.1 18.58a.08.08 0 0 0 .3.06 19.9 19.9 0 0 0 6 3.03.08.08 0 0 0 .09-.03c.46-.63.87-1.3 1.22-1.99a.08.08 0 0 0-.04-.11 13.1 13.1 0 0 1-1.87-.89.08.08 0 0 1 0-.13l.37-.29a.07.07 0 0 1 .08 0 14.2 14.2 0 0 0 12.06 0 .07.07 0 0 1 .08 0l.37.3a.08.08 0 0 1 0 .12c-.6.35-1.22.65-1.87.89a.08.08 0 0 0-.04.11c.36.69.77 1.35 1.22 1.99a.08.08 0 0 0 .9.03 19.85 19.85 0 0 0 6.01-3.03.08.08 0 0 0 .03-.06c.5-5.16-.84-9.64-3.55-13.61a.06.06 0 0 0-.03-.03ZM8.02 15.86c-1.18 0-2.15-1.08-2.15-2.41 0-1.33.95-2.42 2.15-2.42 1.21 0 2.17 1.1 2.15 2.42 0 1.33-.95 2.41-2.15 2.41Zm7.97 0c-1.18 0-2.15-1.08-2.15-2.41 0-1.33.95-2.42 2.15-2.42 1.21 0 2.17 1.1 2.15 2.42 0 1.33-.94 2.41-2.15 2.41Z" /></svg>
                {cadastro ? "Criar conta com Discord" : "Entrar com Discord"}
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 11, margin: "16px 0 4px" }}>
                <span style={{ flex: 1, height: 1, background: "rgba(216,138,74,.16)" }} />
                <span style={{ font: "800 8.5px/1 Inter", letterSpacing: ".18em", textTransform: "uppercase", color: "#7d6d64" }}>ou com e-mail</span>
                <span style={{ flex: 1, height: 1, background: "rgba(216,138,74,.16)" }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 12 }}>
                {cadastro && (
                  <label style={{ display: "block" }}>
                    <span style={labelCap}>Nick no Bazaar</span>
                    <input type="text" value={nick} onChange={(e) => { setNick(e.target.value); setErro(""); }} placeholder="Como você aparece nos anúncios" style={inputStyle} />
                  </label>
                )}

                <label style={{ display: "block" }}>
                  <span style={labelCap}>{cadastro ? "E-mail" : "E-mail ou nick"}</span>
                  <input type="text" value={email} onChange={(e) => { setEmail(e.target.value); setErro(""); }} placeholder={cadastro ? "voce@email.com" : "voce@email.com ou SeuNick"} style={inputStyle} />
                </label>

                <label style={{ display: "block" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 7 }}>
                    <span style={{ font: "800 9px/1 Inter", letterSpacing: ".14em", textTransform: "uppercase", color: "#e5b34f" }}>Senha</span>
                    <button data-h="ghost" onClick={() => setVerSenha(!verSenha)} type="button" style={{ padding: 0, border: 0, background: "none", cursor: "pointer", font: "600 10px/1 Inter", color: "#8a7a70" }}>{verSenha ? "Ocultar" : "Mostrar"}</button>
                  </div>
                  <input type={verSenha ? "text" : "password"} value={senha} onChange={(e) => { setSenha(e.target.value); setErro(""); }} placeholder={cadastro ? "Mínimo 8 caracteres" : "Sua senha"} style={inputStyle} />
                </label>

                {cadastro && (
                  <div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[0, 1, 2, 3].map((i) => <span key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < forca ? PALETA[forca] : "rgba(216,138,74,.16)" }} />)}
                    </div>
                    <span style={{ display: "block", marginTop: 6, font: "600 10.5px/1 Inter", color: forca ? PALETA[forca] : "#7d6d64" }}>{ROTULOS_FORCA[forca] || "Use 8 caracteres ou mais"}</span>
                  </div>
                )}

                {cadastro && (
                  <div style={{ padding: "13px 14px", borderRadius: 10, border: "1px solid rgba(216,138,74,.18)", background: "rgba(10,6,5,.45)" }}>
                    <span style={{ display: "block", font: "800 9px/1 Inter", letterSpacing: ".14em", textTransform: "uppercase", color: "#e5b34f" }}>Vincular conta do jogo <i style={{ fontStyle: "normal", letterSpacing: 0, textTransform: "none", color: "#7d6d64" }}>(opcional)</i></span>
                    <p style={{ margin: "7px 0 10px", fontSize: 11.5, lineHeight: 1.5, color: "#8a7a70" }}>Sem vínculo você navega e conversa. Para anunciar, o Bazaar precisa confirmar em qual jogo você joga.</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                      {(["pip", "pwg"] as const).map((id) => {
                        const j = JOGOS[id], on = jogo === id;
                        return (
                          <button key={id} data-h="game" type="button" onClick={() => { setJogo(on ? "" : id); setNickJogo(""); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: 10, borderRadius: 9, cursor: "pointer", border: `1px solid ${on ? "rgba(229,179,79,.6)" : "rgba(216,138,74,.18)"}`, background: on ? "rgba(229,179,79,.12)" : "rgba(10,6,5,.5)" }}>
                            <i role="img" aria-label={j.nome} style={{ flex: "none", width: 28, height: 22, background: `url(${j.logo})`, backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat", opacity: on ? 1 : .55 }} />
                            <span style={{ minWidth: 0, textAlign: "left", font: "700 10px/1.25 Inter", color: on ? "#f7eee7" : "#a4937e" }}>{j.nome}</span>
                          </button>
                        );
                      })}
                    </div>
                    {jogo && (
                      <label style={{ display: "block", marginTop: 9 }}>
                        <span style={{ display: "block", font: "600 10px/1 Inter", color: "#8a7a70", marginBottom: 6 }}>Nick usado em {JOGOS[jogo].nome}</span>
                        <input type="text" value={nickJogo} onChange={(e) => setNickJogo(e.target.value)} placeholder="Nick exato, com maiúsculas" style={{ ...inputStyle, padding: "10px 12px", borderRadius: 8, fontSize: 12.5 }} />
                      </label>
                    )}
                  </div>
                )}

                {cadastro && (
                  <button type="button" onClick={() => { setTermos(!termos); setErro(""); }} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: 0, border: 0, background: "none", cursor: "pointer", textAlign: "left" }}>
                    <span style={{ flex: "none", width: 17, height: 17, marginTop: 1, display: "grid", placeItems: "center", borderRadius: 5, border: `1px solid ${cx.borda}`, background: cx.fundo, font: "700 10px/1 Inter", color: "#0a0605" }}>{marca(termos)}</span>
                    <span style={{ fontSize: 11.5, lineHeight: 1.5, color: "#a4937e" }}>Aceito as <a href="#">regras do Bazaar</a> e entendo que a proteção da VP só vale quando a negociação usa o intermédio oficial.</span>
                  </button>
                )}

                {!cadastro && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <button type="button" onClick={() => setLembrar(!lembrar)} style={{ display: "flex", alignItems: "center", gap: 9, padding: 0, border: 0, background: "none", cursor: "pointer" }}>
                      <span style={{ width: 17, height: 17, display: "grid", placeItems: "center", borderRadius: 5, border: `1px solid ${cl.borda}`, background: cl.fundo, font: "700 10px/1 Inter", color: "#0a0605" }}>{marca(lembrar)}</span>
                      <span style={{ fontSize: 12, color: "#a4937e" }}>Continuar conectado</span>
                    </button>
                    <button data-h="ghost" type="button" onClick={() => { setModo("recuperar"); setLinkEnviado(false); }} style={{ padding: 0, border: 0, background: "none", cursor: "pointer", font: "600 12px/1 Inter", color: "#c9a86a" }}>Esqueci a senha</button>
                  </div>
                )}

                {erro && (
                  <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(195,54,41,.42)", background: "rgba(38,12,11,.5)" }}>
                    <span style={{ flex: "none", fontSize: 13, color: "#e8a79b" }}>!</span>
                    <span style={{ fontSize: 12, lineHeight: 1.5, color: "#e8c4bc" }}>{erro}</span>
                  </div>
                )}

                <button data-h="submit" onClick={enviar} disabled={busy} style={{ ...primaryBtn, marginTop: 3, opacity: busy ? .75 : 1, cursor: busy ? "wait" : "pointer" }}>{cadastro ? "Criar conta" : "Entrar"}</button>
              </div>

              <p style={{ margin: "15px 0 0", textAlign: "center", fontSize: 11.5, color: "#8a7a70" }}>{cadastro ? "Já tem conta?" : "Ainda não tem conta?"} <button data-h="tab" type="button" onClick={() => { const novo = cadastro ? "login" : "cadastro"; setAba(novo); setModo(novo); setErro(""); }} style={{ padding: 0, border: 0, background: "none", cursor: "pointer", font: "700 11.5px/1 Inter", color: "#e5b34f" }}>{cadastro ? "Entrar" : "Criar conta"}</button></p>
            </div>
          )}

          {modo === "pronto" && (
            <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
              <img src={A("brasao-vp.webp")} alt="VP Bazaar" style={{ width: 96, height: "auto", display: "block", margin: "0 auto", filter: "drop-shadow(0 10px 24px rgba(0,0,0,.6))" }} />
              <h2 style={{ margin: "18px 0 0", font: "700 23px/1.15 Cinzel, serif", color: "#f7eee7" }}>{cadastro ? "Conta criada" : "Bem-vindo de volta"}</h2>
              <p style={{ margin: "9px auto 0", maxWidth: "38ch", fontSize: 12.5, lineHeight: 1.55, color: "#a4937e" }}>{cadastro ? (jogo ? "Vínculo com " + JOGOS[jogo].nome + " enviado para conferência. Você já pode navegar e conversar enquanto validamos." : "Você já pode navegar e negociar. Para anunciar, vincule sua conta do jogo no perfil.") : "Suas conversas e anúncios continuam de onde pararam."}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 20 }}>
                <Link data-h="success-primary" to="/bazaar" style={{ display: "block", padding: 14, borderRadius: 9, border: "1px solid rgba(240,200,130,.45)", background: "linear-gradient(180deg,#a51f22,#6a1215)", boxShadow: "inset 0 1px 0 rgba(255,220,160,.24)", font: "700 12.5px/1 Cinzel, serif", letterSpacing: ".14em", textTransform: "uppercase", color: "#fff", textDecoration: "none" }} onClick={() => navigate("/bazaar")}>Ir para o marketplace</Link>
                <Link data-h="success-secondary" to="/bazaar/anunciar" style={{ display: "block", padding: 13, borderRadius: 9, border: "1px solid rgba(216,138,74,.28)", font: "600 12px/1 Inter", color: "#d8c4b6", textDecoration: "none" }}>Criar meu primeiro anúncio</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
