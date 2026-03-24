import api from "@/lib/api";

export interface Participant {
  _id: string;
  username: string;
  name: string;
  avatar?: string;
}

export interface LastMessage {
  _id: string;
  content: string;
  messageType: string;
  status: "sent" | "delivered" | "seen";
  createdAt: string;
  senderId: string;
}

export interface Conversation {
  _id: string;
  participant: Participant;
  lastMessage?: LastMessage;
  lastMessageAt?: string;
  createdAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: Participant | string;
  content: string;
  messageType: "text" | "image";
  status: "sent" | "delivered" | "seen";
  createdAt: string;
  updatedAt: string;
  tempId?: string; // client-side dedup
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/* ─────────────────────────────────────────────
   CONVERSATION APIS
───────────────────────────────────────────── */

export const getConversations = (): Promise<Conversation[]> =>
  api.get("/conversations").then((r) => r.data.data);

export const createOrGetConversation = (participantId: string): Promise<Conversation> =>
  api.post("/conversations/create", { participantId }).then((r) => r.data.data);

/* ─────────────────────────────────────────────
   MESSAGE APIS
───────────────────────────────────────────── */

export const getMessages = (
  conversationId: string,
  page = 1,
  limit = 20
): Promise<{ messages: Message[]; pagination: PaginationMeta }> =>
  api
    .get(`/messages/${conversationId}`, { params: { page, limit } })
    .then((r) => ({ messages: r.data.messages, pagination: r.data.pagination }));

export const markSeenRest = (conversationId: string): Promise<void> =>
  api.post(`/messages/${conversationId}/seen`).then(() => undefined);
