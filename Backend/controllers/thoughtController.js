import Thought from "../models/Thought.js";
import { cloudinary } from "../config/cloudinary.js";

// @desc    Create a thought
// @route   POST /api/thoughts
// @access  Private
export const createThought = async (req, res) => {
  const { text } = req.body;
  const files = req.files || [];

  console.log("files received:", files.length);

  // Upload files to Cloudinary
  const media = [];

  for (const file of files) {
    try {
      const isImage = file.mimetype.startsWith("image/");

      // Upload buffer directly to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "thoughts",
            resource_type: "auto",
            allowed_formats: isImage
              ? ["jpg", "png", "jpeg"]
              : ["mp4", "mov", "webm", "mkv"],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        uploadStream.end(file.buffer);
      });

      media.push({
        type: isImage ? "image" : "video",
        url: result.secure_url,
      });

      console.log("File uploaded:", file.originalname, "->", result.secure_url);
    } catch (error) {
      console.error("Upload error for:", file.originalname, error.message);
      return res.status(400).json({
        message: `Failed to upload ${file.originalname}: ${error.message}`,
      });
    }
  }

  // Create new thought
  const thought = await Thought.create({
    author: req.userId,
    text,
    media,
  });

  console.log("Thought created:", thought);
  res.status(201).json({
    message: "Thought created successfully",
    thought,
  });
};

// @desc    Get all thoughts
// @route   GET /api/thoughts
// @access  Private
export const getThoughts = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const cursor = req.query.cursor; // last seen _id

  let query = {};

  // if cursor exists, get items older than that
  if (cursor) {
    query._id = { $lt: cursor };
  }

  const thoughts = await Thought.find(query)
    .populate("user", "name email")
    .sort({ _id: -1 }) // newest first
    .limit(limit);

  // prepare next cursor (last item's id)
  const nextCursor =
    thoughts.length > 0 ? thoughts[thoughts.length - 1]._id : null;

  res.json({
    thoughts,
    nextCursor,
    hasMore: thoughts.length === limit,
  });
};
// @desc    Get Single thought
// @route   GET /api/thoughts/:id
// @access  Private
export const getThoughtById = async (req, res) => {};
// @desc    Update thought
// @route   PUT /api/thoughts/:id
// @access  Private
export const updateThought = async (req, res) => {};
// @desc    Delete thought
// @route   DELETE /api/thoughts/:id
// @access  Private
export const deleteThought = async (req, res) => {};
