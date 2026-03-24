import User from "../models/User.js";
import Follow from "../models/Follow.js";
import { withTransactionRetry } from "../utils/withTransactionRetry.js";

export const followUser = async (req, res) => {
  const currentUserId = req.userId;
  const targetUserId = req.params.id;

  if (currentUserId === targetUserId) {
    return res.status(400).json({ message: "You cannot follow yourself" });
  }

  try {
    await withTransactionRetry(async (session) => {
      // 1. OPTIMIZATION: Blind Insert. Rely on MongoDB natively executing Compound Unique Index (E11000).
      // Eliminates `findOne` network read natively, jumping directly to write-intent.
      await Follow.create([{ follower: currentUserId, following: targetUserId }], { session });

      // 2. OPTIMIZATION: Blind Increment Target User 
      // Returns explicitly null if user doesn't exist. Eliminates preceding `findById`.
      const targetUpdated = await User.findByIdAndUpdate(targetUserId, { $inc: { followersCount: 1 } }, { session });
      if (!targetUpdated) throw Object.assign(new Error("User not found"), { status: 404 });

      // 3. Blind Increment Current User
      await User.findByIdAndUpdate(currentUserId, { $inc: { followingCount: 1 } }, { session });
    }, 5); 

    console.info(JSON.stringify({ level: "INFO", event: "FOLLOW_SUCCESS", follower: currentUserId, following: targetUserId }));
    res.status(200).json({ message: "Followed successfully" });
  } catch (error) {
    // Gracefully handle Race-Condition Duplicate Attacks natively intercepting E11000s
    if (error.code === 11000) return res.status(400).json({ message: "User already followed", error: "DuplicateKey" });
    
    if (error.status) return res.status(error.status).json({ message: error.message });

    console.error(JSON.stringify({ level: "ERROR", event: "FOLLOW_FAILURE", message: error.message }));
    res.status(500).json({ message: "Server error during follow operation" });
  }
};

export const unfollowUser = async (req, res) => {
  const currentUserId = req.userId;
  const targetUserId = req.params.id;

  try {
    await withTransactionRetry(async (session) => {
      // 1. OPTIMIZATION: Blind Delete. Pull document natively from DB without probing.
      const deletedFollow = await Follow.findOneAndDelete({ follower: currentUserId, following: targetUserId }, { session });
      
      // If deletedFollow is null, relationship never existed. Eliminates preceding `findOne`.
      if (!deletedFollow) throw Object.assign(new Error("Not following this user"), { status: 400 });

      // 2. Blind Decrements
      await User.findByIdAndUpdate(currentUserId, { $inc: { followingCount: -1 } }, { session });
      await User.findByIdAndUpdate(targetUserId, { $inc: { followersCount: -1 } }, { session });
    }, 5);

    console.info(JSON.stringify({ level: "INFO", event: "UNFOLLOW_SUCCESS", follower: currentUserId, following: targetUserId }));
    res.status(200).json({ message: "Unfollowed successfully" });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    
    console.error(JSON.stringify({ level: "ERROR", event: "UNFOLLOW_FAILURE", message: error.message }));
    res.status(500).json({ message: "Server error during unfollow operation" });
  }
};

export const isFollowing = async (req, res) => {
  const currentUserId = req.userId;
  const targetUserId = req.params.id;

  const following = await Follow.exists({
    follower: currentUserId,
    following: targetUserId,
  });

  res.status(200).json({ isFollowing: Boolean(following) });
};