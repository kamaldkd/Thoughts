import Like from "../models/Like.js";
import Thought from "../models/Thought.js";

export const toggleLike = async (req, res) => {
  try {
    const userId = req.userId;
    const { thoughtId } = req.params;

    const existing = await Like.findOne({
      user: userId,
      thought: thoughtId,
    });

    if (existing) {
      await Like.deleteOne({ _id: existing._id });

      // optional denormalized count
      await Thought.findByIdAndUpdate(thoughtId, {
        $inc: { likesCount: -1 },
      });

      return res.json({ liked: false });
    }

    await Like.create({
      user: userId,
      thought: thoughtId,
    });

    await Thought.findByIdAndUpdate(thoughtId, {
      $inc: { likesCount: 1 },
    });

    res.json({ liked: true });
  } catch (err) {
    res.status(500).json({ message: "Like toggle failed" });
  }
};

export const likeStatus = async (req, res) => {
  const liked = await Like.exists({
    user: req.userId,
    thought: req.params.thoughtId,
  });

  res.json({ liked: !!liked });
};