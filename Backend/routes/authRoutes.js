import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import {
  register,
  login,
  oauthCallback,
} from "../controllers/authController.js";
import { validateUser, validateLogin } from "../middleware/validate.js";
import passport from "passport";

const router = express.Router();

router.post("/register", validateUser, wrapAsync(register));

router.post("/login", validateLogin, wrapAsync(login));

router.post("/logout", (req, res) => {
  // POST because logout is an action that changes the authentication staterrrrrrrrrr
  res.json({
    success: true,
    message: "Logged out successfully",
  });

  // Frontend usage :

  // await fetch("/api/auth/logout", { method: "POST" });
  // localStorage.removeItem("token");

  // what about if token expired ?
  // if(res.status === 401) {
  //   localStorage.removeItem("token");
  //   // redirect to login
  // }
});

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
