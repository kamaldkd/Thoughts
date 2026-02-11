import dotenv from "dotenv";
dotenv.config();

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

console.log("Testing Cloudinary Configuration\n");

console.log("Environment Variables:");
console.log(
  `CLOUD_NAME: ${
    process.env.CLOUD_NAME ? "✅ " + process.env.CLOUD_NAME : "❌ Not set"
  }`
);
console.log(
  `CLOUD_API_KEY: ${
    process.env.CLOUD_API_KEY
      ? "✅ " + process.env.CLOUD_API_KEY.substring(0, 10) + "..."
      : "❌ Not set"
  }`
);
console.log(
  `CLOUD_API_SECRET: ${
    process.env.CLOUD_API_SECRET ? "✅ Set" : "❌ Not set"
  }\n`
);

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

console.log("Cloudinary Configuration:");
console.log(`Cloud Name: ${cloudinary.config().cloud_name}`);
console.log(
  `API Key: ${
    cloudinary.config().api_key
      ? "✅ " + cloudinary.config().api_key.substring(0, 10) + "..."
      : "❌ Missing"
  }`
);
console.log(
  `API Secret: ${cloudinary.config().api_secret ? "✅ Set" : "❌ Missing"}\n`
);

// Test Cloudinary API
console.log("Testing Cloudinary API Connection...");
try {
  const result = await cloudinary.api.ping();
  console.log("✅ Cloudinary API is reachable");
  console.log(`   Status: ${result.status}\n`);
} catch (err) {
  console.error("❌ Cloudinary API error:");
  console.error(`   ${err.message}\n`);
}

// Test upload
console.log("Testing file upload...");

try {
  // Create tiny test file
  const testFile = path.join(process.cwd(), "test-upload.txt");
  fs.writeFileSync(testFile, "test content");

  const uploadResult = await cloudinary.uploader.upload(testFile, {
    folder: "thoughts-test",
    resource_type: "auto",
    timeout: 30000,
  });

  console.log("✅ Upload successful!");
  console.log(`   URL: ${uploadResult.secure_url}`);
  console.log(`   Public ID: ${uploadResult.public_id}\n`);

  // Delete test file
  fs.unlinkSync(testFile);

  // Clean up uploaded file
  await cloudinary.uploader.destroy(uploadResult.public_id);
} catch (err) {
  console.error("❌ Upload failed:");
  console.error(`   ${err.message}\n`);
  console.error("Details:", err);
}
