import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import { toggleLikeHandler, likeStatus } from "../controllers/likeController.js";
import { isLoggedIn } from "../middleware/isLoggedIn.js";

const router = express.Router();

router.post("/toggle/:thoughtId", isLoggedIn, wrapAsync(toggleLikeHandler));
router.get("/status/:thoughtId", isLoggedIn, wrapAsync(likeStatus));

export default router;