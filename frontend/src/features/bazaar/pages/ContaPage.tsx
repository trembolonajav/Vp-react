import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { getProfile, updateMyProfile } from "../../../services/profileService";
import { useAuth } from "../../../contexts/AuthContext";
import { ApiError } from "../../../services/api";

const CONTATOS = ["Chat do Bazaar", "Discord", "WhatsApp"];
const AVATARES = [
  { value: "initial", label: "Inicial" },
  { value: "282", label: "Gardevoir" },
  { value: "94", label: "Gengar" },
  { value: "149", label: "Dragonite" },
  { value: "130", label: "Gyarados" },
];

function avatarUrl(avatar: string): string {
  return /^\d+$/.test(avatar)
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${avatar}.png`
    : "";
}

export function ContaPage() {
  const { user } = useAuth();
  const [bio, setBio] = useState("");
  const [contact, setContact] = useState("");
  const [preferredContact, setPreferredContact] = useState("Chat do Bazaar");
  const [avatar, setAvatar] = useState("initial");
  const [carregando, setCarregando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user?.username) return;
    const controller = new AbortController();
    setCarregando(true);
    setError(null);
    getProfile(user.username, controller.signal)
      .then((result) => {
        setBio(result.bio);
        setContact(result.contact);
        setPreferredContact(result.preferredContact || "Chat do Bazaar");
        setAvatar(result.avatar || "initial");
        setCarregando(false);
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") {
          setError(err.message);
          setCarregando(false);
        }
      });
    return () => controller.abort();
  }, [user?.username]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setOk(false);
    setBusy(true);
    try {
      await updateMyProfile({ bio, contact, preferredContact, avatar });
      setOk(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  };

  if (carregando) {
    return (
      <main className="page">
        <div className="container"><div className="bz-empty"><strong>Carregando conta…</strong></div></div>
      </main>
    );
  }

  const inicial = (user?.username ?? "VP").slice(0, 2).toUpperCase();
  const avatarSrc = avatarUrl(avatar);

  return (
    <main className="page">
      <section className="bz-account-page container">
        <div className="bz-account-title">
          <div>
            <span className="kicker">Conta</span>
            <h1>Minha conta</h1>
            <p>Atualize seus dados, segurança e como você aparece no Bazaar.</p>
          </div>
          <i className={avatarSrc ? "has-sprite" : ""}>
            {avatarSrc ? <img src={avatarSrc} alt="" /> : inicial}
          </i>
        </div>

        <div className="bz-account-grid">
          <aside>
            <a className="active" aria-current="page">
              <b>◎ Dados pessoais</b>
              <small>Nick, contato e apresentação</small>
            </a>
            <Link to="/bazaar/chat">
              <b>♢ Conversas</b>
              <small>Negociações em andamento</small>
            </Link>
            <Link to="/bazaar/meus-anuncios">
              <b>▤ Meus anúncios</b>
              <small>Ativos, pausados e vendidos</small>
            </Link>
            <Link to={`/bazaar/perfil/${encodeURIComponent(user?.username ?? "")}`}>
              <b>◈ Perfil público</b>
              <small>Como a comunidade vê você</small>
            </Link>
          </aside>

          <div className="bz-account-content">
            <form className="bz-account-form" onSubmit={submit}>
              <h2>Dados pessoais</h2>
              <div className="bz-account-fields">
                <label>
                  Nome de usuário
                  <input value={user?.username ?? ""} disabled />
                </label>
                <label>
                  E-mail
                  <input value={user?.email ?? ""} type="email" disabled />
                </label>
                <label>
                  Contato preferido
                  <select value={preferredContact} onChange={(event) => setPreferredContact(event.target.value)}>
                    {CONTATOS.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label>
                  Contato
                  <input maxLength={80} value={contact} onChange={(event) => setContact(event.target.value)}
                    placeholder="@discord ou telefone" />
                </label>
              </div>
              <label>
                Sobre você
                <textarea maxLength={240} value={bio} onChange={(event) => setBio(event.target.value)}
                  placeholder="Uma descrição curta para o seu perfil público." />
              </label>

              <div className="bz-account-save">
                <Link to={`/bazaar/perfil/${encodeURIComponent(user?.username ?? "")}`}>Ver perfil público →</Link>
                {error && <p className="bz-form-status" role="alert">{error}</p>}
                {ok && <p className="bz-form-status ok" role="status">Conta salva.</p>}
                <button type="submit" disabled={busy}>{busy ? "Salvando…" : "Salvar alterações"}</button>
              </div>
            </form>

            <section className="bz-avatar-picker">
              <h2>Avatar</h2>
              <p>Use a inicial do seu nick ou escolha um sprite da coleção.</p>
              <div>
                {AVATARES.map((item) => (
                  <button className={avatar === item.value ? "active" : ""} key={item.value} type="button"
                    aria-pressed={avatar === item.value} onClick={() => setAvatar(item.value)}>
                    {item.value === "initial" ? <i>{inicial}</i> : <img src={avatarUrl(item.value)} alt="" />}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
