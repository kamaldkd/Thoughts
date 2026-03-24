import jwt from "jsonwebtoken";
import ExpressError from "../utils/ExpressError.js";

export const isLoggedIn = (req, res, next) => {
  const token = req.cookies.accessToken;

  // no token sent
  if (!token) {
    throw new ExpressError(401, "You must be logged in");
  }

  try {
    // verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // save user id for next middlewares/ controllers
    req.userId = decoded.userId;

    next(); // user is valid, continue
  } catch (err) {
    //token invalid or expired
    throw new ExpressError(401, "Invalid or expired token");
  }
};

