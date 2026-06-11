import { registerUser, loginUser, oauthLogin, rotateRefreshTokens } from "../services/AuthService.js";
import { deleteToken } from "../repositories/TokenRepository.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import ExpressError from "../utils/ExpressError.js";

// Detect production environment reliably.
// Render.com automatically injects RENDER=true into every deployment — no manual config needed.
// We intentionally do NOT use !!process.env.FRONTEND_URL here because that env var is also
// present in the local .env file for OAuth redirects, which would make isProduction=true
// in local development and cause cookies to require HTTPS (secure:true), silently dropping
// them over HTTP. RENDER=true and NODE_ENV=production are deployment-only signals.
const isProduction = process.env.RENDER === "true" || process.env.NODE_ENV === "production";

const getCookieOptions = (maxAge = null) => {
  const options = {
    httpOnly: true,
    secure: isProduction,           // HTTPS only in production
    sameSite: isProduction ? "none" : "lax",  // 'none' required for cross-domain (Vercel <-> Render)
  };
  if (maxAge) options.maxAge = maxAge;
  return options;
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, getCookieOptions(15 * 60 * 1000));
  res.cookie("refreshToken", refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));
  // NOTE: Do NOT clear the _csrf cookie here. Clearing it on login/register creates a
  // race condition where CSRF-protected requests can fire before the frontend fetches a new
  // CSRF token, producing spurious 403 errors. The CSRF token lifecycle is managed
  // independently by the frontend's fetchCsrfToken() call after auth actions.
};

export const register = async (req, res) => {
  const { name, username, email, password } = req.body;
  
  const { user, accessToken, refreshToken } = await registerUser({ name, username, email, password });

  req.userId = user._id;
  setAuthCookies(res, accessToken, refreshToken);

  // Also return accessToken in body — frontend stores in memory and sends as
  // Authorization: Bearer header. This bypasses ALL cookie issues on mobile browsers.
  res.status(201).json({ success: true, message: "User registered successfully", accessToken });
};

export const login = async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    throw new ExpressError(400, "Request body missing email or password");
  }

  const { user, accessToken, refreshToken } = await loginUser({ email, password });

  req.userId = user._id;
  setAuthCookies(res, accessToken, refreshToken);

  // Also return accessToken in body — frontend stores in memory and sends as
  // Authorization: Bearer header. This bypasses ALL cookie issues on mobile browsers.
  res.json({ success: true, message: "Login successful", accessToken });
};

export const oauthCallback = async (req, res) => {
  const user = req.user;
  const frontendUrl = process.env.OAUTH_SUCCESS_REDIRECT || process.env.FRONTEND_URL || "http://localhost:8080";

  if (!user) {
    return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }

  const { accessToken, refreshToken } = await oauthLogin(user);

  // Set refreshToken as HttpOnly cookie for silent token refresh later.
  // We do NOT rely on the accessToken cookie for the initial OAuth redirect because
  // this callback runs on the Render domain (thoughts-5bxn.onrender.com) and the
  // browser is about to navigate to the Vercel domain (thoughts-social.vercel.app).
  // Cross-domain Set-Cookie headers are silently dropped in this redirect flow —
  // the cookie is scoped to .onrender.com but the destination is .vercel.app.
  // Fix: pass the accessToken as a short-lived URL query param. The frontend
  // /auth/callback page extracts it immediately, stores it in memory, then
  // replaces the URL so the token never stays visible in the address bar.
  res.cookie("refreshToken", refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

  res.redirect(`${frontendUrl}/auth/callback?token=${encodeURIComponent(accessToken)}`);
};

export const logout = async (req, res) => {
  const { refreshToken } = req.cookies;
  
  if (refreshToken) {
    await deleteToken(refreshToken);
  }

  // Clear auth cookies using the same security attributes they were set with.
  // Mismatched attributes (e.g., different sameSite/secure) cause browsers to ignore clearCookie.
  res.cookie("accessToken", "", getCookieOptions(0));
  res.cookie("refreshToken", "", getCookieOptions(0));
  
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
    // Return new accessToken in body so frontend can update its in-memory token.
    res.json({ success: true, message: "Token refreshed", accessToken: newAccess });
  } catch (error) {
    // On failure, clear auth cookies so the browser doesn't keep sending an invalid refreshToken.
    res.cookie("accessToken", "", getCookieOptions(0));
    res.cookie("refreshToken", "", getCookieOptions(0));
    throw error;
  }
};