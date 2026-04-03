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
       UNIQUE PAIR KEY (UserA_ID_UserB_ID sorted)
       Used for deterministic get-or-create constraints
    ────────────────────────────────────────── */
    participantKey: {
      type: String,
      unique: true,
      required: true,
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

conversationSchema.index({ participants: 1 });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
