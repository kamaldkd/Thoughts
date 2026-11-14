import Comment from "../models/Comment.js";
import Follow from "../models/Follow.js";
import LotusMessage from "../models/LotusMessage.js";
import Thought from "../models/Thought.js";
import User from "../models/User.js";
import {
  createLotusConversation,
  createLotusUserMessage,
  deleteLotusConversation,
  findLotusAssistantReply,
  getOwnedLotusConversation,
  listLotusConversations,
  listLotusMessages,
  markLotusUserMessage,
  renameLotusConversation,
  saveLotusAssistantReply,
  touchLotusConversation,
} from "../services/LotusConversationService.js";
import { streamLotusCompletion } from "../services/lotusProvider.js";
import ExpressError from "../utils/ExpressError.js";

const THOUGHT_ACTION_PROMPTS = {
  explain: "Explain the post in clear, neutral language.",
  comment: "Suggest one thoughtful, relevant comment for this post.",
  reply: "Write a thoughtful reply that engages with the post respectfully.",
  summarize: "Summarize the discussion and identify its main points.",
};

const sendEvent = (res, event, data) =>
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

const startEventStream = (res) => {
  res.status(200).set({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
};

export const getConversations = async (req, res) => {
  const conversations = await listLotusConversations(req.userId);
  res.json({ success: true, conversations });
};

export const createConversation = async (req, res) => {
  const conversation = await createLotusConversation(req.userId);
  res.status(201).json({
    success: true,
    conversation: {
      _id: conversation._id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    },
  });
};

export const getConversationMessages = async (req, res) => {
  const conversation = await getOwnedLotusConversation(
    req.params.conversationId,
    req.userId
  );
  const messages = await listLotusMessages(conversation);
  res.json({ success: true, messages });
};

export const updateConversation = async (req, res) => {
  const conversation = await getOwnedLotusConversation(
    req.params.conversationId,
    req.userId
  );
  const updated = await renameLotusConversation(conversation, req.body.title);
  res.json({
    success: true,
    conversation: {
      _id: updated._id,
      title: updated.title,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    },
  });
};

export const removeConversation = async (req, res) => {
  const conversation = await getOwnedLotusConversation(
    req.params.conversationId,
    req.userId
  );
  await deleteLotusConversation(conversation);
  res.json({ success: true });
};

export const getLotusPreferences = async (req, res) => {
  const user = await User.findById(req.userId).select("lotusMode").lean();
  if (!user) throw new ExpressError(404, "User not found");
  res.json({ success: true, mode: user.lotusMode || "friendly" });
};

export const updateLotusPreferences = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.userId,
    { $set: { lotusMode: req.body.mode } },
    { new: true, runValidators: true }
  ).select("lotusMode");
  if (!user) throw new ExpressError(404, "User not found");
  res.json({ success: true, mode: user.lotusMode });
};

const getThoughtContext = async ({ userId, thoughtId, action, content }) => {
  if (!thoughtId) return { prompt: content };

  const thought = await Thought.findById(thoughtId)
    .select("author text media createdAt")
    .populate("author", "name username isPrivate")
    .lean();
  if (!thought) throw new ExpressError(404, "Thought not found");

  const author = thought.author;
  const isOwner = String(author?._id) === String(userId);
  if (!author) throw new ExpressError(404, "Thought not found");
  if (author.isPrivate && !isOwner) {
    const canView = await Follow.exists({ follower: userId, following: author._id });
    if (!canView) throw new ExpressError(404, "Thought not found");
  }

  const user = await User.findById(userId).select("lotusMode").lean();
  const isDiscussionAction = action === "summarize";
  const comments = isDiscussionAction
    ? await Comment.find({ thought: thought._id })
        .select("text createdAt")
        .sort({ createdAt: -1 })
        .limit(30)
        .lean()
    : [];
  const postText = thought.text?.trim() || "This post contains media without a caption.";
  const commentText = comments.length
    ? `\n\nDiscussion comments (oldest first):\n${comments
        .reverse()
        .map((comment) => `- ${comment.text}`)
        .join("\n")}`
    : "";
  const actionPrompt =
    THOUGHT_ACTION_PROMPTS[action] ||
    (action === "ask"
      ? "Answer the user's question about this post."
      : "Help the user with this Thoughts post.");

  return {
    prompt: [
      `The user asked: ${actionPrompt}`,
      `Post by @${author.username}:`,
      postText,
      thought.media?.length
        ? "The post also contains media. Its visual contents are not available in this chat."
        : "",
      commentText,
      action === "ask" ? `\nUser's question: ${content}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    mode: user?.lotusMode || "friendly",
  };
};

const getProviderMessages = async (conversation, userMessage, contextPrompt) => {
  const rows = await LotusMessage.find({
    conversation: conversation._id,
    status: { $in: ["pending", "complete", "stopped"] },
  })
    .select("role content status replyTo createdAt")
    .sort({ createdAt: -1, _id: -1 })
    .limit(12)
    .lean();

  const messages = rows
    .reverse()
    .filter(
      (message) =>
        !(
          String(message.replyTo || "") === String(userMessage._id) &&
          message.role === "assistant"
        )
    )
    .map((message) => ({
      role: message.role,
      content:
        String(message._id) === String(userMessage._id)
          ? contextPrompt
          : message.content,
    }));

  if (messages[messages.length - 1]?.role !== "user") {
    throw new ExpressError(409, "Lotus couldn't prepare this reply. Please try again.");
  }
  return messages;
};

const replaySavedReply = async ({ res, reply, conversation, userMessage }) => {
  if (!reply) return false;
  startEventStream(res);
  if (reply.content) sendEvent(res, "delta", { text: reply.content });
  sendEvent(res, "done", {
    messageId: reply._id,
    userMessageId: userMessage._id,
    title: conversation.title,
    updatedAt: conversation.updatedAt,
    status: reply.status,
  });
  res.end();
  return true;
};

const streamReply = async ({
  req,
  res,
  conversation,
  userMessage,
  regenerate = false,
}) => {
  const controller = new AbortController();
  const onClose = () => {
    if (!res.writableEnded) controller.abort();
  };
  res.on("close", onClose);

  let responseStarted = false;
  let replyText = "";
  try {
    const context = await getThoughtContext({
      userId: req.userId,
      thoughtId: userMessage.thoughtId,
      action: userMessage.thoughtAction,
      content: userMessage.content,
    });
    const messages = await getProviderMessages(
      conversation,
      userMessage,
      context.prompt
    );
    const user = await User.findById(req.userId).select("lotusMode").lean();
    const mode = context.mode || user?.lotusMode || "friendly";

    for await (const text of streamLotusCompletion({
      messages,
      mode,
      signal: controller.signal,
    })) {
      if (!responseStarted) {
        startEventStream(res);
        responseStarted = true;
      }
      replyText += text;
      sendEvent(res, "delta", { text });
    }

    const assistantMessage = await saveLotusAssistantReply({
      conversation,
      owner: req.userId,
      userMessage,
      content: replyText,
      status: "complete",
    });
    await markLotusUserMessage(userMessage, "complete");
    await touchLotusConversation(conversation, userMessage.content);

    if (!responseStarted) {
      startEventStream(res);
      responseStarted = true;
    }
    sendEvent(res, "done", {
      messageId: assistantMessage._id,
      userMessageId: userMessage._id,
      title: conversation.title,
      updatedAt: conversation.updatedAt,
      regenerated: regenerate,
    });
    res.end();
  } catch (error) {
    if (controller.signal.aborted) {
      if (replyText) {
        await saveLotusAssistantReply({
          conversation,
          owner: req.userId,
          userMessage,
          content: replyText,
          status: "stopped",
        });
      }
      await markLotusUserMessage(userMessage, "stopped");
      if (responseStarted && !res.destroyed) {
        sendEvent(res, "done", { status: "stopped" });
        res.end();
      }
      return;
    }

    await markLotusUserMessage(userMessage, "failed");
    if (replyText) {
      await saveLotusAssistantReply({
        conversation,
        owner: req.userId,
        userMessage,
        content: replyText,
        status: "failed",
      });
    }
    if (!responseStarted) throw error;

    sendEvent(res, "error", {
      message:
        error instanceof ExpressError
          ? error.message
          : "Lotus's response was interrupted. Please try again.",
    });
    res.end();
  } finally {
    res.off("close", onClose);
  }
};

const startMessage = async (req, res, { regenerate = false } = {}) => {
  const conversation = await getOwnedLotusConversation(
    req.params.conversationId,
    req.userId
  );
  let userMessage;

  if (regenerate) {
    userMessage = await LotusMessage.findOne({
      _id: req.body.messageId,
      conversation: conversation._id,
      owner: req.userId,
      role: "user",
    });
    if (!userMessage) throw new ExpressError(404, "Message not found");
    const latestUserMessage = await LotusMessage.findOne({
      conversation: conversation._id,
      role: "user",
    })
      .sort({ createdAt: -1, _id: -1 })
      .select("_id")
      .lean();
    if (String(latestUserMessage?._id) !== String(userMessage._id)) {
      throw new ExpressError(409, "Only the latest reply can be regenerated.");
    }
    await markLotusUserMessage(userMessage, "pending");
  } else {
    const created = await createLotusUserMessage({
      conversation,
      owner: req.userId,
      content: req.body.content,
      clientMessageId: req.body.clientMessageId,
      thoughtId: req.body.thoughtId,
      thoughtAction: req.body.thoughtAction,
    });
    userMessage = created.message;
    if (!created.created) {
      if (userMessage.status === "pending") {
        const isStale = Date.now() - new Date(userMessage.updatedAt).getTime() > 120_000;
        if (!isStale) {
          throw new ExpressError(409, "This message is already being processed.");
        }
      }
      const savedReply = await findLotusAssistantReply(conversation, userMessage);
      if (savedReply) {
        await replaySavedReply({ res, reply: savedReply, conversation, userMessage });
        return;
      }
      if (userMessage.status === "complete") {
        throw new ExpressError(409, "Lotus's reply is unavailable. Please try again.");
      }
      await markLotusUserMessage(userMessage, "pending");
    }
  }

  await touchLotusConversation(conversation, userMessage.content);
  await streamReply({
    req,
    res,
    conversation,
    userMessage,
    regenerate,
  });
};

export const sendLotusMessage = (req, res) =>
  startMessage(req, res);

export const regenerateLotusMessage = (req, res) =>
  startMessage(req, res, { regenerate: true });
