import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { findUserByEmail, createUser } from "../repositories/UserRepository.js";
import { createRefreshToken, findToken, deleteTokenByDoc } from "../repositories/TokenRepository.js";
import ExpressError from "../utils/ExpressError.js";

export const generateAndStoreRefreshToken = async (userId) => {
  const token = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await createRefreshToken(token, userId, expiresAt);
  return token;
};

export const registerUser = async ({ name, username, email, password }) => {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new ExpressError(400, "User already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await createUser({
    name,
    username,
    email,
    password: hashedPassword,
  });

  const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = await generateAndStoreRefreshToken(user._id);

  return { user, accessToken, refreshToken };
};

export const loginUser = async ({ email, password }) => {
  const user = await findUserByEmail(email, true);
  if (!user) {
    throw new ExpressError(400, "Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ExpressError(400, "Invalid email or password");
  }

  const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = await generateAndStoreRefreshToken(user._id);

  return { user, accessToken, refreshToken };
};

export const oauthLogin = async (user) => {
  const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = await generateAndStoreRefreshToken(user._id);
  return { accessToken, refreshToken };
};

export const rotateRefreshTokens = async (refreshTokenInput) => {
  const tokenDoc = await findToken(refreshTokenInput);
  
  if (!tokenDoc || new Date(tokenDoc.expiresAt) < new Date()) {
    if (tokenDoc) await deleteTokenByDoc(tokenDoc);
    throw new ExpressError(401, "Session expired or invalid");
  }

  const userId = tokenDoc.user;
  await deleteTokenByDoc(tokenDoc);
  
  const newAccessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15m" });
  const newRefreshToken = await generateAndStoreRefreshToken(userId);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};
