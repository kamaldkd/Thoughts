import Thought from "../models/Thought.js";

export const createThoughtDoc = async (thoughtData) => {
  return await Thought.create(thoughtData);
};

export const getThoughtsList = async (query = {}, options = {}) => {
  const { limit = 10, sort = { _id: -1 }, select } = options;
  let q = Thought.find(query).sort(sort).limit(limit);
  if (select) q = q.select(select);
  return await q.populate("author", "username name email avatar");
};

export const findThoughtById = async (id) => {
  return await Thought.findById(id).populate("author", "username name email");
};

export const findThoughtsByAuthorId = async (authorId) => {
  return await Thought.find({ author: authorId })
    .populate("author", "username name email avatar")
    .sort({ createdAt: -1 });
};

export const countThoughtsByAuthorId = async (authorId) => {
  return await Thought.countDocuments({ author: authorId });
};

export const updateThoughtDoc = async (id, text) => {
  return await Thought.findByIdAndUpdate(id, { text }, { new: true })
    .populate("author", "username name email");
};

export const deleteThoughtDoc = async (id) => {
  return await Thought.findByIdAndDelete(id);
};

/**
 * Atomically increment a numeric field (e.g. likesCount, commentsCount).
 * Uses MongoDB $inc for race-condition safety — no read-modify-write.
 */
export const atomicIncrement = async (thoughtId, field, amount = 1) => {
  return await Thought.findByIdAndUpdate(
    thoughtId,
    { $inc: { [field]: amount } },
    { new: true }
  );
};

/**
 * Atomically decrement a numeric field, floor at 0 to avoid negative counts.
 */
export const atomicDecrement = async (thoughtId, field, amount = 1) => {
  return await Thought.findByIdAndUpdate(
    thoughtId,
    { $inc: { [field]: -amount } },
    { new: true }
  );
};
