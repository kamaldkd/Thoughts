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

// CSRF-token bootstrap endpoint — issues the cookie+token pair.
// Applied individually so /api/csrf-token isn't caught by the broader middleware below.
app.get("/api/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// ─────────────────────────────────────────────────────────────────────────────
// CSRF STRATEGY FOR CROSS-DOMAIN PRODUCTION (Vercel frontend ↔ Render backend)
// ─────────────────────────────────────────────────────────────────────────────
// Auth routes (login, register, logout, refresh, google) are intentionally
// EXEMPT from CSRF for the following reasons:
//  1. login/register — these are PUBLIC endpoints. There is no authenticated
//     session to hijack via CSRF; the worst an attacker can do is log someone
//     in, which is not a threat (they'd need the victim's credentials anyway).
//  2. logout/refresh — these are protected by HttpOnly cookie possession, which
//     a cross-origin attacker cannot read. Cookie theft ≠ CSRF scope.
//  3. google/callback — server-side OAuth redirect; no AJAX call is made.
//  4. Cross-domain SameSite reality: the _csrf cookie requires SameSite=None
//     which modern browsers only allow for explicitly cross-site requests when
//     the user's browser hasn't blocked third-party cookies, making cookie-based
//     CSRF unreliable for public auth flows in a split-domain deployment.
//
// CSRF IS enforced on all authenticated routes: thoughts, users (profile edits),
// likes, comments, conversations, messages — where a real session token exists.
const CSRF_EXEMPT = [
  "/auth/login",
  "/auth/register",
  "/auth/logout",
  "/auth/refresh",
  "/auth/google",
];
app.use("/api", (req, res, next) => {
  const isExempt = CSRF_EXEMPT.some(p => req.path === p || req.path.startsWith(p + "/"));
  if (isExempt) return next();
  return csrfProtection(req, res, next);
});

// Configure Rate Limiting specifically for Auth routes to block brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  validate: { xForwardedForHeader: false, default: false },
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
