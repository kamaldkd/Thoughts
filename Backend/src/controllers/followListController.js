import mongoose from "mongoose";
import User from "../models/User.js";
import Follow from "../models/Follow.js";

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

  const follows = await Follow.find(query)
    .populate("follower", "username name avatar")
    .sort({ _id: -1 })
    .limit(limit + 1);

  const hasNextPage = follows.length > limit;
  if (hasNextPage) follows.pop();

  const followers = follows.map((f) => f.follower).filter(Boolean);

  let followingSet = new Set();

  if (currentUserId && followers.length > 0) {
    const myFollows = await Follow.find({
      follower: currentUserId,
      following: { $in: followers.map(u => u._id) }
    });
    followingSet = new Set(myFollows.map((f) => f.following.toString()));
  }

  const users = follows.map((f) => {
    const u = f.follower;
    return {
      _id: u._id,
      username: u.username,
      name: u.name,
      avatar: u.avatar,
      isFollowing: followingSet.has(u._id.toString()),
      followId: f._id, // use Follow doc ID as cursor
    };
  }).filter((u) => u._id);

  const nextCursor = users.length > 0 ? users[users.length - 1].followId : null;

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
    follower: user._id,
  };

  if (cursor) {
    query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
  }

  const follows = await Follow.find(query)
    .populate("following", "username name avatar")
    .sort({ _id: -1 })
    .limit(limit + 1);

  const hasNextPage = follows.length > limit;
  if (hasNextPage) follows.pop();

  const followingUsers = follows.map((f) => f.following).filter(Boolean);

  let followingSet = new Set();

  if (currentUserId && followingUsers.length > 0) {
    const myFollows = await Follow.find({
      follower: currentUserId,
      following: { $in: followingUsers.map(u => u._id) }
    });
    followingSet = new Set(myFollows.map((f) => f.following.toString()));
  }

  const users = follows.map((f) => {
    const u = f.following;
    return {
      _id: u._id,
      username: u.username,
      name: u.name,
      avatar: u.avatar,
      isFollowing: followingSet.has(u._id.toString()),
      followId: f._id, // use Follow doc ID as cursor
    };
  }).filter((u) => u._id);

  const nextCursor = users.length > 0 ? users[users.length - 1].followId : null;

  res.status(200).json({
    users,
    nextCursor,
    hasNextPage,
  });
};
