import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { ApiError } from "../../../services/api";

type Mode = "login" | "register";

export function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as { from?: string } | null;
  const destino = routeState?.from ?? "/bazaar";

  const mode: Mode = location.pathname.endsWith("/cadastro") ? "register" : "login";
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
    <main className="page bz-auth-page">
      <div className="container">
        <section className="bz-login-card" aria-labelledby="auth-title">
          <img className="bz-login-brand" src="/assets/logo-vp-bazaar-quadrada-oficial.webp" alt="VP Bazaar" />
          <span className="kicker">Entrar para negociar</span>
          <h1 id="auth-title">{mode === "login" ? "Acesse sua conta" : "Crie sua conta"}</h1>
          <p className="bz-login-sub">
            {mode === "login"
              ? "Acesse para anunciar e negociar no VP Bazaar."
              : "Cadastre-se para anunciar seus itens e Pokémon."}
          </p>

          <div className="bz-login-tabs" role="tablist" aria-label="Acesso ao Bazaar">
            <Link
              className={`bz-login-tab ${mode === "login" ? "on" : ""}`}
              to="/bazaar/login"
              state={routeState}
              role="tab"
              aria-selected={mode === "login"}
              onClick={() => setError(null)}
            >
              Entrar
            </Link>
            <Link
              className={`bz-login-tab ${mode === "register" ? "on" : ""}`}
              to="/bazaar/cadastro"
              state={routeState}
              role="tab"
              aria-selected={mode === "register"}
              onClick={() => setError(null)}
            >
              Criar conta
            </Link>
          </div>

          <form onSubmit={submit}>
            {mode === "login" ? (
              <div>
                <label className="bz-login-label" htmlFor="l-login">Usuário ou e-mail</label>
                <input
                  className="bz-login-input"
                  id="l-login"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  autoComplete="username"
                  placeholder="Digite seu usuário ou e-mail"
                  required
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="bz-login-label" htmlFor="r-user">Usuário</label>
                  <input
                    className="bz-login-input"
                    id="r-user"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    placeholder="Como você será conhecido"
                    pattern="[a-zA-Z0-9_.\-]{3,24}"
                    title="3 a 24 caracteres: letras, números, _ . -"
                    required
                  />
                </div>
                <div>
                  <label className="bz-login-label" htmlFor="r-email">E-mail</label>
                  <input
                    className="bz-login-input"
                    id="r-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="voce@exemplo.com"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="bz-login-label" htmlFor="l-pass">Senha</label>
              <input
                className="bz-login-input"
                id="l-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={mode === "register" ? 8 : undefined}
                placeholder={mode === "register" ? "Mínimo de 8 caracteres" : "Digite sua senha"}
                required
              />
            </div>

            {error && <p className="bz-login-err" role="alert">{error}</p>}

            <button className="bz-login-ok" type="submit" disabled={busy}>
              {busy ? "Aguarde…" : mode === "login" ? "Entrar no Bazaar" : "Criar minha conta"}
            </button>
          </form>

          <p className="bz-login-note">
            {mode === "login"
              ? "Use o usuário ou e-mail cadastrado na sua conta."
              : "Seu e-mail é usado somente para identificar e proteger sua conta."}
          </p>
          <div className="bz-login-safe">
            <img src="/assets/bazaar/fields/disponivel-troca.webp" alt="" />
            <span>A VP nunca pede a senha da sua conta do jogo. Negocie sempre pelos canais oficiais.</span>
          </div>
        </section>
      </div>
    </main>
  );
}
