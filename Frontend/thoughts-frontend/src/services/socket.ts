import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api", "") ?? "http://localhost:5000";

let socket: Socket | null = null;

/**
 * Initialize and return the singleton Socket.IO client.
 * Reads the accessToken cookie automatically via `withCredentials`.
 */
export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,   // sends the httpOnly accessToken cookie
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => console.info("[Socket] Connected:", socket?.id));
    socket.on("disconnect", (reason) => console.warn("[Socket] Disconnected:", reason));
    socket.on("connect_error", (err) => console.error("[Socket] Connect error:", err.message));
  }
  return socket;
};

/** Disconnect and reset the singleton (call on logout). */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/** Join a conversation room. */
export const joinConversation = (conversationId: string) => {
  getSocket().emit("join_conversation", conversationId);
};

/** Leave a conversation room. */
export const leaveConversation = (conversationId: string) => {
  getSocket().emit("leave_conversation", conversationId);
};

/** Emit a message with an acknowledgement promise. */
export const emitSendMessage = (
  conversationId: string,
  content: string,
  tempId: string
): Promise<{ success: boolean; message?: any; error?: string }> => {
  return new Promise((resolve) => {
    getSocket().emit(
      "send_message",
      { conversationId, content, tempId },
      (ack: any) => resolve(ack)
    );
  });
};

/** Emit typing status. */
export const emitTyping = (conversationId: string, isTyping: boolean) => {
  getSocket().emit("typing", { conversationId, isTyping });
};

/** Emit mark-as-seen. */
export const emitMarkAsSeen = (conversationId: string): Promise<{ success: boolean }> => {
  return new Promise((resolve) => {
    getSocket().emit("mark_as_seen", { conversationId }, (ack: any) => resolve(ack ?? { success: true }));
  });
};
