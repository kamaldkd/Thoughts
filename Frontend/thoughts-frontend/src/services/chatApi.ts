import api, { csrfTokenInMemory, fetchCsrfToken } from "@/lib/api";
import { emitSendMessage } from "@/services/socket";

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
  unreadCount?: number;
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

export const getMessageSenderId = (senderId: unknown): string => {
  let id = senderId;
  if (typeof id === "object" && id !== null && "_id" in id) {
    id = id._id;
  }

  if (typeof id === "string") return id.toLowerCase();
  if (
    typeof id === "object" &&
    id !== null &&
    "toHexString" in id &&
    typeof id.toHexString === "function"
  ) {
    return id.toHexString().toLowerCase();
  }

  return "";
};

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

export const getUnreadMessageCount = (): Promise<number> =>
  api.get("/conversations/unread-count").then((r) => r.data.count);

export const createOrGetConversation = async (
  participantId: string
): Promise<Conversation> => {
  if (!csrfTokenInMemory) await fetchCsrfToken();
  if (!csrfTokenInMemory) {
    throw new Error("Could not initialize a secure connection. Please reload and try again.");
  }
  const response = await api.post("/conversations/create", { participantId });
  return response.data.data;
};

export const sendChatMessage = async (
  conversationId: string,
  content: string,
  clientMessageId: string
): Promise<Message> => {
  try {
    const ack = await emitSendMessage(conversationId, content, clientMessageId);
    if (ack.success && ack.message) return ack.message;
  } catch (error) {
    console.warn("Socket message send failed; retrying over HTTP", error);
  }

  const response = await api.post(`/messages/${conversationId}`, {
    content,
    clientMessageId,
  });
  return response.data.data;
};

export const searchChatUsers = (
  query: string
): Promise<Participant[]> =>
  api
    .get("/users/search", { params: { q: query } })
    .then((r) => r.data.data);

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
