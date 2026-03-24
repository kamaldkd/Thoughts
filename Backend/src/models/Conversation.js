import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    /* ──────────────────────────────────────────
       PARTICIPANTS
       Always stored sorted (ascending) so that
       findOne({ participants: [A, B] }) is always
       deterministic regardless of call order.
    ────────────────────────────────────────── */
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      validate: {
        validator: (arr) => arr.length === 2,
        message: "A conversation must have exactly 2 participants",
      },
    },

    /* ──────────────────────────────────────────
       LAST MESSAGE SNAPSHOT (for conversation list)
    ────────────────────────────────────────── */
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    lastMessageAt: {
      type: Date,
      default: null,
      index: -1, // descending — conversation list sorted newest first
    },
  },
  { timestamps: true }
);

/* ──────────────────────────────────────────
   INDEXES
────────────────────────────────────────── */

// Fast get-or-create lookup (guaranteed uniqueness for a pair)
conversationSchema.index(
  { participants: 1 },
  {
    unique: true,
    // Sparse so the validator above fires before the index check
  }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
