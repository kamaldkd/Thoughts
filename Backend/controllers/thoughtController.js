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
    .populate("author", "username name email")
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
export const getThoughtById = async (req, res) => {
  const id = req.params.id;

  const thought = await Thought.findById(id).populate(
    "author",
    "username name email"
  );
  if (!thought) {
    return res.status(404).json({ message: "Thought not found" });
  }
  res.json({ thought });
};
// @desc    Get thoughts of current user
// @route   GET /api/thoughts/me
// @access  Private
export const getThoughtsOfUser = async (req, res) => {
  const userId = req.userId;

  const thoughts = await Thought.find({ author: userId })
    .populate("author", "username name email avatar")
    .sort({ createdAt: -1 });
  if (!thoughts.length) {
    return res.status(404).json({ message: "No thoughts found for this user" });
  }
  res.json({ thoughts });
};
// @desc    Get thoughts by user_id
// @route   GET /api/users/:userId/thoughts
// @access  Private
export const getThoughtsByUserId = async (req, res) => {
  const userId = req.params.userId;

  const thoughts = await Thought.find({ author: userId })
    .populate("author", "username name email")
    .sort({ createdAt: -1 });

  const thoughtsCount = await Thought.countDocuments({ author: userId });
  if (!thoughts.length) {
    return res.status(404).json({ message: "No thoughts found for this user" });
  }
  res.json({ thoughts, thoughtsCount });
};

// @desc    Update thought
// @route   PUT /api/thoughts/:id
// @access  Private
export const updateThought = async (req, res) => {
  const id = req.params.id;
  const { text } = req.body;
  const thought = await Thought.findByIdAndUpdate(
    id,
    { text },
    { new: true }
  ).populate("author", "username name email");
  if (!thought) {
    return res.status(404).json({ message: "Thought not found" });
  }
  res.json({ thought });
};
// @desc    Delete thought
// @route   DELETE /api/thoughts/:id
// @access  Private (Author only)
export const deleteThought = async (req, res) => {
  const id = req.params.id;
  // delete associated media from Cloudinary
  const thought = await Thought.findById(id);
  if (!thought) {
    return res.status(404).json({ message: "Thought not found" });
  }
  for (const mediaItem of thought.media) {
    try {
      const publicId = mediaItem.url.split("/").slice(-1)[0].split(".")[0]; // extract public_id from URL
      let resourceType = mediaItem.type === "image" ? "image" : "video";
      await cloudinary.uploader.destroy(`thoughts/${publicId}`, {
        resource_type: resourceType,
      });
      console.log("Deleted media from Cloudinary:", mediaItem.url);
    } catch (error) {
      console.error(
        "Error deleting media from Cloudinary:",
        mediaItem.url,
        error.message
      );
    }
  }
  await Thought.findByIdAndDelete(id);
  res.json({ message: "Thought deleted successfully" });
};
