import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { getProfile, updateMyProfile } from "../../../services/profileService";
import { useAuth } from "../../../contexts/AuthContext";
import { ApiError } from "../../../services/api";

const CONTATOS = ["Chat do Bazaar", "Discord", "WhatsApp"];

export function PerfilPage() {
  const { user } = useAuth();
  const [bio, setBio] = useState("");
  const [contact, setContact] = useState("");
  const [preferredContact, setPreferredContact] = useState("Chat do Bazaar");
  const [avatar, setAvatar] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    getProfile(user.username, controller.signal)
      .then((p) => {
        setBio(p.bio);
        setContact(p.contact);
        setPreferredContact(p.preferredContact || "Chat do Bazaar");
        setAvatar(p.avatar === "initial" ? "" : p.avatar);
        setCarregando(false);
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") {
          setError(err.message);
          setCarregando(false);
        }
      });
    return () => controller.abort();
  }, [user]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
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
        <div className="container">
          <div className="bz-empty">
            <strong>Carregando perfil…</strong>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="container an-form-wrap">
        <h1 className="bz-form-title">Meu perfil</h1>
        <p className="bz-form-sub">@{user?.username}</p>

        <form onSubmit={submit} className="an-form">
          <div className="bz-group">
            <label htmlFor="p-bio">Bio</label>
            <textarea className="bz-input" id="p-bio" rows={3} maxLength={240} value={bio}
              onChange={(e) => setBio(e.target.value)} />
          </div>
          <div className="an-form-grid">
            <div className="bz-group">
              <label htmlFor="p-contact">Contato</label>
              <input className="bz-input" id="p-contact" maxLength={80} value={contact}
                onChange={(e) => setContact(e.target.value)} />
            </div>
            <div className="bz-group">
              <span className="bz-group-title">Contato preferido</span>
              <select className="bz-select" value={preferredContact}
                onChange={(e) => setPreferredContact(e.target.value)}>
                {CONTATOS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="bz-group">
              <label htmlFor="p-avatar">Avatar (URL ou vazio)</label>
              <input className="bz-input" id="p-avatar" maxLength={40} value={avatar}
                onChange={(e) => setAvatar(e.target.value)} />
            </div>
          </div>

          {error && <p className="bz-form-error">{error}</p>}
          {ok && <p className="bz-form-ok">Perfil salvo.</p>}

          <button className="bz-submit" type="submit" disabled={busy}>
            {busy ? "Salvando…" : "Salvar perfil"}
          </button>
        </form>
      </div>
    </main>
  );
}
