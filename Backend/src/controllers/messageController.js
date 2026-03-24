import {
  getMessagesService,
  markSeenService,
} from "../services/MessageService.js";

/**
 * GET /api/messages/:conversationId?page=1&limit=20
 *
 * Returns paginated message history for a conversation.
 * Newest messages returned first (client should reverse for display).
 */
export const getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const result = await getMessagesService(conversationId, req.userId, { page, limit });

  res.status(200).json({ success: true, ...result });
};

/**
 * POST /api/messages/:conversationId/seen
 *
 * REST endpoint that marks all unread messages in a conversation as "seen".
 * The Socket.IO handler also calls markSeenService internally — this REST
 * endpoint is a fallback for clients that miss the WS event.
 */
export const markSeen = async (req, res) => {
  const { conversationId } = req.params;
  await markSeenService(conversationId, req.userId);
  res.status(200).json({ success: true, message: "Messages marked as seen" });
};
