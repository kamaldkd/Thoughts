import { findUserById, checkUsernameExists, updateUser } from "../repositories/UserRepository.js";
import Follow from "../models/Follow.js";
import { cloudinary } from "../config/cloudinary.js";
import fs from "fs";
import ExpressError from "../utils/ExpressError.js";

export const getMyProfile = async (userId) => {
  if (!userId) throw new ExpressError(401, "Unauthorized");
  
  const user = await findUserById(userId);
  if (!user) throw new ExpressError(404, "User not found");
  
  return user;
};

export const getProfileByUsername = async (username, currentUserId) => {
  const { findUserByUsername } = await import("../repositories/UserRepository.js");
  const user = await findUserByUsername(username);

  if (!user) throw new ExpressError(404, "User not found");

  let isFollowing = false;
  let isOwnProfile = false;

  if (currentUserId) {
    isOwnProfile = user._id.toString() === currentUserId;
    const me = await Follow.exists({
      follower: currentUserId,
      following: user._id,
    });
    isFollowing = Boolean(me);
  }

  return {
    _id: user._id,
    username: user.username,
    name: user.name,
    bio: user.bio,
    avatar: user.avatar,
    website: user.website,
    socialLinks: user.socialLinks,
    createdAt: user.createdAt,
    thoughtsCount: user.thoughtsCount || 0,
    followersCount: user.followersCount || 0,
    followingCount: user.followingCount || 0,
    isPrivate: user.isPrivate || false,
    isOwnProfile,
    isFollowing,
  };
};

export const updateProfileData = async (userId, body, file) => {
  const allowedUpdates = ["name", "username", "bio", "website", "socialLinks"];
  const updates = {};

  for (const key of allowedUpdates) {
    if (body[key] !== undefined) {
      if (key === "socialLinks") {
          updates[key] = typeof body[key] === "string" ? JSON.parse(body[key]) : body[key];
      } else {
          updates[key] = body[key];
      }
    }
  }

  const currUser = await findUserById(userId, false);
  if (!currUser) throw new ExpressError(404, "User not found");

  if (updates.username && currUser.username !== updates.username) {
    const exists = await checkUsernameExists(updates.username, userId);
    if (exists) throw new ExpressError(400, "Username already taken");
  }

  if (file) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "avatars",
        resource_type: "auto",
        allowed_formats: ["jpg", "png", "jpeg"],
      });
      fs.unlinkSync(file.path);
      updates.avatar = result.secure_url;
    } catch (error) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw new ExpressError(400, `Failed to upload ${file.originalname}: ${error.message}`);
    }
  }

  const updatedUser = await updateUser(userId, updates);
  return updatedUser;
};

export const searchUsersService = async (query, limit = 10) => {
  const { searchUsersQuery } = await import("../repositories/UserRepository.js");
  return await searchUsersQuery(query, limit);
};
