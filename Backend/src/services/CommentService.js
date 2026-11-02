import {
  createComment,
  findCommentById,
  findCommentsByThought,
  updateCommentText,
  deleteCommentById,
  deleteRepliesOfComment,
} from "../repositories/CommentRepository.js";
import {
  findThoughtById,
  atomicIncrement,
  atomicDecrement,
} from "../repositories/ThoughtRepository.js";
import { createNotification } from "./NotificationService.js";
import ExpressError from "../utils/ExpressError.js";

export const addComment = async (
  userId,
  thoughtId,
  text,
  parentCommentId = null
) => {
  // Verify thought exists
  const thought = await findThoughtById(thoughtId);
  if (!thought) throw new ExpressError(404, "Thought not found");

  let parentComment = null;

  // Validate 1-level nesting: if replying, the parent must be a top-level comment
  if (parentCommentId) {
    parentComment = await findCommentById(parentCommentId);
    if (!parentComment) throw new ExpressError(404, "Parent comment not found");
    if (
      parentComment.parentComment !== null &&
      parentComment.parentComment !== undefined
    ) {
      throw new ExpressError(
        400,
        "Replies to replies are not allowed (max 1-level nesting)"
      );
    }
    // Ensure parent belongs to the same thought
    if (parentComment.thought.toString() !== thoughtId) {
      throw new ExpressError(
        400,
        "Parent comment does not belong to this thought"
      );
    }
  }

  const comment = await createComment({
    thoughtId,
    authorId: userId,
    text,
    parentCommentId,
  });

  // Atomically increment commentsCount on the thought
  await atomicIncrement(thoughtId, "commentsCount");

  const recipients = new Set([String(thought.author?._id || thought.author)]);

  // Also notify the parent comment author when someone replies
  if (parentComment) {
    recipients.add(String(parentComment.author?._id || parentComment.author));
  }

  for (const recipient of recipients) {
    try {
      await createNotification({
        recipient,
        actor: userId,
        type: "comment",
        thought: thoughtId,
        comment: comment._id,
      });
    } catch (error) {
      console.error("Failed to create comment notification:", error.message);
    }
  }

  // Return populated comment
  return await findCommentById(comment._id);
};

export const getComments = async (thoughtId) => {
  const thought = await findThoughtById(thoughtId);
  if (!thought) throw new ExpressError(404, "Thought not found");
  return await findCommentsByThought(thoughtId);
};

export const editComment = async (userId, commentId, text) => {
  const comment = await findCommentById(commentId);
  if (!comment) throw new ExpressError(404, "Comment not found");

  // Ownership check
  if (comment.author._id.toString() !== userId) {
    throw new ExpressError(403, "You are not authorized to edit this comment");
  }

  return await updateCommentText(commentId, text);
};

/**
 * Delete a comment. The comment author OR the thought author can delete a comment.
 * When a top-level comment is deleted, all its replies are cascade-deleted.
 */
export const removeComment = async (userId, commentId) => {
  const comment = await findCommentById(commentId);
  if (!comment) throw new ExpressError(404, "Comment not found");

  // Ownership check
  const isCommentAuthor = comment.author._id.toString() === userId;
  if (!isCommentAuthor) {
    // Check if user is the thought author
    const thought = await findThoughtById(comment.thought.toString());
    const isThoughtAuthor = thought && thought.author._id.toString() === userId;
    if (!isThoughtAuthor) {
      throw new ExpressError(
        403,
        "You are not authorized to delete this comment"
      );
    }
  }

  const thoughtId = comment.thought.toString();
  const isTopLevel =
    comment.parentComment === null || comment.parentComment === undefined;

  if (isTopLevel) {
    // Cascade delete all replies first
    const { deletedCount: replyCount } = await deleteRepliesOfComment(
      commentId
    );
    await deleteCommentById(commentId);
    // Decrement count: 1 (the comment itself) + number of replies deleted
    await atomicDecrement(thoughtId, "commentsCount", 1 + replyCount);
  } else {
    // Just delete the reply
    await deleteCommentById(commentId);
    await atomicDecrement(thoughtId, "commentsCount", 1);
  }

  return { deleted: true };
};
