import express from "express";
import { isLoggedIn } from "../middleware/isLoggedIn.js";
import {
  sendMessage,
  getMessages,
  markSeen,
  deleteMessage,
} from "../controllers/messageController.js";
import { messageBurstLimiter, messageUserLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// All message routes require authentication
router.use(isLoggedIn);

// GET  /api/messages/:conversationId?page=1&limit=20  → paginated history
router.get("/:conversationId", getMessages);

// POST /api/messages/:conversationId                   → persist and deliver a message
router.post("/:conversationId", sendMessage);

// POST /api/messages/:conversationId/seen             → mark as seen (REST fallback)
router.post("/:conversationId/seen", markSeen);

// DELETE /api/messages/:conversationId/:messageId → hide or delete a message
router.delete("/:conversationId/:messageId", deleteMessage);

export default router;
