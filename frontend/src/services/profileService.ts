import { apiGet, apiPut } from "./api";
import type { Profile, ProfileUpdate } from "../types/profile";

export function getProfile(username: string, signal?: AbortSignal): Promise<Profile> {
  return apiGet<Profile>(`/api/v1/profiles/${encodeURIComponent(username)}`, signal);
}

export function getMyProfile(signal?: AbortSignal): Promise<Profile> {
  return apiGet<Profile>("/api/v1/profiles/me", signal);
}

export function updateMyProfile(body: ProfileUpdate): Promise<Profile> {
  return apiPut<Profile>("/api/v1/profiles/me", body);
}
