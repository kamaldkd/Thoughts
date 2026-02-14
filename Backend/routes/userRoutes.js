import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import { isLoggedIn } from "../middleware/isLoggedIn.js";
import User from "../models/User.js";
import ExpressError from "../utils/ExpressError.js";
import { getThoughtsByUserId } from "../controllers/thoughtController.js";

const router = express.Router();

router.get(
  "/me",
  isLoggedIn,
  wrapAsync(async (req, res) => {
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
  })
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

export default router;
