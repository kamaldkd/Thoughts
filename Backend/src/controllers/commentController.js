import { addComment, getComments, editComment, removeComment } from "../services/CommentService.js";

export const getThoughtComments = async (req, res) => {
  const { id: thoughtId } = req.params;
  const comments = await getComments(thoughtId);
  res.json({ comments });
};

export const createComment = async (req, res) => {
  const { id: thoughtId } = req.params;
  const { text } = req.body;

  if (!text?.trim()) {
    return res.status(400).json({ message: "Comment text is required" });
  }

  const comment = await addComment(req.userId, thoughtId, text.trim(), null);
  res.status(201).json({ comment });
};

export const replyToComment = async (req, res) => {
  const { id: thoughtId, commentId } = req.params;
  const { text } = req.body;

  if (!text?.trim()) {
    return res.status(400).json({ message: "Reply text is required" });
  }

  const comment = await addComment(req.userId, thoughtId, text.trim(), commentId);
  res.status(201).json({ comment });
};

export const updateComment = async (req, res) => {
  const { id: commentId } = req.params;
  const { text } = req.body;

  if (!text?.trim()) {
    return res.status(400).json({ message: "Comment text is required" });
  }

  const comment = await editComment(req.userId, commentId, text.trim());
  res.json({ comment });
};

export const deleteComment = async (req, res) => {
  const { id: commentId } = req.params;
  await removeComment(req.userId, commentId);
  res.json({ message: "Comment deleted successfully" });
};
