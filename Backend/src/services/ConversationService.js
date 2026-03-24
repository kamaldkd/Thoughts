import {
  findConversationByParticipants,
  createConversation,
  findConversationsByUser,
  isParticipant,
} from "../repositories/ConversationRepository.js";
import User from "../models/User.js";
import ExpressError from "../utils/ExpressError.js";

/**
 * Get-or-create a 1-to-1 conversation.
 * Validates that the target user exists and is not the caller.
 */
export const getOrCreateConversation = async (requesterId, participantId) => {
  if (requesterId === participantId) {
    throw new ExpressError(400, "You cannot open a conversation with yourself");
  }

  // Confirm target user exists (lean — just need existence)
  const targetUser = await User.findById(participantId).select("_id username name avatar").lean();
  if (!targetUser) throw new ExpressError(404, "User not found");

  // Idempotent — return existing or create new
  const existing = await findConversationByParticipants(requesterId, participantId);
  if (existing) return existing;

  return createConversation(requesterId, participantId);
};

/**
 * Return all conversations for a user, shaped for the conversation list.
 */
export const listConversations = async (userId) => {
  const conversations = await findConversationsByUser(userId);

  // Shape each conversation to include the "other" participant's info
  return conversations.map((conv) => {
    const other = conv.participants.find(
      (p) => p._id.toString() !== userId.toString()
    );
    return {
      _id: conv._id,
      participant: other,
      lastMessage: conv.lastMessage,
      lastMessageAt: conv.lastMessageAt,
      createdAt: conv.createdAt,
    };
  });
};

/**
 * Assert that a user is a participant in a conversation.
 * Throws 403 if not. Used in all message endpoints.
 */
export const assertParticipant = async (conversationId, userId) => {
  const ok = await isParticipant(conversationId, userId);
  if (!ok) throw new ExpressError(403, "You are not a participant in this conversation");
};
