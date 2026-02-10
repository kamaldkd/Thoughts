import Thought from "../models/Thought.js";

// @desc    Create a thought
// @route   POST /api/thoughts
// @access  Private
export const createThought = async (req, res) => {
  const { text } = req.body;
  const files = req.files || [];

  console.log("files received:", files);

  const media = files.map((file) => {
    const isImage = file.mimetype.startsWith("image/");

    // Some multer storage engines attach the uploaded file URL under different keys.
    const url =
      file.path || file.secure_url || file.url || file.location || file.fileUrl;

    return {
      type: isImage ? "image" : "video",
      url,
    };
  });

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
