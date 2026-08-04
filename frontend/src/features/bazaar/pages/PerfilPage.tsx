import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProfile } from "../../../services/profileService";
import { listListings } from "../../../services/listingsService";
import { EMPTY_FILTERS, type Listing } from "../../../types/listing";
import { useAuth } from "../../../contexts/AuthContext";
import type { Profile } from "../../../types/profile";
import { AdCard, AvatarCirculo, JOGOS } from "./profileShared";

// Migração pixel-perfect da vista "Perfil público" de "VP Bazaar - Perfil.dc.html".
// Header/footer ficam no BazaarLayout; aqui só entra o conteúdo abaixo do cabeçalho.

const SCOPED = `
.bzperfil a[data-h=vlt]:hover{color:#e5b34f}
.bzperfil [data-h=chat]:hover{filter:brightness(1.13)}
.bzperfil [data-h=ad]:hover{border-color:rgba(229,179,79,.42) !important;transform:translateY(-2px)}
.bzperfil [data-h=neg]:hover{border-color:#e5b34f !important;color:#f6d68f !important}
`;

export function PerfilPage() {
  const { username } = useParams();
  const { user } = useAuth();
  const target = username ?? user?.username;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [anuncios, setAnuncios] = useState<Listing[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;
    const controller = new AbortController();
    setCarregando(true);
    setError(null);
    getProfile(target, controller.signal)
      .then((result) => {
        setProfile(result);
        setCarregando(false);
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") {
          setError(err.message);
          setCarregando(false);
        }
      });
    // Anúncios ativos do vendedor (filtro client-side enquanto não há endpoint por vendedor).
    listListings({ ...EMPTY_FILTERS, intencao: "", sort: "recentes" }, controller.signal)
      .then((page) => setAnuncios(page.content.filter((l) => l.vendedor === target && l.status === "ativo")))
      .catch(() => undefined);
    return () => controller.abort();
  }, [target]);

  if (carregando) {
    return (
      <main style={{ background: "#0a0605", minHeight: "100vh", paddingBottom: 52 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 26px", color: "#a4937e" }}>Carregando perfil…</div>
      </main>
    );
  }

  if (error && !profile) {
    return (
      <main style={{ background: "#0a0605", minHeight: "100vh", paddingBottom: 52 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "40px 26px", color: "#e0a49b" }}>
          {error} — <Link to="/bazaar" style={{ color: "#e5b34f" }}>Voltar ao Marketplace</Link>
        </div>
      </main>
    );
  }

  if (!profile) return null;

  const nick = profile.username;
  const criado = new Date(profile.createdAt);
  const membroDesde = Number.isNaN(criado.getTime()) ? "" : criado.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  // Jogos "vinculados" derivados dos anúncios ativos do vendedor.
  const jogosVinculados = Array.from(new Set(anuncios.map((a) => a.jogo))).filter((id) => JOGOS[id]);

  return (
    <main className="bzperfil" style={{ background: "#0a0605", minHeight: "100vh", paddingBottom: 52 }}>
      <style>{SCOPED}</style>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "22px 26px 0" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "#7d6d64" }}>
          <Link data-h="vlt" to="/bazaar" style={{ color: "#8a7a70" }}>Marketplace</Link><span>›</span><span style={{ color: "#c9a86a" }}>{nick}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", marginTop: 12, padding: "20px 22px", borderRadius: 12, border: "1px solid rgba(216,138,74,.2)", background: "linear-gradient(100deg,#241412,#150d0b 58%,#100b09)" }}>
          <AvatarCirculo avatar={profile.avatar || "inicial"} nick={nick} size={74} fonte={22} />
          <div style={{ minWidth: 0, flex: "1 1 300px" }}>
            <h1 style={{ margin: 0, font: "700 27px/1.1 Cinzel, serif", color: "#f7eee7" }}>{nick}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginTop: 9 }}>
              {jogosVinculados.map((id) => {
                const j = JOGOS[id];
                return (
                  <span key={id} title={j.nome} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 10px", borderRadius: 8, border: `1px solid ${j.borda}`, background: j.fundo }}>
                    <i role="img" aria-label={j.nome} style={{ width: 26, height: 19, background: `url(${j.logo})`, backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat" }} />
                    <span style={{ font: "700 10px/1 Inter", color: j.cor }}>{j.nome}</span>
                  </span>
                );
              })}
              {membroDesde && <span style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(216,138,74,.22)", font: "600 10.5px/1 Inter", color: "#a4937e" }}>No Bazaar desde {membroDesde}</span>}
            </div>
            <p style={{ margin: "11px 0 0", maxWidth: "62ch", fontSize: 12.5, lineHeight: 1.55, color: "#a4937e" }}>{profile.bio || "Membro da comunidade VP Bazaar."}</p>
          </div>
        </div>

        <section style={{ marginTop: 16, padding: "18px 20px 20px", borderRadius: 12, border: "1px solid rgba(216,138,74,.2)", background: "linear-gradient(180deg,#1a1210,#100b09)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 5, padding: 4, borderRadius: 10, border: "1px solid rgba(216,138,74,.18)", background: "rgba(10,6,5,.6)" }}>
              <button type="button" style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 13px", borderRadius: 7, cursor: "pointer", border: "1px solid rgba(229,179,79,.55)", background: "rgba(229,179,79,.11)", font: "700 11.5px/1 Inter", color: "#f7eee7" }}>
                Anúncios ativos<span style={{ fontWeight: 700, color: "#e5b34f" }}>{anuncios.length}</span>
              </button>
            </div>
            <span style={{ fontSize: 11.5, color: "#7d6d64" }}>Toque em um anúncio para ver a ficha completa.</span>
          </div>

          {anuncios.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 11, marginTop: 14 }}>
              {anuncios.map((l) => (
                <AdCard key={l.id} listing={l} thumbTo={`/bazaar/anuncio/${l.id}`} tituloTo={`/bazaar/anuncio/${l.id}`}
                  rodape={<Link data-h="neg" to="/bazaar/chat" style={{ marginLeft: "auto", flex: "none", padding: "6px 11px", borderRadius: 7, border: "1px solid rgba(216,138,74,.26)", font: "700 10px/1 Inter", color: "#c9a86a" }}>Negociar</Link>} />
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 11, padding: "44px 20px", marginTop: 14, border: "1px dashed rgba(216,138,74,.22)", borderRadius: 11, textAlign: "center" }}>
              <b style={{ font: "700 15px/1.2 Cinzel, serif", color: "#f7eee7" }}>Nenhum anúncio ativo agora</b>
              <p style={{ margin: 0, maxWidth: "40ch", fontSize: 12, lineHeight: 1.5, color: "#8a7a70" }}>Esse vendedor não tem anúncios publicados no momento.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
