import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import { isLoggedIn } from "../middleware/isLoggedIn.js";
import upload from "../middleware/upload.js";
import {
  createStory,
  deleteStory,
  getStories,
  viewStory,
} from "../controllers/storyController.js";

const router = express.Router();

router.use(isLoggedIn);
router.get("/", wrapAsync(getStories));
router.post("/", upload.single("media"), wrapAsync(createStory));
router.post("/:storyId/view", wrapAsync(viewStory));
router.delete("/:storyId", wrapAsync(deleteStory));

export default router;
