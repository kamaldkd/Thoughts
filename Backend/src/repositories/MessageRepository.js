import Message from "../models/Message.js";

/**
 * Persist a new message document.
 */
export const createMessage = async ({ conversationId, senderId, content, messageType = "text" }) => {
  const message = await Message.create({ conversationId, senderId, content, messageType });
  return message.toObject();
};

/**
 * Paginated message history for a conversation.
 * Returns messages newest-first (client should reverse for display).
 */
export const findMessagesByConversation = async (conversationId, { page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;
  return Message.find({ conversationId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("senderId", "username name avatar")
    .lean();
};

/**
 * Mark a single message as delivered.
 */
export const markMessageDelivered = async (messageId) => {
  return Message.findByIdAndUpdate(
    messageId,
    { $set: { status: "delivered" } },
    { new: true }
  ).lean();
};

/**
 * Bulk-mark all unread messages in a conversation as seen
 * (excludes the reader's own messages).
 */
export const markConversationSeen = async (conversationId, readerId) => {
  return Message.updateMany(
    {
      conversationId,
      senderId: { $ne: readerId },
      status: { $ne: "seen" },
    },
    { $set: { status: "seen" } }
  );
};

/**
 * Count total messages in a conversation (for pagination metadata).
 */
export const countMessages = async (conversationId) => {
  return Message.countDocuments({ conversationId });
};

/**
 * Find a single message by id.
 */
export const findMessageById = async (messageId) => {
  return Message.findById(messageId).lean();
};
