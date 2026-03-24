import express from "express";
import { isLoggedIn } from "../middleware/isLoggedIn.js";
import { createOrGetConversation, getConversations } from "../controllers/conversationController.js";

const router = express.Router();

// All conversation routes require authentication
router.use(isLoggedIn);

// GET  /api/conversations           → list my conversations
router.get("/", getConversations);

// POST /api/conversations/create    → get-or-create a conversation
router.post("/create", createOrGetConversation);

export default router;
