export interface ChatMessage {
  id: string;
  conversationId: string;
  author: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface ConversationView {
  id: string;
  adId: string;
  title: string;
  buyer: string;
  seller: string;
  image: string;
  price: number;
  currency: string;
  details: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationSummary {
  conversation: ConversationView;
  lastMessage: ChatMessage | null;
  unread: number;
}

export interface ConversationsList {
  conversations: ConversationSummary[];
  unread: number;
}

export interface ConversationDetail {
  conversation: ConversationView;
  messages: ChatMessage[];
}

export interface StartConversationRequest {
  adId: string;
  seller: string;
  title?: string;
  image?: string;
  price?: number;
  currency?: string;
  details?: string;
}

export const CONVERSATION_STATUS: Record<string, string> = {
  aberta: "Aberta",
  "intermedio-solicitado": "Intermédio solicitado",
  concluida: "Concluída",
  encerrada: "Encerrada",
};
