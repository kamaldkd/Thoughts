import { v2 as cloudinary } from "cloudinary";

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

export { cloudinary };
