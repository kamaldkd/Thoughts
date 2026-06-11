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
      // Not required at schema level — Google OAuth users have password: null
      required: function() { return !this.googleId; },
      select: false,
    },

    googleId: {
      type: String,
      default: null,
      index: true,
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
      default: "",
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

    followersCount: {
      type: Number,
      default: 0,
    },

    followingCount: {
      type: Number,
      default: 0,
    },

    location: {
      type: String,
      default: "",
    },

    isPrivate: {
      type: Boolean,
      default: false,
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
