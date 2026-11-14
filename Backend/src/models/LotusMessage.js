import mongoose from "mongoose";

const lotusMessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LotusConversation",
      required: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 12000,
    },
    clientMessageId: {
      type: String,
      maxlength: 100,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LotusMessage",
      default: null,
    },
    thoughtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thought",
      default: null,
    },
    thoughtAction: {
      type: String,
      enum: ["ask", "explain", "comment", "reply", "summarize"],
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "complete", "stopped", "failed"],
      default: "complete",
    },
  },
  { timestamps: true }
);

lotusMessageSchema.index({ conversation: 1, createdAt: 1, _id: 1 });
lotusMessageSchema.index(
  { conversation: 1, clientMessageId: 1 },
  {
    unique: true,
    partialFilterExpression: { clientMessageId: { $type: "string" } },
  }
);
lotusMessageSchema.index(
  { conversation: 1, replyTo: 1 },
  {
    unique: true,
    partialFilterExpression: { replyTo: { $type: "objectId" } },
  }
);

export default mongoose.model("LotusMessage", lotusMessageSchema);
