import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import {
  createThought,
  getThoughts,
  getThoughtById,
  updateThought,
  deleteThought,
  getThoughtsOfUser,
} from "../controllers/thoughtController.js";
import {
  getThoughtComments,
  createComment,
  replyToComment,
} from "../controllers/commentController.js";
import { isLoggedIn } from "../middleware/isLoggedIn.js";
import { isAuthor } from "../middleware/isAuthor.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// debug route removed

router
  .route("/")
  .post(isLoggedIn, upload.array("file", 10), wrapAsync(createThought))
  .get(isLoggedIn, wrapAsync(getThoughts));

router.route("/me").get(isLoggedIn, wrapAsync(getThoughtsOfUser));

router
  .route("/:id")
  .get(isLoggedIn, wrapAsync(getThoughtById))
  .put(isLoggedIn, isAuthor, wrapAsync(updateThought))
  .delete(isLoggedIn, isAuthor, wrapAsync(deleteThought));

// Comment sub-routes
router.get("/:id/comments", isLoggedIn, wrapAsync(getThoughtComments));
router.post("/:id/comments", isLoggedIn, wrapAsync(createComment));
router.post("/:id/comments/:commentId/reply", isLoggedIn, wrapAsync(replyToComment));

export default router;
