import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import * as authService from "../services/authService";
import { AUTH_EXPIRED_EVENT, tokenStore } from "../services/api";
import type { User } from "../types/user";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (loginId: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Reidrata a sessão a partir do token guardado.
  useEffect(() => {
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    authService
      .me(controller.signal)
      .then((u) => {
        setUser(u);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return;
        tokenStore.clear();
        setLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const expireSession = () => setUser(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, expireSession);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, expireSession);
  }, []);

  const login = async (loginId: string, password: string) => {
    const result = await authService.login(loginId, password);
    tokenStore.set(result.token);
    setUser(result.user);
  };

  const register = async (username: string, email: string, password: string) => {
    const result = await authService.register(username, email, password);
    tokenStore.set(result.token);
    setUser(result.user);
  };

  const logout = () => {
    tokenStore.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>.");
  return ctx;
}
