import Comment from "../models/Comment.js";

export const createComment = async ({ thoughtId, authorId, text, parentCommentId = null }) => {
  return await Comment.create({
    thought: thoughtId,
    author: authorId,
    text,
    parentComment: parentCommentId,
  });
};

export const findCommentById = async (commentId) => {
  return await Comment.findById(commentId).populate("author", "username name avatar");
};

/**
 * Returns all top-level comments for a thought, each with their replies embedded.
 * Uses two targeted queries (top-level + all replies) to build the tree efficiently.
 */
export const findCommentsByThought = async (thoughtId) => {
  // Fetch top-level comments
  const topLevel = await Comment.find({ thought: thoughtId, parentComment: null })
    .populate("author", "username name avatar")
    .sort({ createdAt: 1 })
    .lean();

  // Fetch all replies in one query
  const replies = await Comment.find({ thought: thoughtId, parentComment: { $ne: null } })
    .populate("author", "username name avatar")
    .sort({ createdAt: 1 })
    .lean();

  // Group replies by parentComment id
  const replyMap = replies.reduce((acc, reply) => {
    const parentId = reply.parentComment.toString();
    if (!acc[parentId]) acc[parentId] = [];
    acc[parentId].push(reply);
    return acc;
  }, {});

  // Attach replies to their parent
  return topLevel.map((comment) => ({
    ...comment,
    replies: replyMap[comment._id.toString()] || [],
  }));
};

export const updateCommentText = async (commentId, text) => {
  return await Comment.findByIdAndUpdate(
    commentId,
    { text },
    { new: true, runValidators: true }
  ).populate("author", "username name avatar");
};

export const deleteCommentById = async (commentId) => {
  return await Comment.findByIdAndDelete(commentId);
};

/**
 * Delete all replies when a parent comment is deleted.
 */
export const deleteRepliesOfComment = async (commentId) => {
  return await Comment.deleteMany({ parentComment: commentId });
};

export const countCommentsByThought = async (thoughtId) => {
  return await Comment.countDocuments({ thought: thoughtId });
};
