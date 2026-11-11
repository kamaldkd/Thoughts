import {
  findConversationByParticipants,
  createConversation,
  findConversationsByUser,
  findConversationIdsByUser,
  isParticipant,
} from "../repositories/ConversationRepository.js";
import { countUnreadMessagesByConversation } from "../repositories/MessageRepository.js";
import User from "../models/User.js";
import ExpressError from "../utils/ExpressError.js";

/**
 * Get-or-create a 1-to-1 conversation.
 * Validates that the target user exists and is not the caller.
 */
export const getOrCreateConversation = async (requesterId, participantId) => {
  if (requesterId.toString() === participantId.toString()) {
    throw new ExpressError(400, "You cannot open a conversation with yourself");
  }

  // Confirm target user exists (lean — just need existence)
  const targetUser = await User.findById(participantId).select("_id username name avatar").lean();
  if (!targetUser) throw new ExpressError(404, "User not found");

  // Idempotent — return existing or create new
  let conversation = await findConversationByParticipants(requesterId, participantId);
  if (!conversation) {
    try {
      conversation = await createConversation(requesterId, participantId);
    } catch (error) {
      if (error.code !== 11000) throw error;
      conversation = await findConversationByParticipants(requesterId, participantId);
      if (!conversation) throw error;
    }
  }

  return {
    _id: conversation._id,
    participant: targetUser,
    lastMessage: conversation.lastMessage ?? null,
    lastMessageAt: conversation.lastMessageAt ?? null,
    createdAt: conversation.createdAt,
  };
};

/**
 * Return all conversations for a user, shaped for the conversation list.
 */
export const listConversations = async (userId) => {
  const conversations = await findConversationsByUser(userId);
  const unreadCounts = await countUnreadMessagesByConversation(
    conversations.map((conversation) => conversation._id),
    userId
  );

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
      unreadCount: unreadCounts[conv._id.toString()] ?? 0,
    };
  });
};

export const getUnreadMessageCount = async (userId) => {
  const conversationIds = await findConversationIdsByUser(userId);
  const unreadCounts = await countUnreadMessagesByConversation(conversationIds, userId);
  return Object.values(unreadCounts).reduce((total, count) => total + count, 0);
};

/**
 * Assert that a user is a participant in a conversation.
 * Throws 403 if not. Used in all message endpoints.
 */
export const assertParticipant = async (conversationId, userId) => {
  const ok = await isParticipant(conversationId, userId);
  if (!ok) throw new ExpressError(403, "You are not a participant in this conversation");
};
