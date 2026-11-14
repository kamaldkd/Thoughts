import mongoose from "mongoose";
import LotusConversation from "../models/LotusConversation.js";
import LotusMessage from "../models/LotusMessage.js";
import ExpressError from "../utils/ExpressError.js";

export const isValidLotusId = (id) => mongoose.Types.ObjectId.isValid(id);

export const createLotusConversation = (owner) =>
  LotusConversation.create({ owner });

export const listLotusConversations = (owner) =>
  LotusConversation.find({ owner })
    .select("_id title createdAt updatedAt")
    .sort({ updatedAt: -1, _id: -1 })
    .lean();

export const getOwnedLotusConversation = async (id, owner) => {
  if (!isValidLotusId(id)) throw new ExpressError(404, "Conversation not found");
  const conversation = await LotusConversation.findOne({ _id: id, owner });
  if (!conversation) throw new ExpressError(404, "Conversation not found");
  return conversation;
};

export const renameLotusConversation = async (conversation, title) => {
  conversation.title = title;
  await conversation.save();
  return conversation;
};

export const deleteLotusConversation = async (conversation) => {
  await LotusMessage.deleteMany({ conversation: conversation._id });
  await conversation.deleteOne();
};

export const listLotusMessages = (conversation) =>
  LotusMessage.find({ conversation: conversation._id })
    .select("_id role content status thoughtId thoughtAction createdAt")
    .sort({ createdAt: 1, _id: 1 })
    .lean();

export const createLotusUserMessage = async ({
  conversation,
  owner,
  content,
  clientMessageId,
  thoughtId,
  thoughtAction,
}) => {
  try {
    const message = await LotusMessage.create({
      conversation: conversation._id,
      owner,
      role: "user",
      content,
      clientMessageId,
      thoughtId: thoughtId || null,
      thoughtAction: thoughtAction || null,
      status: "pending",
    });
    return { message, created: true };
  } catch (error) {
    if (error.code !== 11000) throw error;
    const existing = await LotusMessage.findOne({
      conversation: conversation._id,
      clientMessageId,
      role: "user",
    });
    if (!existing) throw error;
    return { message: existing, created: false };
  }
};

export const findLotusAssistantReply = (conversation, userMessage) =>
  LotusMessage.findOne({
    conversation: conversation._id,
    replyTo: userMessage._id,
    role: "assistant",
  });

export const saveLotusAssistantReply = ({
  conversation,
  owner,
  userMessage,
  content,
  status,
}) =>
  LotusMessage.findOneAndUpdate(
    {
      conversation: conversation._id,
      replyTo: userMessage._id,
      role: "assistant",
    },
    {
      $set: { content, status },
      $setOnInsert: {
        conversation: conversation._id,
        owner,
        role: "assistant",
        replyTo: userMessage._id,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

export const markLotusUserMessage = (message, status) =>
  LotusMessage.updateOne({ _id: message._id }, { $set: { status } });

export const touchLotusConversation = async (conversation, content) => {
  if (conversation.title === "New chat") {
    const title = content
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 117);
    conversation.title = title.length < content.trim().length
      ? `${title}...`
      : title;
  }
  conversation.updatedAt = new Date();
  await conversation.save();
};
