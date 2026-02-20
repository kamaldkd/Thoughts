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

router.get(
  "/me",
  isLoggedIn,
  wrapAsync(getMe)
);

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

router
  .route("/:userId/thoughts")
  .get(isLoggedIn, wrapAsync(getThoughtsByUserId));

router.post("/:id/follow", isLoggedIn, wrapAsync(followUser));
router.post("/:id/unfollow", isLoggedIn, wrapAsync(unfollowUser));
router.get("/:id/is-following", isLoggedIn, wrapAsync(isFollowing));
router.get("/me", isLoggedIn, wrapAsync(getMe));
router.patch("/me", isLoggedIn, upload.single("avatar"), wrapAsync(updateProfile));
router.get("/:username", authOptional, wrapAsync(getUserByUsername));
router.get("/:username/followers", authOptional, wrapAsync(getFollowers));
router.get("/:username/following", authOptional, wrapAsync(getFollowing));
router.get("/users/:username/thoughts", getUserThoughts);

export default router;
