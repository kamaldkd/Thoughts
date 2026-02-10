import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

const API_BASE = "http://localhost:5000/api";

const timestamp = Date.now();
const testUser = {
  username: `testuser${timestamp}`,
  email: `testuser${timestamp}@example.com`,
  password: "Test@123456",
};

async function testUploadWithLogging() {
  console.log("🔍 Upload Test with Logging\n");

  try {
    // Auth
    console.log("1️⃣  Authenticating...");
    const registerRes = await axios.post(
      `${API_BASE}/auth/register`,
      testUser,
      { timeout: 10000 }
    );
    const token = registerRes.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log("✅ Authenticated\n");

    // Create test image
    console.log("2️⃣  Creating test image...");
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
      0x0d, 0x49, 0x44, 0x41, 0x54, 0x08, 0x5b, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
      0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d, 0xb4, 0x00, 0x00, 0x00,
      0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);
    const testImagePath = path.join(process.cwd(), "upload-test.png");
    fs.writeFileSync(testImagePath, pngBuffer);
    console.log(`✅ Image created (${pngBuffer.length} bytes)\n`);

    // Test upload
    console.log("3️⃣  Sending multipart form-data to POST /api/thoughts...");
    const formData = new FormData();
    formData.append("text", "Testing media upload functionality");
    formData.append(
      "media",
      fs.createReadStream(testImagePath),
      "upload-test.png"
    );

    console.log("   Request details:");
    console.log(`   - Endpoint: ${API_BASE}/thoughts/`);
    console.log(`   - Method: POST`);
    console.log(`   - Auth: Bearer token`);
    console.log(`   - Content-Type: multipart/form-data`);
    console.log(`   - Fields: text (string), media (file)\n`);

    console.log("   ⏳ Uploading... (30 second timeout)\n");

    const startTime = Date.now();
    const uploadRes = await axios.post(`${API_BASE}/thoughts/`, formData, {
      headers: {
        ...headers,
        ...formData.getHeaders(),
      },
      timeout: 30000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const elapsed = Date.now() - startTime;
    console.log(`✅ Upload completed in ${Math.round(elapsed / 1000)}s\n`);

    console.log("📋 Response:");
    console.log(JSON.stringify(uploadRes.data, null, 2));

    console.log("\n✅ Media array contents:");
    if (uploadRes.data.thought.media.length > 0) {
      uploadRes.data.thought.media.forEach((media, i) => {
        console.log(`   ${i + 1}. Type: ${media.type}`);
        console.log(`      URL: ${media.url}`);
      });
    } else {
      console.log("   ⚠️  No media files in response");
    }

    fs.unlinkSync(testImagePath);
  } catch (err) {
    console.error("\n❌ Error:");
    if (err.response) {
      console.error(`Status: ${err.response.status}`);
      console.error(
        `Message: ${err.response.data?.message || err.response.statusText}`
      );
    } else if (err.code === "ECONNABORTED") {
      console.error(`Timeout after ${err.config?.timeout}ms`);
      console.error("\n💡 Possible causes:");
      console.error("   1. multer-storage-cloudinary is not working correctly");
      console.error("   2. Cloudinary storage configuration has an issue");
      console.error("   3. Network issue with Cloudinary");
      console.error("\n💡 Workaround: Try using local file storage instead");
    } else {
      console.error(`${err.code}: ${err.message}`);
    }
    process.exit(1);
  }
}

testUploadWithLogging();
