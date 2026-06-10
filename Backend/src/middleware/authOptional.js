import jwt from "jsonwebtoken";

export const authOptional = (req, _res, next) => {
  // Check Authorization: Bearer header first, then cookie
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else {
    token = req.cookies?.accessToken || null;
  }

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
  } catch (err) {
    // ignore invalid token
  }

  next();
};
