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
} from "../controllers/thoughtController.js";
import { isLoggedIn } from "../middleware/isLoggedIn.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// debug route removed

router
  .route("/")
  .post(
    upload.array("media", 10),
    (req, res, next) => next(),
    wrapAsync(createThought)
  )
  .get(isLoggedIn, wrapAsync(getThoughts));

router
  .route("/:id")
  .get(isLoggedIn, wrapAsync(getThoughtById))
  .put(isLoggedIn, wrapAsync(updateThought))
  .delete(isLoggedIn, wrapAsync(deleteThought));

export default router;
