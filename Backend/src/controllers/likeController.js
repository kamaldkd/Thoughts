import { toggleLike, getLikeStatus } from "../services/LikeService.js";

export const toggleLikeHandler = async (req, res) => {
  const { thoughtId } = req.params;
  const result = await toggleLike(req.userId, thoughtId);
  res.json(result);
};

export const likeStatus = async (req, res) => {
  const result = await getLikeStatus(req.userId, req.params.thoughtId);
  res.json(result);
};