import User from "../models/User.js";

export const updateProfile = async (req, res) => {
  const userId = req.userId;

  const allowedUpdates = [
    "name",
    "username",
    "bio",
    "avatar",
    "website",
    "socialLinks",
  ];

  const updates = {};
  for (const key of allowedUpdates) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  const currUser = await User.findById(userId); // ensure user exists, otherwise findByIdAndUpdate would return null

  // username uniqueness check
  if (updates.username) {
    if (currUser.username !== updates.username) {
      const exists = await User.exists({
        username: updates.username,
        _id: { $ne: userId },
      });
    }
    if (exists) {
      return res.status(400).json({ message: "Username already taken" });
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true, runValidators: true }
  ).select("-password");

  res.status(200).json(updatedUser);
};

export const getMe = async (req, res) => {
  // 🔴 GUARD: never assume req.userId exists
  if (!req.userId) {
    throw new ExpressError(401, "Unauthorized");
  }
  const user = await User.findById(req.userId).select("-password");
  if (!user) {
    throw new ExpressError(404, "User not found");
  }

  res.json({
    success: true,
    user,
  });
};

export const getUserByUsername = async (req, res) => {
  const { username } = req.params;

  // 🔴 GUARD: never assume req.userId exists
  if (!req.userId) {
    throw new ExpressError(401, "Unauthorized");
  }

  const currentUserId = req.userId; // optional (public profile)

  const user = await User.findOne({ username }).select(
    "username name bio avatar website socialLinks followersCount followingCount thoughtsCount createdAt"
  );

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  let isFollowing = false;

  if (currentUserId) {
    const me = await User.exists({
      _id: currentUserId,
      following: user._id,
    });
    isFollowing = Boolean(me);
  }

  res.status(200).json({
    ...user.toObject(),
    isFollowing,
  });
};
