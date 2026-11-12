import {
  createMessage,
  findMessagesByConversation,
  findMessageInConversation,
  markConversationSeen,
  countMessages,
  hideMessageForUser,
  deleteMessageForEveryone,
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
  clientMessageId: z.string().min(1).max(100).optional(),
  replyTo: z.string().regex(/^[a-f\d]{24}$/i, "Invalid reply target").optional(),
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

  const { content, messageType, clientMessageId, replyTo } = parsed.data;
  const replyTarget = replyTo
    ? await findMessageInConversation(replyTo, conversationId, senderId)
    : null;

  if (replyTo && !replyTarget) {
    throw new ExpressError(400, "Reply target not found in this conversation");
  }

  const message = await createMessage({
    conversationId,
    senderId,
    content,
    messageType,
    clientMessageId,
    replyTo,
  });

  // Update conversation snapshot (non-blocking update — no wait needed for response)
  updateConversationLastMessage(conversationId, message._id, message.createdAt).catch((err) =>
    console.error("[MessageService] lastMessage update failed", err)
  );

  const responseMessage = { ...message };
  delete responseMessage.deletedFor;
  return replyTarget ? { ...responseMessage, replyTo: replyTarget } : responseMessage;
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
    findMessagesByConversation(conversationId, userId, {
      page: parsedPage,
      limit: parsedLimit,
    }),
    countMessages(conversationId, userId),
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

export const deleteMessageService = async (
  conversationId,
  messageId,
  userId,
  scope
) => {
  if (!/^[a-f\d]{24}$/i.test(conversationId) || !/^[a-f\d]{24}$/i.test(messageId)) {
    throw new ExpressError(400, "Invalid conversation or message ID");
  }
  if (scope !== "me" && scope !== "everyone") {
    throw new ExpressError(400, "Invalid delete scope");
  }

  await assertParticipant(conversationId, userId);

  const message = await findMessageInConversation(messageId, conversationId);
  if (!message) throw new ExpressError(404, "Message not found");

  if (scope === "everyone") {
    const messageSenderId =
      message.senderId && typeof message.senderId === "object" && "_id" in message.senderId
        ? message.senderId._id
        : message.senderId;
    if (!messageSenderId || messageSenderId.toString() !== userId.toString()) {
      throw new ExpressError(403, "You can only delete your own message for everyone");
    }

    if (message.isDeleted) {
      return { conversationId, messageId, scope, isDeleted: true };
    }

    const deletedMessage = await deleteMessageForEveryone(
      conversationId,
      messageId,
      userId
    );
    if (!deletedMessage) {
      const currentMessage = await findMessageInConversation(messageId, conversationId);
      if (!currentMessage?.isDeleted) throw new ExpressError(404, "Message not found");
    }
    return { conversationId, messageId, scope, isDeleted: true };
  }

  const hiddenMessage = await hideMessageForUser(conversationId, messageId, userId);
  if (!hiddenMessage) throw new ExpressError(404, "Message not found");
  return { conversationId, messageId, scope };
};
