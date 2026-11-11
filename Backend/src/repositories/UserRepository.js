import User from "../models/User.js";
import Follow from "../models/Follow.js";

export const findUserByEmail = async (email, includePassword = false) => {
  let query = User.findOne({ email });
  if (includePassword) query = query.select("+password");
  return await query;
};

export const findUserByUsername = async (username) => {
  return await User.findOne({ username: username.toLowerCase() });
};

export const findUserById = async (id, excludePassword = true) => {
  let query = User.findById(id);
  if (excludePassword) query = query.select("-password");
  return await query;
};

export const createUser = async (userData) => {
  return await User.create(userData);
};

export const checkUsernameExists = async (username, excludeUserId) => {
  return await User.exists({
    username,
    _id: { $ne: excludeUserId },
  });
};

export const updateUser = async (userId, updates) => {
  return await User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true, runValidators: true }
  ).select("-password");
};

export const searchUsersQuery = async (query, currentUserId, limit = 10) => {
  const searchTerm = query?.trim().toLowerCase();

  if (!searchTerm || searchTerm.length < 2) {
    return [];
  }

  // Escape special regex characters to prevent regex injection
  const escapedQuery = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const users = await User.find({
    ...(currentUserId ? { _id: { $ne: currentUserId } } : {}),

    $or: [
      { username: { $regex: escapedQuery, $options: "i" } },
      { name: { $regex: escapedQuery, $options: "i" } },
    ],
  })
    .select("username name avatar isPrivate _id")
    .sort({ username: 1, _id: 1 })
    .limit(limit)
    .lean();

  // Guests can search, but cannot have a follow status.
  if (!currentUserId || users.length === 0) {
    return users.map((user) => ({
      ...user,
      isFollowing: false,
    }));
  }

  // Fetch all follow relationships in ONE query.
  const userIds = users.map((user) => user._id);

  const following = await Follow.find({
    follower: currentUserId,
    following: { $in: userIds },
  })
    .select("following")
    .lean();

  const followingIds = new Set(
    following.map((item) => item.following.toString())
  );

  return users.map((user) => ({
    ...user,
    isFollowing: followingIds.has(user._id.toString()),
  }));
};
