import { getMyProfile, getProfileByUsername, updateProfileData } from "../services/UserService.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const updateProfile = async (req, res) => {
  const updatedUser = await updateProfileData(req.userId, req.body, req.file);
  res.status(200).json(updatedUser);
};

export const getMe = async (req, res) => {
  const user = await getMyProfile(req.userId);
  res.json({ success: true, user });
};

export const getUserByUsername = async (req, res) => {
  const { username } = req.params;
  const currentUserId = req.userId; // Optional, handled by middleware
  
  const userProfile = await getProfileByUsername(username, currentUserId);
  res.status(200).json(userProfile);
};