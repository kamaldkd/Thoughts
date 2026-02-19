import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    /* =======================
       AUTH / IDENTITY
    ======================== */
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    /* =======================
       PROFILE (EDITABLE)
    ======================== */
    name: {
      type: String,
      required: true,
      trim: true,
    },

    bio: {
      type: String,
      maxlength: 160,
      default: "",
    },

    avatar: {
      type: String,
      default: "",
    },

    website: {
      type: String,
      default: "",
    },

    socialLinks: {
      github: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      twitter: { type: String, default: "" },
      instagram: { type: String, default: "" },
    },

    /* =======================
       FOLLOW SYSTEM
    ======================== */
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    followersCount: {
      type: Number,
      default: 0,
    },

    followingCount: {
      type: Number,
      default: 0,
    },

    /* =======================
       ACTIVITY / STATUS
    ======================== */
    thoughtsCount: {
      type: Number,
      default: 0,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;
