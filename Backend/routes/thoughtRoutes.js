import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import multer from "multer";
import { cloudinary } from "../config/cloudinary.js";
import {
  createThought,
  getThoughts,
  getThoughtById,
  updateThought,
  deleteThought,
  getThoughtsOfUser,
} from "../controllers/thoughtController.js";
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

export default router;
