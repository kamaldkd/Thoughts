import logger from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Log all errors
  logger.error(`[${req.method}] ${req.originalUrl} - ${statusCode} - ${message}`);
  if (err.stack) logger.error(err.stack);

  if (err.code === "EBADCSRFTOKEN") {
    statusCode = 403;
    message = "Invalid CSRF Token";
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    message = `Resource not found`;
    statusCode = 404;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    message = "Duplicate field value entered";
    statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    message = Object.values(err.errors).map((val) => val.message).join(", ");
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
