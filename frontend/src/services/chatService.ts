import { apiGet, apiPatch, apiPost } from "./api";
import type {
  ConversationDetail,
  ConversationsList,
  ConversationView,
  StartConversationRequest,
} from "../types/conversation";

export function listConversations(signal?: AbortSignal): Promise<ConversationsList> {
  return apiGet<ConversationsList>("/api/v1/conversations", signal);
}

export function getConversation(id: string, signal?: AbortSignal): Promise<ConversationDetail> {
  return apiGet<ConversationDetail>(`/api/v1/conversations/${id}`, signal);
}

export function startConversation(body: StartConversationRequest): Promise<ConversationView> {
  return apiPost<ConversationView>("/api/v1/conversations", body);
}

export function sendMessage(id: string, text: string): Promise<unknown> {
  return apiPost(`/api/v1/conversations/${id}/messages`, { text });
}

export function markRead(id: string): Promise<void> {
  return apiPost<void>(`/api/v1/conversations/${id}/read`);
}

export function setStatus(id: string, status: string): Promise<ConversationView> {
  return apiPatch<ConversationView>(`/api/v1/conversations/${id}/status`, { status });
}
