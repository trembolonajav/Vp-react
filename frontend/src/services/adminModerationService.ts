import { apiGet, apiPatch, apiPost, apiPut } from "./api";
import type { Listing, Page } from "../types/listing";
import type { ChatMessage, ConversationDetail, ConversationsList } from "../types/conversation";

export interface AdminReport {
  id: string;
  adId: string;
  title: string;
  seller: string;
  reason: string;
  details: string;
  reporterId: string;
  status: string;
  createdAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  resolutionNote: string | null;
}

export function listAdminReports(status: string, signal?: AbortSignal): Promise<Page<AdminReport>> {
  return apiGet<Page<AdminReport>>(
    `/api/v1/admin/reports?status=${encodeURIComponent(status)}&page=1&size=50`,
    signal,
  );
}

export function reviewReport(id: string, status: string, note: string): Promise<AdminReport> {
  return apiPatch<AdminReport>(`/api/v1/admin/reports/${encodeURIComponent(id)}`, { status, note });
}

export function listAdminListings(status: string, query: string, signal?: AbortSignal): Promise<Page<Listing>> {
  const params = new URLSearchParams({ status, q: query, page: "1", size: "50" });
  return apiGet<Page<Listing>>(`/api/v1/admin/listings?${params}`, signal);
}

export function moderateListing(publicId: string, status: string): Promise<Listing> {
  return apiPatch<Listing>(
    `/api/v1/admin/listings/${encodeURIComponent(publicId)}/status`,
    { status },
  );
}

export function listAdminConversations(status = "intermedio-solicitado", signal?: AbortSignal): Promise<ConversationsList> {
  return apiGet<ConversationsList>(`/api/v1/admin/conversations?status=${encodeURIComponent(status)}`, signal);
}

export function getAdminConversation(id: string, signal?: AbortSignal): Promise<ConversationDetail> {
  return apiGet<ConversationDetail>(`/api/v1/admin/conversations/${encodeURIComponent(id)}`, signal);
}

/** O moderador do intermédio posta no chat da negociação (visível a comprador e vendedor). */
export function adminSendMessage(id: string, text: string): Promise<ChatMessage> {
  return apiPost<ChatMessage>(`/api/v1/admin/conversations/${encodeURIComponent(id)}/messages`, { text });
}

export interface WhatsAppStatus { status: string; qr: string | null; phone: string | null; lastConnection: string | null; error: string | null; groupJid: string | null }
export interface WhatsAppGroup { id: string; name: string; size: number }
export const getWhatsAppStatus = (signal?: AbortSignal) => apiGet<WhatsAppStatus>("/api/v1/admin/whatsapp/status", signal);
export const getWhatsAppGroups = () => apiGet<WhatsAppGroup[]>("/api/v1/admin/whatsapp/groups");
export const connectWhatsApp = () => apiPost<WhatsAppStatus>("/api/v1/admin/whatsapp/connect");
export const disconnectWhatsApp = () => apiPost<WhatsAppStatus>("/api/v1/admin/whatsapp/disconnect");
export const configureWhatsAppGroup = (groupJid: string) => apiPut<WhatsAppStatus>("/api/v1/admin/whatsapp/config", { groupJid });
export const testWhatsApp = () => apiPost<{ sent: boolean }>("/api/v1/admin/whatsapp/test");
