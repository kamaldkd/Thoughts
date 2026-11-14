import mongoose from "mongoose";

const lotusConversationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "New chat",
    },
  },
  { timestamps: true }
);

lotusConversationSchema.index({ owner: 1, updatedAt: -1 });

export default mongoose.model("LotusConversation", lotusConversationSchema);
