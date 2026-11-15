import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    media: {
      url: { type: String, required: true },
      type: { type: String, enum: ["image", "video"], required: true },
      publicId: { type: String, required: true },
    },
    viewedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

storySchema.index({ author: 1, expiresAt: 1 });

export default mongoose.model("Story", storySchema);
