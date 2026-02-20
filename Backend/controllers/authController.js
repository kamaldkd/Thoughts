import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import ExpressError from "../utils/ExpressError.js";

// reading content is at last

export const register = async (req, res) => {
  const { name, username, email, password } = req.body;

  // check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ExpressError(400, "User already registered");
  }

  // hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // create user
  const user = await User.create({
    name,
    username,
    email,
    password: hashedPassword,
  });

  // auto-login after register
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  // save user id for next middlewares/ controllers
  req.userId = user._id;

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    token,
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    throw new ExpressError(
      400,
      "Request body missing email or password. Send JSON with `email` and `password`."
    );
  }

  // 1. check if user exists
  const user = await User.findOne({ email }).select("+password");;
  if (!user) {
    throw new ExpressError(400, "Invalid email or password");
  }

  // 2. compare passwords
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ExpressError(400, "Invalid email or password");
  }

  // 3. generate token
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  // save user id for next middlewares/ controllers
  req.userId = user._id;

  // 4. send response
  res.json({
    success: true,
    message: "Login successful",
    token,
  });
};

export const oauthCallback = async (req, res) => {
  // `req.user` is set by passport in the Google strategy
  const user = req.user;
  if (!user) {
    return res.status(400).json({ success: false, message: "OAuth failed" });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  // Redirect to frontend with token. Frontend should read token and store it.
  const redirectBase =
    process.env.OAUTH_SUCCESS_REDIRECT ||
    process.env.FRONTEND_URL ||
    "http://localhost:5173";
  const redirectUrl = `${redirectBase}?token=${token}`;
  res.redirect(redirectUrl);
};

// What will happen on client side :-

// after login or register, cliet received a token.
// Store it (for example):

// localStorage.setItem("token", token);

// When calling protected routes:

// fetch("/api/users/me", {
// headers: {
//    Authorization: "Bearer " + localStorage.getItem("token")
// }
// })

// read middleware/isLoggedIn.js file to see how this works


