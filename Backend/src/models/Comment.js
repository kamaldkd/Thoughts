import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    thought: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thought",
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxLength: [500, "Comment cannot exceed 500 characters"],
    },
    // null = top-level comment; ObjectId = reply (1-level max, enforced in service)
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index for efficient comment tree queries
commentSchema.index({ thought: 1, parentComment: 1, createdAt: 1 });

export default mongoose.model("Comment", commentSchema);
