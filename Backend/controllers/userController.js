import User from "../models/User.js";

import { cloudinary } from "../config/cloudinary.js";

export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const allowedUpdates = [
      "name",
      "username",
      "bio",
      "website",
      "socialLinks",
    ];

    const updates = {};

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const currUser = await User.findById(userId);

    if (!currUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Username uniqueness check
    if (updates.username && currUser.username !== updates.username) {
      const exists = await User.exists({
        username: updates.username,
        _id: { $ne: userId },
      });

      if (exists) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    const file = req.file;
    // Avatar upload (if using multer)
    if (file) {
      try {
        const isImage = req.file.mimetype.startsWith("image/");

        // Upload buffer directly to Cloudinary
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "avatars",
              resource_type: "auto",
              allowed_formats: ["jpg", "png", "jpeg"],
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );

          uploadStream.end(file.buffer);
        });
        updates.avatar = result.secure_url;
      } catch (error) {
        console.error("Upload error for:", file.originalname, error.message);
        return res.status(400).json({
          message: `Failed to upload ${file.originalname}: ${error.message}`,
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
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
  try {
    const { username } = req.params;
    const currentUserId = req.userId; // optional

    const user = await User.findOne({
      username: new RegExp(`^${username}$`, "i"),
    }).select(
      "username name bio avatar website socialLinks followers following thoughtsCount createdAt isPrivate"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let isFollowing = false;
    let isOwnProfile = false;

    if (currentUserId) {
      isOwnProfile = user._id.toString() === currentUserId;

      const me = await User.exists({
        _id: currentUserId,
        following: user._id,
      });

      isFollowing = Boolean(me);
    }

    res.status(200).json({
      _id: user._id,
      username: user.username,
      name: user.name,
      bio: user.bio,
      avatar: user.avatar,
      website: user.website,
      socialLinks: user.socialLinks,
      createdAt: user.createdAt,
      thoughtsCount: user.thoughtsCount || 0,
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
      isPrivate: user.isPrivate || false,
      isOwnProfile,
      isFollowing,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};