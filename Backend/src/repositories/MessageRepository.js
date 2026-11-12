import mongoose from "mongoose";
import Message from "../models/Message.js";

/**
 * Persist a new message document.
 */
export const createMessage = async ({
  conversationId,
  senderId,
  content,
  messageType = "text",
  clientMessageId,
  replyTo,
}) => {
  const identity = clientMessageId
    ? { conversationId, senderId, clientMessageId }
    : null;

  if (identity) {
    const existing = await Message.findOne(identity).lean();
    if (existing) return existing;
  }

  try {
    const message = await Message.create({
      conversationId,
      senderId,
      content,
      messageType,
      ...(replyTo ? { replyTo } : {}),
      ...(clientMessageId ? { clientMessageId } : {}),
    });
    return message.toObject();
  } catch (error) {
    if (error.code !== 11000 || !identity) throw error;

    const existing = await Message.findOne(identity).lean();
    if (!existing) throw error;
    return existing;
  }
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
    .populate({
      path: "replyTo",
      select: "content senderId",
      populate: { path: "senderId", select: "username name avatar" },
    })
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

export const countUnreadMessagesByConversation = async (conversationIds, userId) => {
  if (conversationIds.length === 0) return {};

  const unreadCounts = await Message.aggregate([
    {
      $match: {
        conversationId: { $in: conversationIds },
        senderId: { $ne: new mongoose.Types.ObjectId(userId.toString()) },
        status: { $ne: "seen" },
      },
    },
    { $group: { _id: "$conversationId", count: { $sum: 1 } } },
  ]);

  return Object.fromEntries(
    unreadCounts.map(({ _id, count }) => [_id.toString(), count])
  );
};

/**
 * Find a single message by id.
 */
export const findMessageById = async (messageId) => {
  return Message.findById(messageId).lean();
};

export const findMessageInConversation = async (messageId, conversationId) => {
  return Message.findOne({ _id: messageId, conversationId })
    .populate("senderId", "username name avatar")
    .lean();
};
