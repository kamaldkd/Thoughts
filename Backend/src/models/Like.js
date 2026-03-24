import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    thought: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thought",
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate likes
likeSchema.index({ user: 1, thought: 1 }, { unique: true });

export default mongoose.model("Like", likeSchema);