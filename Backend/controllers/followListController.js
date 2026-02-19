import mongoose from "mongoose";
import User from "../models/User.js";

export const getFollowers = async (req, res) => {
  const { username } = req.params;
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const cursor = req.query.cursor;

  // 🔴 GUARD: never assume req.userId exists
  if (!req.userId) {
    throw new ExpressError(401, "Unauthorized");
  }

  const currentUserId = req.userId;

  const user = await User.findOne({ username }).select("_id");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const query = {
    following: user._id,
  };

  if (cursor) {
    query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
  }

  const followers = await User.find(query)
    .select("username name avatar")
    .sort({ _id: -1 })
    .limit(limit + 1);

  const hasNextPage = followers.length > limit;
  if (hasNextPage) followers.pop();

  let followingSet = new Set();

  if (currentUserId) {
    const me = await User.findById(currentUserId).select("following");
    followingSet = new Set(me.following.map((id) => id.toString()));
  }

  const users = followers.map((u) => ({
    _id: u._id,
    username: u.username,
    name: u.name,
    avatar: u.avatar,
    isFollowing: followingSet.has(u._id.toString()),
  }));

  const nextCursor = users.length > 0 ? users[users.length - 1]._id : null;

  res.status(200).json({
    users,
    nextCursor,
    hasNextPage,
  });
};

export const getFollowing = async (req, res) => {
  const { username } = req.params;
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const cursor = req.query.cursor;

  // 🔴 GUARD: never assume req.userId exists
  if (!req.userId) {
    throw new ExpressError(401, "Unauthorized");
  }

  const currentUserId = req.userId;

  const user = await User.findOne({ username }).select("_id");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const query = {
    followers: user._id,
  };

  if (cursor) {
    query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
  }

  const following = await User.find(query)
    .select("username name avatar")
    .sort({ _id: -1 })
    .limit(limit + 1);

  const hasNextPage = following.length > limit;
  if (hasNextPage) following.pop();

  let followingSet = new Set();

  if (currentUserId) {
    const me = await User.findById(currentUserId).select("following");
    followingSet = new Set(me.following.map((id) => id.toString()));
  }

  const users = following.map((u) => ({
    _id: u._id,
    username: u.username,
    name: u.name,
    avatar: u.avatar,
    isFollowing: followingSet.has(u._id.toString()),
  }));

  const nextCursor = users.length > 0 ? users[users.length - 1]._id : null;

  res.status(200).json({
    users,
    nextCursor,
    hasNextPage,
  });
};
