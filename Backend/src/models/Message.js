import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    /* ──────────────────────────────────────────
       CORE REFERENCES
    ────────────────────────────────────────── */
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /* ──────────────────────────────────────────
       CONTENT
       Extensible: add mediaUrl, replyTo, etc. later
    ────────────────────────────────────────── */
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },

    messageType: {
      type: String,
      enum: ["text", "image"],
      default: "text",
    },

    /* ──────────────────────────────────────────
       READ RECEIPTS
       sent      → persisted in DB
       delivered → receiver's socket is online
       seen      → receiver opened the conversation
    ────────────────────────────────────────── */
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },
  },
  { timestamps: true }
);

/* ──────────────────────────────────────────
   COMPOUND INDEX — paginated message history
   { conversationId, createdAt } lets MongoDB
   efficiently sort & paginate per conversation.
────────────────────────────────────────── */
messageSchema.index({ conversationId: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
