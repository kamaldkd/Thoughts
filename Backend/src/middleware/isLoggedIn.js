import jwt from "jsonwebtoken";
import ExpressError from "../utils/ExpressError.js";

export const isLoggedIn = (req, res, next) => {
  // Check Authorization: Bearer <token> header first (primary — works on all browsers/devices).
  // Fall back to httpOnly cookie (secondary — may be blocked by mobile browsers cross-domain).
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else {
    token = req.cookies?.accessToken || null;
  }

  if (!token) {
    throw new ExpressError(401, "You must be logged in");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    throw new ExpressError(401, "Invalid or expired token");
  }
};

