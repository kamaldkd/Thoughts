import multer from "multer";
import os from "os";
import ExpressError from "../utils/ExpressError.js";

// Use disk storage instead of memory string to avoid memory leaks
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, os.tmpdir());
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB per file
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      console.error("File type not allowed:", file.mimetype);
      cb(
        new ExpressError(400, "Only image and video files are allowed"),
        false
      );
    }
  },
});

export default upload;
