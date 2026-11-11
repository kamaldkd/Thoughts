import { sendMessageService, markSeenService } from "../../services/MessageService.js";
import { assertParticipant } from "../../services/ConversationService.js";
import { markMessageDelivered } from "../../repositories/MessageRepository.js";
import { findOtherParticipantId } from "../../repositories/ConversationRepository.js";
import { z } from "zod";

/* ──────────────────────────────────────────
   PAYLOAD SCHEMAS (socket events)
────────────────────────────────────────── */
const sendMessageSchema = z.object({
  conversationId: z.string().min(1, "conversationId required"),
  content: z.string().trim().min(1, "Message cannot be empty").max(2000, "Message too long"),
  messageType: z.enum(["text", "image"]).default("text"),
  tempId: z.string().optional(), // client-side deduplication ID
});

const typingSchema = z.object({
  conversationId: z.string().min(1, "conversationId required"),
  isTyping: z.boolean(),
});

const markSeenSchema = z.object({
  conversationId: z.string().min(1, "conversationId required"),
});

/* ──────────────────────────────────────────
   HELPERS
────────────────────────────────────────── */
const safeEmit = (socket, event, payload) => {
  try {
    socket.emit(event, payload);
  } catch (err) {
    console.error(`[Socket] Failed to emit ${event}:`, err.message);
  }
};

/* ──────────────────────────────────────────
   HANDLER REGISTRATION
────────────────────────────────────────── */

/**
 * Register all messaging-related socket event handlers for a connected socket.
 *
 * @param {import("socket.io").Socket} socket
 * @param {import("socket.io").Server} io
 * @param {object} userSocketMap  — shared Map<userId → Set<socketId>>
 */
export const registerMessageHandlers = (socket, io, userSocketMap) => {
  const userId = socket.userId; // attached by socketManager on auth

  /* ────────────────────────────────────────
     EVENT: send_message
     Flow:
       1. Validate payload
       2. Persist message (service layer handles participant check)
       3. Emit `receive_message` to receiver (if online)
       4. If delivered, update status & emit `message_delivered` back to sender
       5. Acknowledge sender with saved message (tempId echoed for dedup)
  ──────────────────────────────────────── */
  socket.on("send_message", async (payload, ack) => {
    const parsed = sendMessageSchema.safeParse(payload);
    if (!parsed.success) {
      const errMsg = parsed.error.errors[0]?.message || "Invalid payload";
      if (typeof ack === "function") ack({ success: false, error: errMsg });
      return;
    }

    const { conversationId, content, messageType, tempId } = parsed.data;

    try {
      // Persist via service (validates participant, saves, updates lastMessage)
      const message = await sendMessageService(conversationId, userId, {
        content,
        messageType,
        clientMessageId: tempId,
      });

      // Acknowledge sender with the saved message + their tempId for dedup
      if (typeof ack === "function") {
        ack({ success: true, message: { ...message, tempId } });
      }

      const receiverId = await findOtherParticipantId(conversationId, userId);
      if (!receiverId) throw new Error("Conversation recipient not found");

      // Deliver to every active device for the recipient, even when the chat is closed.
      io.to(receiverId.toString()).emit("receive_message", {
        ...message,
        tempId,
      });

      // Check if receiver is online — if so, mark as delivered immediately
      const receiverSockets = userSocketMap.get(receiverId.toString()) ?? new Set();
      if (receiverSockets.size > 0) {
        await markMessageDelivered(message._id);
        // Tell sender their message was delivered
        safeEmit(socket, "message_delivered", {
          messageId: message._id,
          conversationId,
        });
        io.to(receiverId.toString()).emit("message_delivered", {
          messageId: message._id,
          conversationId,
        });
      }
    } catch (err) {
      console.error("[Socket] send_message error:", err.message);
      if (typeof ack === "function") ack({ success: false, error: err.message });
      safeEmit(socket, "error", { code: "SEND_FAILED", message: err.message });
    }
  });

  /* ────────────────────────────────────────
     EVENT: typing
     Relays typing status to the other participant only.
  ──────────────────────────────────────── */
  socket.on("typing", async (payload) => {
    const parsed = typingSchema.safeParse(payload);
    if (!parsed.success) return;

    const { conversationId, isTyping } = parsed.data;
    try {
      await assertParticipant(conversationId, userId);
      socket.to(`conv:${conversationId}`).emit("typing_indicator", {
        conversationId,
        userId,
        isTyping,
      });
    } catch (err) {
      console.error("[Socket] typing event rejected:", err.message);
    }
  });

  /* ────────────────────────────────────────
     EVENT: mark_as_seen
     Bulk-marks unread messages as seen and notifies all room members.
  ──────────────────────────────────────── */
  socket.on("mark_as_seen", async (payload, ack) => {
    const parsed = markSeenSchema.safeParse(payload);
    if (!parsed.success) {
      if (typeof ack === "function") ack({ success: false, error: "Invalid payload" });
      return;
    }

    const { conversationId } = parsed.data;

    try {
      await markSeenService(conversationId, userId);

      // Notify the whole room (primarily the sender so they see ✓✓)
      io.to(`conv:${conversationId}`).emit("message_seen", {
        conversationId,
        seenBy: userId,
      });

      if (typeof ack === "function") ack({ success: true });
    } catch (err) {
      console.error("[Socket] mark_as_seen error:", err.message);
      if (typeof ack === "function") ack({ success: false, error: err.message });
    }
  });
};
