import { 
  addThought, fetchThoughts, fetchThoughtById, 
  fetchThoughtsOfUser, fetchThoughtsByParamsUserId, 
  editThought, removeThought, fetchUserThoughtsPaginated 
} from "../services/ThoughtService.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// @desc    Create a thought
// @route   POST /api/thoughts
// @access  Private
export const createThought = async (req, res) => {
  const { text } = req.body;
  const files = req.files || [];
  
  const thought = await addThought(req.userId, text, files);
  
  res.status(201).json({ message: "Thought created successfully", thought });
};

// @desc    Get all thoughts
// @route   GET /api/thoughts
// @access  Private
export const getThoughts = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const cursor = req.query.cursor;
  
  const result = await fetchThoughts(limit, cursor);
  
  res.json({ thoughts: result.thoughts, nextCursor: result.nextCursor, hasMore: result.hasMore });
};

// @desc    Get Single thought
// @route   GET /api/thoughts/:id
// @access  Private
export const getThoughtById = async (req, res) => {
  const id = req.params.id;
  const thought = await fetchThoughtById(id);
  res.json({ thought });
};

// @desc    Get thoughts of current user
// @route   GET /api/thoughts/me
// @access  Private
export const getThoughtsOfUser = async (req, res) => {
  const userId = req.userId;
  const thoughts = await fetchThoughtsOfUser(userId);
  res.json({ thoughts });
};

// @desc    Get thoughts by user_id
// @route   GET /api/users/:userId/thoughts
// @access  Private
export const getThoughtsByUserId = async (req, res) => {
  const userId = req.params.userId;
  const result = await fetchThoughtsByParamsUserId(userId);
  res.json({ thoughts: result.thoughts, thoughtsCount: result.thoughtsCount });
};

// @desc    Update thought
// @route   PUT /api/thoughts/:id
// @access  Private
export const updateThought = async (req, res) => {
  const id = req.params.id;
  const { text } = req.body;
  const thought = await editThought(id, text);
  res.json({ thought });
};

// @desc    Delete thought
// @route   DELETE /api/thoughts/:id
// @access  Private (Author only)
export const deleteThought = async (req, res) => {
  const id = req.params.id;
  await removeThought(id);
  res.json({ message: "Thought deleted successfully" });
};

export const getUserThoughts = async (req, res) => {
  const { username } = req.params;
  const limit = Math.min(Number(req.query.limit) || 10, 30);
  const cursor = req.query.cursor;

  const result = await fetchUserThoughtsPaginated(username, limit, cursor);
  
  res.status(200).json({ thoughts: result.thoughts, nextCursor: result.nextCursor, hasNextPage: result.hasNextPage });
};