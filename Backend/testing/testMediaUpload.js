import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

const API_BASE = "http://localhost:5000/api";

// Test credentials with unique username and email
const timestamp = Date.now();
const testUser = {
  username: `testuser${timestamp}`,
  email: `testuser${timestamp}@example.com`,
  password: "Test@123456",
};

// Create a simple test image (1x1 PNG)
const createTestImage = () => {
  const pngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0d, 0x49, 0x44, 0x41, 0x54, 0x08, 0x5b, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
    0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d, 0xb4, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
  const testImagePath = path.join(process.cwd(), "test-image.png");
  fs.writeFileSync(testImagePath, pngBuffer);
  return testImagePath;
};

async function runMediaTests() {
  let testImagePath;

  try {
    console.log("🧪 Starting Media Upload Tests...\n");

    // Register user
    console.log("📝 Step 1: Registering user...");
    const registerRes = await axios.post(`${API_BASE}/auth/register`, testUser);
    const token = registerRes.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log("✅ User registered successfully\n");

    // Create test image
    console.log("📝 Step 2: Creating test image file...");
    testImagePath = createTestImage();
    console.log(`✅ Test image created at: ${testImagePath}`);
    console.log(`📊 File size: ${fs.statSync(testImagePath).size} bytes\n`);

    // Test 1: Upload with media file
    console.log("📝 Step 3: Testing POST /api/thoughts with media upload...");
    console.log("⏳ Uploading to Cloudinary (this may take a moment)...");

    const formData = new FormData();
    formData.append("text", "This thought includes a beautiful image!");
    formData.append(
      "media",
      fs.createReadStream(testImagePath),
      "test-image.png"
    );

    const uploadRes = await axios.post(`${API_BASE}/thoughts/`, formData, {
      headers: {
        ...headers,
        ...formData.getHeaders(),
      },
      timeout: 60000,
    });

    console.log("✅ Media upload successful!");
    console.log("📋 Response:");
    console.log(JSON.stringify(uploadRes.data, null, 2));

    if (
      uploadRes.data.thought.media &&
      uploadRes.data.thought.media.length > 0
    ) {
      console.log("\n✅ Media array contains uploaded file");
      console.log("🔗 Media URL:", uploadRes.data.thought.media[0].url);
      console.log("📁 Media type:", uploadRes.data.thought.media[0].type);
    } else {
      console.log("\n⚠️  WARNING: Media array is empty!");
    }

    // Test 2: Multiple files
    console.log("\n📝 Step 4: Testing multiple media files (up to 10)...");
    const multiFormData = new FormData();
    multiFormData.append("text", "Thought with multiple images!");
    multiFormData.append(
      "media",
      fs.createReadStream(testImagePath),
      "image1.png"
    );
    multiFormData.append(
      "media",
      fs.createReadStream(testImagePath),
      "image2.png"
    );

    const multiRes = await axios.post(`${API_BASE}/thoughts/`, multiFormData, {
      headers: {
        ...headers,
        ...multiFormData.getHeaders(),
      },
      timeout: 30000,
    });

    console.log("✅ Multiple files uploaded successfully!");
    console.log(
      `📊 Number of media files: ${multiRes.data.thought.media.length}`
    );
    multiRes.data.thought.media.forEach((media, i) => {
      console.log(`  ${i + 1}. Type: ${media.type}, URL: ${media.url}`);
    });

    // Test 4: Invalid file type
    console.log("\n📝 Step 5: Testing invalid file type rejection...");
    const invalidFormData = new FormData();
    invalidFormData.append("text", "This should fail");
    // Create a dummy text file
    const textFilePath = path.join(process.cwd(), "test.txt");
    fs.writeFileSync(textFilePath, "This is a text file");
    invalidFormData.append(
      "media",
      fs.createReadStream(textFilePath),
      "test.txt"
    );

    try {
      await axios.post(`${API_BASE}/thoughts/`, invalidFormData, {
        headers: {
          ...headers,
          ...invalidFormData.getHeaders(),
        },
        timeout: 10000,
      });
      console.log("⚠️  Invalid file type was accepted (BUG!)");
    } catch (err) {
      console.log("✅ Invalid file type rejected correctly");
      console.log("Error:", err.response?.data?.message || err.message);
    }

    // Cleanup
    fs.unlinkSync(textFilePath);

    console.log("\n✅ All media upload tests completed!");
  } catch (err) {
    console.error("\n❌ Test failed with error:");
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    } else if (err.code) {
      console.error("Error code:", err.code);
      console.error("Message:", err.message);
    } else {
      console.error("Error:", err.message);
    }
    process.exit(1);
  } finally {
    // Cleanup test image
    if (testImagePath && fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  }
}

runMediaTests();
