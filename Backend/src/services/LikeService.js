import { findLike, createLike, deleteLike, checkLikeExists } from "../repositories/LikeRepository.js";
import { atomicIncrement, atomicDecrement, findThoughtById } from "../repositories/ThoughtRepository.js";
import ExpressError from "../utils/ExpressError.js";

/**
 * Toggle a like on a thought.
 * Race-condition safety: the unique compound index on Like { user, thought }
 * rejects duplicate inserts at the DB level even under concurrent requests.
 * Counter updates use MongoDB $inc (atomic) — no read-modify-write pattern.
 */
export const toggleLike = async (userId, thoughtId) => {
  // Verify thought exists before attempting like
  const thought = await findThoughtById(thoughtId);
  if (!thought) throw new ExpressError(404, "Thought not found");

  const existing = await findLike(userId, thoughtId);

  if (existing) {
    // Unlike: remove like doc, decrement counter atomically
    await deleteLike(existing._id);
    const updated = await atomicDecrement(thoughtId, "likesCount");
    return {
      liked: false,
      likesCount: Math.max(0, updated?.likesCount ?? 0),
    };
  }

  // Like: create like doc (unique index rejects race-condition duplicates), increment counter atomically
  try {
    await createLike(userId, thoughtId);
  } catch (err) {
    // Duplicate key error (code 11000) = concurrent like already landed, treat as already liked
    if (err.code === 11000) {
      const t = await findThoughtById(thoughtId);
      return { liked: true, likesCount: t?.likesCount ?? 0 };
    }
    throw err;
  }

  const updated = await atomicIncrement(thoughtId, "likesCount");
  return {
    liked: true,
    likesCount: updated?.likesCount ?? 0,
  };
};

export const getLikeStatus = async (userId, thoughtId) => {
  const exists = await checkLikeExists(userId, thoughtId);
  return { liked: !!exists };
};
