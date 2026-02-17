import express from "express";
import { toggleLike, likeStatus } from "../controllers/likeController.js";
import {isLoggedIn} from "../middleware/isLoggedIn.js";

const router = express.Router();

router.post("/toggle/:thoughtId", isLoggedIn, toggleLike);
router.get("/status/:thoughtId", isLoggedIn, likeStatus);

export default router;