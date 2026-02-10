import multer from "multer";
import ExpressError from "../utils/ExpressError.js";

// Use memory storage instead of CloudinaryStorage to avoid timeout issues
const upload = multer({
  storage: multer.memoryStorage(),
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
