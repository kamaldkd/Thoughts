import User from "../models/User.js";

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
