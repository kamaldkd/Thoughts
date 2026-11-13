import express from "express";
import Joi from "joi";
import { chatWithLotus } from "../controllers/lotusController.js";
import { isLoggedIn } from "../middleware/isLoggedIn.js";
import { lotusLimiter } from "../middleware/rateLimiter.js";
import ExpressError from "../utils/ExpressError.js";
import wrapAsync from "../utils/wrapAsync.js";

const router = express.Router();

const messageSchema = Joi.object({
  role: Joi.string().valid("user", "assistant").required(),
  content: Joi.string().trim().min(1).max(2000).required(),
});

const validateMessages = (req, res, next) => {
  const { error, value } = Joi.object({
    messages: Joi.array().items(messageSchema).min(1).max(12).required(),
  }).validate(req.body);

  if (error) {
    throw new ExpressError(400, "Send up to 12 valid messages (2,000 characters each).");
  }
  if (value.messages[value.messages.length - 1].role !== "user") {
    throw new ExpressError(400, "The latest message must be from you.");
  }

  req.body = value;
  next();
};

router.post(
  "/chat",
  isLoggedIn,
  lotusLimiter,
  validateMessages,
  wrapAsync(chatWithLotus)
);

export default router;
