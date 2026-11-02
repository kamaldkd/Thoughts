
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["like", "comment", "follow"],
      required: true,
    },

    thought: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Thought",
      default: null,
    },

    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },

    readAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Notification feed pagination
notificationSchema.index({
  recipient: 1,
  _id: -1,
});

// Unread notification queries
notificationSchema.index({
  recipient: 1,
  readAt: 1,
  expiresAt: 1,
});

// Automatically delete expired notifications
notificationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

export default mongoose.model(
  "Notification",
  notificationSchema
);
