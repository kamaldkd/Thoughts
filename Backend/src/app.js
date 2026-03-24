import express from "express";
import { errorHandler } from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import likeRoutes from "./routes/likeRoutes.js";
import thoughtRoutes from "./routes/thoughtRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import cors from "cors";
import passport from "passport";
import setupPassport from "./config/passport.js";
import cookieParser from "cookie-parser";
import { csrfProtection } from "./middleware/csrfProtection.js";
import { xssSanitize, dbSanitize } from "./middleware/sanitize.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();

app.use(cors({
  origin: ["http://localhost:8080", "http://192.168.56.1:8080", "https://thoughts-social.vercel.app"],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Global execution sanitizer explicitly strips NoSQL operators and cleans HTML elements natively
app.use(xssSanitize);
app.use(dbSanitize);

// Apply Helmet for strict security headers
// Configure helmet to securely handle cross-domain images/scripts if necessary, falling back to defaults
app.use(helmet());

// Passport (OAuth) initialization
setupPassport(passport);
app.use(passport.initialize());

// Enable strict CSRF for ALL state-changing routes (including login)
app.use("/api", csrfProtection);

app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Configure Rate Limiting specifically for Auth routes to block brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  keyGenerator: (req) => req.ip || 'unknown',
  message: { success: false, message: "Too many authentication attempts, please try again later" }
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/thoughts", thoughtRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
  res.send("Thoughts API is running");
});

app.use(errorHandler);

export default app;
