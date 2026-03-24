import Conversation from "../models/Conversation.js";

/**
 * Find an existing conversation between exactly two users.
 * Participants array is always sorted before querying to ensure
 * key determinism regardless of caller order.
 */
export const findConversationByParticipants = async (userA, userB) => {
  const sorted = [userA, userB].map(String).sort();
  return Conversation.findOne({ participants: { $all: sorted, $size: 2 } }).lean();
};

/**
 * Create a new conversation between two users.
 * Participants stored sorted to guarantee a unique compound index entry.
 */
export const createConversation = async (userA, userB) => {
  const sorted = [userA, userB].map(String).sort();
  const conversation = await Conversation.create({ participants: sorted });
  return conversation.toObject();
};

/**
 * Get all conversations for a user, sorted newest-first.
 * Populates lastMessage and lightweight participant info.
 */
export const findConversationsByUser = async (userId) => {
  return Conversation.find({ participants: userId })
    .sort({ lastMessageAt: -1, createdAt: -1 })
    .populate("participants", "username name avatar")
    .populate({
      path: "lastMessage",
      select: "content messageType status createdAt senderId",
    })
    .lean();
};

/**
 * Update the lastMessage snapshot after a new message is saved.
 */
export const updateConversationLastMessage = async (conversationId, messageId, messageAt) => {
  return Conversation.findByIdAndUpdate(
    conversationId,
    { lastMessage: messageId, lastMessageAt: messageAt },
    { new: true }
  ).lean();
};

/**
 * Verify a user is a participant in a conversation (security check).
 */
export const isParticipant = async (conversationId, userId) => {
  const conv = await Conversation.exists({
    _id: conversationId,
    participants: userId,
  });
  return Boolean(conv);
};
