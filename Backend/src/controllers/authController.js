import { registerUser, loginUser, oauthLogin, rotateRefreshTokens } from "../services/AuthService.js";
import { deleteToken } from "../repositories/TokenRepository.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import ExpressError from "../utils/ExpressError.js";

const getCookieOptions = (maxAge = null) => {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };
  if (maxAge) options.maxAge = maxAge;
  return options;
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, getCookieOptions(15 * 60 * 1000));
  res.cookie("refreshToken", refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));
  res.clearCookie("_csrf", getCookieOptions());
};

export const register = async (req, res) => {
  const { name, username, email, password } = req.body;
  
  const { user, accessToken, refreshToken } = await registerUser({ name, username, email, password });

  req.userId = user._id;
  setAuthCookies(res, accessToken, refreshToken);

  res.status(201).json({ success: true, message: "User registered successfully" });
};

export const login = async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    throw new ExpressError(400, "Request body missing email or password");
  }

  const { user, accessToken, refreshToken } = await loginUser({ email, password });

  req.userId = user._id;
  setAuthCookies(res, accessToken, refreshToken);

  res.json({ success: true, message: "Login successful" });
};

export const oauthCallback = async (req, res) => {
  const user = req.user;
  if (!user) {
    return res.status(400).json({ success: false, message: "OAuth failed" });
  }

  const { accessToken, refreshToken } = await oauthLogin(user);

  setAuthCookies(res, accessToken, refreshToken);

  const redirectUrl = process.env.OAUTH_SUCCESS_REDIRECT || process.env.FRONTEND_URL || "http://localhost:8080";
  res.redirect(`${redirectUrl}/feed`);
};

export const logout = async (req, res) => {
  const { refreshToken } = req.cookies;
  
  if (refreshToken) {
    await deleteToken(refreshToken);
  }

  res.cookie("accessToken", "", getCookieOptions(0));
  res.cookie("refreshToken", "", getCookieOptions(0));
  res.clearCookie("_csrf", getCookieOptions());
  
  res.json({ success: true, message: "Logged out successfully" });
};

export const refresh = async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token provided" });
  }

  try {
    const { accessToken: newAccess, refreshToken: newRefresh } = await rotateRefreshTokens(refreshToken);
    setAuthCookies(res, newAccess, newRefresh);
    res.json({ success: true, message: "Token refreshed" });
  } catch (error) {
    res.cookie("accessToken", "", getCookieOptions(0));
    res.cookie("refreshToken", "", getCookieOptions(0));
    res.clearCookie("_csrf", getCookieOptions());
    throw error;
  }
};
