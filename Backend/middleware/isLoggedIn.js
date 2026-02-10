import jwt from "jsonwebtoken";
import ExpressError from "../utils/ExpressError.js";

export const isLoggedIn = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // no token sent
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ExpressError(401, "You must be logged in");
  }

  // extract token
  const token = authHeader.split(" ")[1];

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
