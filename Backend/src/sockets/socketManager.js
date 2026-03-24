import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { registerMessageHandlers } from "./handlers/messageHandlers.js";

/* ──────────────────────────────────────────
   IN-MEMORY USER → SOCKET MAP
   Map<userId (string) → Set<socketId (string)>>
   Supports multiple tabs / devices per user.
────────────────────────────────────────── */
const userSocketMap = new Map();

/* ──────────────────────────────────────────
   HELPERS
────────────────────────────────────────── */
const addSocket = (userId, socketId) => {
  if (!userSocketMap.has(userId)) userSocketMap.set(userId, new Set());
  userSocketMap.get(userId).add(socketId);
};

const removeSocket = (userId, socketId) => {
  const set = userSocketMap.get(userId);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) userSocketMap.delete(userId);
};

/**
 * Check if a user is currently online (has at least one active socket).
 */
export const isUserOnline = (userId) => {
  const s = userSocketMap.get(userId?.toString());
  return Boolean(s && s.size > 0);
};

/**
 * Emit an event to ALL active sockets of a specific user.
 */
export const emitToUser = (io, userId, event, data) => {
  const sockets = userSocketMap.get(userId?.toString());
  if (!sockets) return;
  for (const socketId of sockets) {
    io.to(socketId).emit(event, data);
  }
};

/* ──────────────────────────────────────────
   SOCKET.IO INITIALIZATION
────────────────────────────────────────── */

/**
 * Attach Socket.IO to an existing HTTP server and configure the
 * authentication middleware, connection handling, and event dispatching.
 *
 * @param {import("http").Server} httpServer
 * @returns {import("socket.io").Server} io
 */
export const initSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: [
        "http://localhost:8080",
        "http://192.168.56.1:8080",
        "https://thoughts-social.vercel.app",
        "http://localhost:5173",
      ],
      credentials: true,
    },
    // Ping settings — detect stale connections quickly
    pingTimeout: 20000,
    pingInterval: 10000,
    // Allow both polling and WebSocket transports
    transports: ["websocket", "polling"],
  });

  /* ──────────────────────────────────────────
     AUTH MIDDLEWARE
     Reads the accessToken cookie from the WS
     handshake and verifies the JWT.
     Rejects unauthenticated connections before
     they can register any event listeners.
  ────────────────────────────────────────── */
  io.use((socket, next) => {
    try {
      // Parse cookies from the handshake headers
      const rawCookies = socket.handshake.headers.cookie || "";
      const cookies = cookie.parse(rawCookies);
      const token = cookies.accessToken || socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error("Invalid or expired token"));
    }
  });

  /* ──────────────────────────────────────────
     CONNECTION HANDLER
  ────────────────────────────────────────── */
  io.on("connection", (socket) => {
    const userId = socket.userId.toString();

    // 1. Track socket in the user→socket map
    addSocket(userId, socket.id);

    // 2. Join personal room (userId) for targeted notifications
    socket.join(userId);

    console.info(`[Socket] User ${userId} connected (socket: ${socket.id})`);

    /* ──────────────────────
       JOIN CONVERSATION ROOMS
       Client emits this after
       opening a chat window.
    ────────────────────── */
    socket.on("join_conversation", (conversationId) => {
      if (typeof conversationId === "string" && conversationId.length > 0) {
        socket.join(`conv:${conversationId}`);
      }
    });

    socket.on("leave_conversation", (conversationId) => {
      if (typeof conversationId === "string") {
        socket.leave(`conv:${conversationId}`);
      }
    });

    // 3. Register message / typing / seen handlers
    registerMessageHandlers(socket, io, userSocketMap);

    /* ──────────────────────
       DISCONNECT CLEANUP
    ────────────────────── */
    socket.on("disconnect", (reason) => {
      removeSocket(userId, socket.id);
      console.info(
        `[Socket] User ${userId} disconnected (socket: ${socket.id}, reason: ${reason})`
      );
    });

    // Emit a ready signal so the client knows auth succeeded
    socket.emit("connected", { userId, socketId: socket.id });
  });

  return io;
};
