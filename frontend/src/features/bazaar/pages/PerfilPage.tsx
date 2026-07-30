import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { getProfile, updateMyProfile } from "../../../services/profileService";
import { useAuth } from "../../../contexts/AuthContext";
import { ApiError } from "../../../services/api";
import type { Profile } from "../../../types/profile";

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

function Avatar({ profile, className = "" }: { profile: Profile; className?: string }) {
  const src = avatarUrl(profile.avatar);
  return (
    <i className={className}>
      {src
        ? <img src={src} alt="" />
        : profile.username.slice(0, 2).toUpperCase()}
    </i>
  );
}

export function PerfilPage() {
  const { username } = useParams();
  const { user } = useAuth();
  const isPublic = Boolean(username);
  const target = username ?? user?.username;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bio, setBio] = useState("");
  const [contact, setContact] = useState("");
  const [preferredContact, setPreferredContact] = useState("Chat do Bazaar");
  const [avatar, setAvatar] = useState("initial");
  const [carregando, setCarregando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!target) return;
    const controller = new AbortController();
    setCarregando(true);
    setError(null);
    getProfile(target, controller.signal)
      .then((result) => {
        setProfile(result);
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
  }, [target]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setOk(false);
    setBusy(true);
    try {
      const updated = await updateMyProfile({ bio, contact, preferredContact, avatar });
      setProfile(updated);
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
        <div className="container"><div className="bz-empty"><strong>Carregando perfil…</strong></div></div>
      </main>
    );
  }

  if (error && !profile) {
    return (
      <main className="page">
        <div className="container">
          <div className="bz-empty" role="alert">
            <strong>{error}</strong>
            <Link to="/bazaar">Voltar ao Marketplace</Link>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) return null;

  if (isPublic) {
    const createdAt = new Date(profile.createdAt);
    const memberSince = Number.isNaN(createdAt.getTime())
      ? ""
      : createdAt.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    return (
      <main className="page">
        <section className="bz-public-profile container">
          <div className="bz-profile-hero">
            <Avatar profile={profile} />
            <div>
              <span className="kicker">Perfil público</span>
              <h1>{profile.username}</h1>
              <p>{profile.bio || "Membro da comunidade VP Bazaar."}</p>
              {memberSince && <small>Membro desde {memberSince}</small>}
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="bz-account-page container">
        <div className="bz-account-title">
          <div>
            <span className="kicker">Conta</span>
            <h1>Meu perfil</h1>
            <p>Atualize seus dados e como você aparece no Bazaar.</p>
          </div>
          <Avatar profile={{ ...profile, avatar }} />
        </div>

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

          <section className="bz-avatar-picker">
            <h2>Avatar</h2>
            <p>Use a inicial do seu nick ou escolha um sprite da coleção.</p>
            <div>
              {AVATARES.map((item) => (
                <button className={avatar === item.value ? "active" : ""} key={item.value} type="button"
                  aria-pressed={avatar === item.value} onClick={() => setAvatar(item.value)}>
                  {item.value === "initial"
                    ? <i>{profile.username.slice(0, 2).toUpperCase()}</i>
                    : <img src={avatarUrl(item.value)} alt="" />}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="bz-account-save">
            <Link to={`/bazaar/perfil/${encodeURIComponent(profile.username)}`}>Ver perfil público →</Link>
            {error && <p className="bz-form-status" role="alert">{error}</p>}
            {ok && <p className="bz-form-status ok" role="status">Perfil salvo.</p>}
            <button type="submit" disabled={busy}>{busy ? "Salvando…" : "Salvar alterações"}</button>
          </div>
        </form>
      </section>
    </main>
  );
}
