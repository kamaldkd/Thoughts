import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import {
  register,
  login,
  logout,
  refresh,
  oauthCallback,
} from "../controllers/authController.js";
import { validateUser, validateLogin } from "../middleware/validate.js";
import passport from "passport";

const router = express.Router();

router.post("/register", validateUser, wrapAsync(register));

router.post("/login", validateLogin, wrapAsync(login));

router.post("/refresh", wrapAsync(refresh));

router.post("/logout", wrapAsync(logout));

// OAuth: Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  wrapAsync(oauthCallback)
);

export default router;
