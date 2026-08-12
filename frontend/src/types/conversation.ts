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
  intermediaryUsed: boolean;
  buyerProductConfirmed: boolean;
  sellerPaymentConfirmed: boolean;
  negotiationMode: "UNDEFINED" | "DIRECT" | "INTERMEDIATED";
  vpItemReceived: boolean;
  vpPaymentReceived: boolean;
  vpItemDelivered: boolean;
  vpPaymentDelivered: boolean;
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
  events: NegotiationEvent[];
}

export interface NegotiationEvent { id: string; type: string; actor: string; details: string; createdAt: string; }

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
  "intermedio-assumido": "Intermédio assumido",
  "produto-recebido": "Produto em custódia",
  "pagamento-recebido": "Custódia completa",
  "entregas-confirmadas": "Entregas confirmadas",
  concluida: "Concluída",
  encerrada: "Encerrada",
};
