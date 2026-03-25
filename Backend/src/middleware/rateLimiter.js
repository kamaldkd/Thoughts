import rateLimit from "express-rate-limit";
import { createClient } from "redis";
import RedisStore from "rate-limit-redis";

// 1. Safe Redis Distributed Cache Initialization (Graceful Fallback strictly to MemoryStore)
let redisStore = undefined;

if (process.env.REDIS_URL) {
  try {
    const redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.connect().catch(err => console.error("[Redis] Background Connect Error", err));
    
    redisClient.on("error", (err) => console.error("[Redis] Client Error", err));
    redisClient.on("ready", () => console.info("[Redis] Connected successfully for Distributed Rate Limiting"));

    redisStore = new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: "rate_limit:", // Distinct namespace collision guard
    });
  } catch (error) {
    console.warn("[Redis] Initialization failed, falling back natively to MemoryStore.");
  }
}

// 2. Custom Unified Response Handler (Enhances UX Payload)
const customHandler = (req, res, next, options) => {
  res.status(options.statusCode).json({
    success: false,
    message: options.message.message,
    retryAfterSeconds: Math.ceil(options.windowMs / 1000), // Gives frontend explicit countdowns
  });
};

const createLimiter = (options) => rateLimit({
  ...options,
  store: redisStore, // Native fallback to MemoryStore if undefined
  handler: customHandler,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers native to modern UX
  legacyHeaders: false, 
  validate: { xForwardedForHeader: false, default: false },
  keyGenerator: options.keyGenerator || ((req) => {
    // Provide a default custom key generator to bypass ERR_ERL_KEY_GEN_IPV6 console errors
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    return req.userId ? `user:${req.userId}` : `ip:${ip}`;
  }),
});

/* ─────────────────────────────────────────────
   FOLLOW ENDPOINT LIMITERS
───────────────────────────────────────────── */

export const burstFollowLimiter = createLimiter({
  windowMs: 10 * 1000, // 10 seconds
  max: 5, // Extremely strict micro-burst limit
  message: { message: "Too many actions too quickly. Please slow down your following." },
});

export const userFollowLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Max 30 follows per hour-quarter
  keyGenerator: (req) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    return req.userId ? `user_follow:${req.userId}` : `ip_follow:${ip}`;
  },
  message: { message: "You have reached your Follow limit. Please wait 15 minutes to prevent spam." },
});

export const ipFollowLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, 
  max: 50, // IP limit is slightly higher to account for NATs/Cafes, but entirely blocks Botnets
  keyGenerator: (req) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    return `ip_follow_block:${ip}`;
  },
  message: { message: "Too many follow requests from this IP Network. Please wait 15 minutes." },
});

/* ─────────────────────────────────────────────
   UNFOLLOW ENDPOINT LIMITERS (Usually lower traffic limits)
───────────────────────────────────────────── */

export const burstUnfollowLimiter = createLimiter({
  windowMs: 10 * 1000, 
  max: 10, // Lenient if someone is mass-cleaning their feed
  message: { message: "Too many unfollows too quickly. Please slow down." },
});

export const userUnfollowLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50, // Higher limit for explicitly cleaning social feeds
  keyGenerator: (req) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    return req.userId ? `user_unfollow:${req.userId}` : `ip_unfollow:${ip}`;
  },
  message: { message: "You have reached your Unfollow limit. Please wait 15 minutes." },
});

export const ipUnfollowLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100, 
  keyGenerator: (req) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    return `ip_unfollow_block:${ip}`;
  },
  message: { message: "Network unfollow quota exceeded. Please wait 15 minutes." },
});

/* ─────────────────────────────────────────────
   STRICT PIPELINE ORDERING: BURST -> USER -> IP
   Why? Catch the cheapest micro-spam computations heavily first securely before tracking massive IP blocks.
───────────────────────────────────────────── */
export const followRateLimiters = [burstFollowLimiter, userFollowLimiter, ipFollowLimiter];
export const unfollowRateLimiters = [burstUnfollowLimiter, userUnfollowLimiter, ipUnfollowLimiter];

/* ─────────────────────────────────────────────
   MESSAGE ENDPOINT LIMITERS
   Applied to REST message routes.
   Socket events have their own in-handler guard.
───────────────────────────────────────────── */

export const messageBurstLimiter = createLimiter({
  windowMs: 10 * 1000, // 10 seconds
  max: 10, // Max 10 messages per 10-second burst
  keyGenerator: (req) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    return req.userId ? `msg_burst:${req.userId}` : `ip_msg_burst:${ip}`;
  },
  message: { message: "You are sending messages too quickly. Please slow down." },
});

export const messageUserLimiter = createLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Max 60 messages per minute per user
  keyGenerator: (req) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    return req.userId ? `msg_user:${req.userId}` : `ip_msg_user:${ip}`;
  },
  message: { message: "Message rate limit reached. Please wait before sending more messages." },
});

export const messageLimiters = [messageBurstLimiter, messageUserLimiter];
