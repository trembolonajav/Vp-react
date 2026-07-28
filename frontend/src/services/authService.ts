import { apiGet, apiPost } from "./api";
import type { AuthResponse, User } from "../types/user";

export function login(loginId: string, password: string): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/api/v1/auth/login", { login: loginId, password });
}

export function register(username: string, email: string, password: string): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/api/v1/auth/register", { username, email, password });
}

export function me(signal?: AbortSignal): Promise<User> {
  return apiGet<User>("/api/v1/auth/me", signal);
}
