import multer from "multer";
import { storage } from "../config/cloudinary.js";
import ExpressError from "../utils/ExpressError.js";

// const upload = multer({ dest: "uploads/"
//  });
const upload = multer({
  storage: storage,
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
