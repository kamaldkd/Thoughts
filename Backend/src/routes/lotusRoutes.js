import express from "express";
import Joi from "joi";
import {
  createConversation,
  getConversationMessages,
  getConversations,
  getLotusPreferences,
  regenerateLotusMessage,
  removeConversation,
  sendLotusMessage,
  updateConversation,
  updateLotusPreferences,
} from "../controllers/lotusController.js";
import { isLoggedIn } from "../middleware/isLoggedIn.js";
import { lotusLimiter } from "../middleware/rateLimiter.js";
import ExpressError from "../utils/ExpressError.js";
import wrapAsync from "../utils/wrapAsync.js";

const router = express.Router();
const thoughtActionSchema = Joi.string().valid(
  "ask",
  "explain",
  "comment",
  "reply",
  "summarize"
);

const validateBody = (schema, message) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: true,
    stripUnknown: false,
  });
  if (error) throw new ExpressError(400, message);
  req.body = value;
  next();
};

const messageSchema = Joi.object({
  content: Joi.string().trim().min(1).max(2000).required(),
  clientMessageId: Joi.string()
    .pattern(/^[A-Za-z0-9._:-]{1,100}$/)
    .required(),
  thoughtId: Joi.string().hex().length(24),
  thoughtAction: thoughtActionSchema,
})
  .with("thoughtId", "thoughtAction")
  .with("thoughtAction", "thoughtId");

router.use(isLoggedIn);

router.get("/conversations", wrapAsync(getConversations));
router.post("/conversations", wrapAsync(createConversation));
router.get("/preferences", wrapAsync(getLotusPreferences));
router.patch(
  "/preferences",
  validateBody(
    Joi.object({
      mode: Joi.string().valid("friendly", "professional", "creative").required(),
    }),
    "Choose a valid Lotus mode."
  ),
  wrapAsync(updateLotusPreferences)
);

router.get(
  "/conversations/:conversationId/messages",
  wrapAsync(getConversationMessages)
);
router.patch(
  "/conversations/:conversationId",
  validateBody(
    Joi.object({
      title: Joi.string().trim().min(1).max(120).required(),
    }),
    "Conversation titles must contain 1 to 120 characters."
  ),
  wrapAsync(updateConversation)
);
router.delete(
  "/conversations/:conversationId",
  wrapAsync(removeConversation)
);
router.post(
  "/conversations/:conversationId/messages",
  lotusLimiter,
  validateBody(messageSchema, "Send a valid message of up to 2,000 characters."),
  wrapAsync(sendLotusMessage)
);
router.post(
  "/conversations/:conversationId/regenerate",
  lotusLimiter,
  validateBody(
    Joi.object({
      messageId: Joi.string().hex().length(24).required(),
    }),
    "Choose a valid message to regenerate."
  ),
  wrapAsync(regenerateLotusMessage)
);

export default router;
