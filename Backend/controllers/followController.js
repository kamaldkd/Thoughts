import User from "../models/User.js";

export const followUser = async (req, res) => {
  const currentUserId = req.userId;
  const targetUserId = req.params.id;

  if (currentUserId === targetUserId) {
    return res.status(400).json({ message: "You cannot follow yourself" });
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    return res.status(404).json({ message: "User not found" });
  }

  // prevent double follow
  const alreadyFollowing = await User.exists({
    _id: currentUserId,
    following: targetUserId,
  });

  if (alreadyFollowing) {
    return res.status(400).json({ message: "Already following" });
  }

  await User.findByIdAndUpdate(currentUserId, {
    $addToSet: { following: targetUserId },
    $inc: { followingCount: 1 },
  });

  await User.findByIdAndUpdate(targetUserId, {
    $addToSet: { followers: currentUserId },
    $inc: { followersCount: 1 },
  });

  res.status(200).json({ message: "Followed successfully" });
};

export const unfollowUser = async (req, res) => {
  const currentUserId = req.userId;
  const targetUserId = req.params.id;

  const isFollowing = await User.exists({
    _id: currentUserId,
    following: targetUserId,
  });

  if (!isFollowing) {
    return res.status(400).json({ message: "Not following this user" });
  }

  await User.findByIdAndUpdate(currentUserId, {
    $pull: { following: targetUserId },
    $inc: { followingCount: -1 },
  });

  await User.findByIdAndUpdate(targetUserId, {
    $pull: { followers: currentUserId },
    $inc: { followersCount: -1 },
  });

  res.status(200).json({ message: "Unfollowed successfully" });
};

export const isFollowing = async (req, res) => {
  const currentUserId = req.userId;
  const targetUserId = req.params.id;

  const following = await User.exists({
    _id: currentUserId,
    following: targetUserId,
  });

  res.status(200).json({ isFollowing: Boolean(following) });
};