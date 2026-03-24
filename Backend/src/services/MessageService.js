import {
  createMessage,
  findMessagesByConversation,
  markConversationSeen,
  countMessages,
} from "../repositories/MessageRepository.js";
import { updateConversationLastMessage } from "../repositories/ConversationRepository.js";
import { assertParticipant } from "./ConversationService.js";
import ExpressError from "../utils/ExpressError.js";
import { z } from "zod";

/* ──────────────────────────────────────────
   VALIDATION SCHEMAS
────────────────────────────────────────── */
const sendMessageSchema = z.object({
  content: z.string().trim().min(1, "Message cannot be empty").max(2000, "Message too long"),
  messageType: z.enum(["text", "image"]).default("text"),
});

/* ──────────────────────────────────────────
   SERVICE FUNCTIONS
────────────────────────────────────────── */

/**
 * Validate, persist, and return a new message.
 * Also updates the conversation's lastMessage snapshot.
 */
export const sendMessageService = async (conversationId, senderId, payload) => {
  // Zod validation
  const parsed = sendMessageSchema.safeParse(payload);
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message || "Invalid message payload";
    throw new ExpressError(400, msg);
  }

  // Security: caller must be a participant
  await assertParticipant(conversationId, senderId);

  const { content, messageType } = parsed.data;

  const message = await createMessage({ conversationId, senderId, content, messageType });

  // Update conversation snapshot (non-blocking update — no wait needed for response)
  updateConversationLastMessage(conversationId, message._id, message.createdAt).catch((err) =>
    console.error("[MessageService] lastMessage update failed", err)
  );

  return message;
};

/**
 * Paginated message history (newest-first from DB; client reverses for display).
 */
export const getMessagesService = async (conversationId, userId, { page = 1, limit = 20 } = {}) => {
  // Security: caller must be a participant
  await assertParticipant(conversationId, userId);

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

  const [messages, total] = await Promise.all([
    findMessagesByConversation(conversationId, { page: parsedPage, limit: parsedLimit }),
    countMessages(conversationId),
  ]);

  const totalPages = Math.ceil(total / parsedLimit);

  return {
    messages,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages,
      hasNextPage: parsedPage < totalPages,
      hasPrevPage: parsedPage > 1,
    },
  };
};

/**
 * Mark all messages in a conversation as seen by the reader.
 * Called when the user opens a chat window.
 */
export const markSeenService = async (conversationId, readerId) => {
  await assertParticipant(conversationId, readerId);
  await markConversationSeen(conversationId, readerId);
};
