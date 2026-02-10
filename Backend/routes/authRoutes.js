import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import { register, login } from "../controllers/authController.js";
import { validateUser, validateLogin } from "../middleware/validate.js";

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

export default router;
