import jwt from "jsonwebtoken";

export const authOptional = (req, _res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId };
  } catch (err) {
    // ignore invalid token
  }

  next();
};
