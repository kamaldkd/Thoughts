import Like from "../models/Like.js";

export const findLike = async (userId, thoughtId) => {
  return await Like.findOne({ user: userId, thought: thoughtId });
};

export const createLike = async (userId, thoughtId) => {
  return await Like.create({ user: userId, thought: thoughtId });
};

export const deleteLike = async (likeId) => {
  return await Like.deleteOne({ _id: likeId });
};

export const checkLikeExists = async (userId, thoughtId) => {
  return await Like.exists({ user: userId, thought: thoughtId });
};
