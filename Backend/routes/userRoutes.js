import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import { isLoggedIn } from "../middleware/isLoggedIn.js";
import User from "../models/User.js";
import ExpressError from "../utils/ExpressError.js";

const router = express.Router();

router.get(
  "/me",
  isLoggedIn,
  wrapAsync(async (req, res) => {
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

export default router;
