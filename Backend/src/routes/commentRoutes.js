import express from "express";
import wrapAsync from "../utils/wrapAsync.js";
import { isLoggedIn } from "../middleware/isLoggedIn.js";
import { updateComment, deleteComment } from "../controllers/commentController.js";

const router = express.Router();

// Edit own comment
router.put("/:id", isLoggedIn, wrapAsync(updateComment));

// Delete own comment (or thought author deletes any comment on their post)
router.delete("/:id", isLoggedIn, wrapAsync(deleteComment));

export default router;
