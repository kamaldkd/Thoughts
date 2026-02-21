import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import { isLoggedIn } from "../middleware/isLoggedIn.js";
import User from "../models/User.js";
import ExpressError from "../utils/ExpressError.js";
import { getThoughtsByUserId, getUserThoughts } from "../controllers/thoughtController.js";
import {
  followUser,
  unfollowUser,
  isFollowing,
} from "../controllers/followController.js";
import { updateProfile, getMe, getUserByUsername} from "../controllers/userController.js";
import { getFollowers, getFollowing } from "../controllers/followListController.js";
import { authOptional } from "../middleware/authOptional.js";
import upload from "../middleware/upload.js";

const router = express.Router();
// 1️⃣ Static routes first
router.get("/me", isLoggedIn, wrapAsync(getMe));
router.patch("/me", isLoggedIn, upload.single("avatar"), wrapAsync(updateProfile));

// 2️⃣ Specific username routes
router.get("/username/:username", wrapAsync(getUserByUsername));
router.get("/username/:username/thoughts", wrapAsync(getUserThoughts));
router.get("/username/:username/followers", authOptional, wrapAsync(getFollowers));
router.get("/username/:username/following", authOptional, wrapAsync(getFollowing));

// 3️⃣ Thought routes by userId
router.route("/:userId/thoughts")
  .get(isLoggedIn, wrapAsync(getThoughtsByUserId));

// 4️⃣ Follow routes (ID based)
router.post("/:id/follow", isLoggedIn, wrapAsync(followUser));
router.post("/:id/unfollow", isLoggedIn, wrapAsync(unfollowUser));
router.get("/:id/is-following", isLoggedIn, wrapAsync(isFollowing));

// 5️⃣ Generic ID route LAST
router.get(
  "/:id",
  isLoggedIn,
  wrapAsync(async (req, res) => {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      throw new ExpressError(404, "User not found");
    }
    res.json({
      success: true,
      user,
    });
  })
);
export default router;
