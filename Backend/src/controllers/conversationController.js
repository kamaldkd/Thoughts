import {
  getOrCreateConversation,
  listConversations,
} from "../services/ConversationService.js";

/**
 * POST /api/conversations/create
 * Body: { participantId }
 *
 * Gets or creates a 1-to-1 conversation between the logged-in user
 * and the target participant. Fully idempotent.
 */
export const createOrGetConversation = async (req, res) => {
  const { participantId } = req.body;

  if (!participantId) {
    return res.status(400).json({ success: false, message: "participantId is required" });
  }

  const conversation = await getOrCreateConversation(req.userId, participantId);

  res.status(200).json({ success: true, data: conversation });
};

/**
 * GET /api/conversations
 *
 * Returns all conversations for the logged-in user,
 * sorted by last activity (newest first).
 */
export const getConversations = async (req, res) => {
  const conversations = await listConversations(req.userId);
  res.status(200).json({ success: true, data: conversations });
};
