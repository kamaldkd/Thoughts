import mongoose from "mongoose";
import ExpressError from "../utils/ExpressError.js";

const mediaSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  { _id: false } // we don't need separate _id for each media item
);

const thoughtSchema = mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // optional text content
    text: {
      type: String,
      maxLength: 1000,
      trim: true,
    },

    // multiple images/videos
    media: {
      type: [mediaSchema],
      default: [],
      validate: {
        validator: function (arr) {
          // limit number of media files per thought
          return arr.length <= 10;
        },
        message: "A thought can have at most 10 media files",
      },
    },

    // basic engagement fields (for future use)
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true } // automatically adds createdAt and updatedAt
);

// at least one of text or media must exist
thoughtSchema.pre("validate", function () {
  if (!this.text && this.media.length === 0) {
    return next(new Error("Thought must have text or at least one media"));
  }
});

const Thought = mongoose.model("Thought", thoughtSchema);
export default Thought;
