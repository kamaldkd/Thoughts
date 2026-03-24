import jwt from "jsonwebtoken";

export const authOptional = (req, _res, next) => {
  const token = req.cookies.accessToken;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
  } catch (err) {
    // ignore invalid token
  }

  next();
};
