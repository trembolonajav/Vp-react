import { useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { ApiError } from "../../../services/api";

type Mode = "login" | "register";

export function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const destino = location.state?.from ?? "/bazaar";

  const [mode, setMode] = useState<Mode>("login");
  const [loginId, setLoginId] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") {
        await login(loginId, password);
      } else {
        await register(username, email, password);
      }
      navigate(destino, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha inesperada. Tente de novo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page">
      <div className="container">
        <div className="bz-form-card">
          <h1 className="bz-form-title">{mode === "login" ? "Entrar" : "Criar conta"}</h1>
          <p className="bz-form-sub">
            {mode === "login"
              ? "Acesse para anunciar e negociar no VP Bazaar."
              : "Cadastre-se para anunciar seus itens e Pokémon."}
          </p>

          <form onSubmit={submit}>
            {mode === "login" ? (
              <div className="bz-group">
                <label htmlFor="l-login">Usuário ou e-mail</label>
                <input
                  className="bz-input"
                  id="l-login"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            ) : (
              <>
                <div className="bz-group">
                  <label htmlFor="r-user">Usuário</label>
                  <input
                    className="bz-input"
                    id="r-user"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    pattern="[a-zA-Z0-9_.\-]{3,24}"
                    title="3 a 24 caracteres: letras, números, _ . -"
                    required
                  />
                </div>
                <div className="bz-group">
                  <label htmlFor="r-email">E-mail</label>
                  <input
                    className="bz-input"
                    id="r-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div className="bz-group">
              <label htmlFor="l-pass">Senha</label>
              <input
                className="bz-input"
                id="l-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={mode === "register" ? 8 : undefined}
                required
              />
            </div>

            {error && <p className="bz-form-error">{error}</p>}

            <button className="bz-submit" type="submit" disabled={busy}>
              {busy ? "Enviando…" : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <button
            type="button"
            className="bz-form-switch"
            onClick={() => {
              setMode((m) => (m === "login" ? "register" : "login"));
              setError(null);
            }}
          >
            {mode === "login"
              ? "Não tem conta? Cadastre-se"
              : "Já tem conta? Entrar"}
          </button>
        </div>
      </div>
    </main>
  );
}
