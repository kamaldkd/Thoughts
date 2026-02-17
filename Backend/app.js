import express from "express";
import User from "./models/User.js";
import { errorHandler } from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import likeRoutes from "./routes/likeRoutes.js";
import thoughtRoutes from "./routes/thoughtRoutes.js";
import cors from "cors";
import passport from "passport";
import setupPassport from "./config/passport.js";

const app = express();

app.use(cors({
  origin: ["http://localhost:8080", "http://192.168.56.1:8080", "https://thoughts-social.vercel.app"],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport (OAuth) initialization
setupPassport(passport);
app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/thoughts", thoughtRoutes);
app.use("/api/likes", likeRoutes);

app.get("/", (req, res) => {
  res.send("Thoughts API is running");
});

app.use(errorHandler);

export default app;
