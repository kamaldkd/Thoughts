import { v2 as cloudinary } from "cloudinary";
import  CloudinaryStorage from "multer-storage-cloudinary";

console.log(
  "Cloudinary config present:",
  !!process.env.CLOUD_NAME,
  !!process.env.CLOUD_API_KEY,
  !!process.env.CLOUD_API_SECRET
);

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith("image/");
    console.log("Cloudinary params for:", file.originalname);
    return {
      folder: "thoughts",
      resource_type: "auto",
      allowed_formats: isImage
        ? ["jpg", "png", "jpeg"]
        : ["mp4", "mov", "webm", "mkv"],
    };
  },
});

export { cloudinary, storage };
