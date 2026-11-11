import { io, Socket } from "socket.io-client";
import { accessTokenInMemory } from "../lib/api";
import type { Message } from "./chatApi";

// Socket.IO must connect DIRECTLY to Render — Vercel rewrites do NOT support WebSocket proxying.
// HTTP API calls go through /api → Vercel proxy → Render (cookies are first-party).
// Socket connections go directly to Render using the token from the first-party cookie.
const RENDER_URL = "https://thoughts-5bxn.onrender.com";
const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api", "") ?? RENDER_URL;


let socket: Socket | null = null;

/**
 * Initialize and return the singleton Socket.IO client.
 * Supplies the current access token on every connection and reconnection.
 */
export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,   // sends the httpOnly accessToken cookie
      transports: ["websocket", "polling"],
      auth: (callback) => callback({ token: accessTokenInMemory }),
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
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
): Promise<{ success: boolean; message?: Message; error?: string }> => {
  return new Promise((resolve, reject) => {
    getSocket().timeout(10000).emit(
      "send_message",
      { conversationId, content, tempId },
      (error, ack: { success: boolean; message?: Message; error?: string }) => {
        if (error) reject(error);
        else resolve(ack);
      }
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
    getSocket().emit(
      "mark_as_seen",
      { conversationId },
      (ack: { success: boolean } | undefined) => resolve(ack ?? { success: true })
    );
  });
};
