import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Conversation, Message, PaginationMeta } from "@/services/chatApi";

interface TypingState {
  [conversationId: string]: string[]; // Array of userIds currently typing
}

interface MessageStore {
  [conversationId: string]: {
    messages: Message[];
    pagination: PaginationMeta | null;
    loadingMore: boolean;
  };
}

interface ChatState {
  /* ── Conversations ── */
  conversations: Conversation[];
  conversationsLoading: boolean;

  /* ── Messages ── */
  messageStore: MessageStore;

  /* ── Typing ── */
  typing: TypingState;

  /* ── Unread counts ── */
  unreadCounts: Record<string, number>;

  /* ── Actions ── */
  setConversations: (convs: Conversation[]) => void;
  setConversationsLoading: (v: boolean) => void;

  upsertConversation: (conv: Conversation) => void;
  updateLastMessage: (conversationId: string, msg: Message) => void;

  setMessages: (conversationId: string, messages: Message[], pagination: PaginationMeta) => void;
  prependMessages: (conversationId: string, messages: Message[], pagination: PaginationMeta) => void;
  setLoadingMore: (conversationId: string, v: boolean) => void;
  appendMessage: (conversationId: string, msg: Message) => void;
  updateMessageStatus: (conversationId: string, messageId: string, status: Message["status"]) => void;
  updateConversationMessageStatus: (conversationId: string, status: Message["status"]) => void;
  replaceTempMessage: (conversationId: string, tempId: string, realMsg: Message) => void;

  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;

  incrementUnread: (conversationId: string) => void;
  clearUnread: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>()(
  immer((set) => ({
    conversations: [],
    conversationsLoading: false,
    messageStore: {},
    typing: {},
    unreadCounts: {},

    setConversations: (convs) =>
      set((s) => {
        s.conversations = convs;
      }),

    setConversationsLoading: (v) =>
      set((s) => {
        s.conversationsLoading = v;
      }),

    upsertConversation: (conv) =>
      set((s) => {
        const idx = s.conversations.findIndex((c) => c._id === conv._id);
        if (idx >= 0) s.conversations[idx] = conv;
        else s.conversations.unshift(conv);
      }),

    updateLastMessage: (conversationId, msg) =>
      set((s) => {
        const conv = s.conversations.find((c) => c._id === conversationId);
        if (conv) {
          conv.lastMessage = {
            _id: msg._id,
            content: msg.content,
            messageType: msg.messageType,
            status: msg.status,
            createdAt: msg.createdAt,
            senderId: typeof msg.senderId === "string" ? msg.senderId : msg.senderId._id,
          };
          conv.lastMessageAt = msg.createdAt;
          // Move to top
          s.conversations = [
            conv,
            ...s.conversations.filter((c) => c._id !== conversationId),
          ];
        }
      }),

    setMessages: (conversationId, messages, pagination) =>
      set((s) => {
        s.messageStore[conversationId] = { messages, pagination, loadingMore: false };
      }),

    prependMessages: (conversationId, messages, pagination) =>
      set((s) => {
        const existing = s.messageStore[conversationId];
        if (!existing) return;
        // Avoid duplicates when prepending older pages
        const existingIds = new Set(existing.messages.map((m) => m._id));
        const newMsgs = messages.filter((m) => !existingIds.has(m._id));
        existing.messages = [...existing.messages, ...newMsgs];
        existing.pagination = pagination;
        existing.loadingMore = false;
      }),

    setLoadingMore: (conversationId, v) =>
      set((s) => {
        if (s.messageStore[conversationId]) {
          s.messageStore[conversationId].loadingMore = v;
        }
      }),

    appendMessage: (conversationId, msg) =>
      set((s) => {
        if (!s.messageStore[conversationId]) {
          s.messageStore[conversationId] = { messages: [msg], pagination: null, loadingMore: false };
        } else {
          // Prevent duplicate (real message arriving after temp)
          const exists = s.messageStore[conversationId].messages.some((m) => m._id === msg._id);
          if (!exists) s.messageStore[conversationId].messages.unshift(msg);
        }
      }),

    updateMessageStatus: (conversationId, messageId, status) =>
      set((s) => {
        const store = s.messageStore[conversationId];
        if (!store) return;
        const msg = store.messages.find((m) => m._id === messageId);
        if (msg) msg.status = status;
      }),

    updateConversationMessageStatus: (conversationId, status) =>
      set((s) => {
        const store = s.messageStore[conversationId];
        if (!store) return;
        store.messages.forEach((m) => {
          if (m.status !== "seen") m.status = status;
        });
      }),

    replaceTempMessage: (conversationId, tempId, realMsg) =>
      set((s) => {
        const store = s.messageStore[conversationId];
        if (!store) return;
        const idx = store.messages.findIndex((m) => m.tempId === tempId);
        if (idx >= 0) store.messages[idx] = realMsg;
        else {
          const dup = store.messages.find((m) => m._id === realMsg._id);
          if (!dup) store.messages.unshift(realMsg);
        }
      }),

    setTyping: (conversationId, userId, isTyping) =>
      set((s) => {
        if (!s.typing[conversationId]) {
          s.typing[conversationId] = [];
        }
        const arr = s.typing[conversationId];
        if (isTyping && !arr.includes(userId)) arr.push(userId);
        else if (!isTyping) s.typing[conversationId] = arr.filter((id) => id !== userId);
      }),

    incrementUnread: (conversationId) =>
      set((s) => {
        s.unreadCounts[conversationId] = (s.unreadCounts[conversationId] ?? 0) + 1;
      }),

    clearUnread: (conversationId) =>
      set((s) => {
        s.unreadCounts[conversationId] = 0;
      }),
  }))
);

/* Selector helpers */
export const selectConversation = (id: string | null) =>
  (s: ChatState) => s.conversations.find((c) => c._id === id);
