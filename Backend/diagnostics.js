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

async function diagnostics() {
  try {
    console.log("🔍 Media Upload Diagnostics\n");

    // Step 1: Auth
    console.log("1️⃣  Testing authentication...");
    const registerRes = await axios.post(
      `${API_BASE}/auth/register`,
      testUser,
      { timeout: 10000 }
    );
    const token = registerRes.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log("✅ Authentication OK\n");

    // Step 2: Test without files (should work quickly)
    console.log("2️⃣  Testing thought creation WITHOUT files...");
    const textOnlyRes = await axios.post(
      `${API_BASE}/thoughts/`,
      { text: "Test without media" },
      { headers, timeout: 10000 }
    );
    console.log("✅ Text-only thought created OK");
    console.log(`   Created at: ${textOnlyRes.data.thought.createdAt}\n`);

    // Step 3: Check server upload config
    console.log("3️⃣  Cloudinary Environment Variables Check:");
    const envCheck = await axios
      .get(`${API_BASE}/auth/register`, {
        headers: { "X-Debug": "true" },
        timeout: 5000,
      })
      .catch((e) => ({ data: {} }));
    console.log(
      `   Cloud Name: ${process.env.CLOUD_NAME ? "✅ Set" : "❌ Missing"}`
    );
    console.log(
      `   API Key: ${process.env.CLOUD_API_KEY ? "✅ Set" : "❌ Missing"}`
    );
    console.log(
      `   API Secret: ${
        process.env.CLOUD_API_SECRET ? "✅ Set" : "❌ Missing"
      }\n`
    );

    // Step 4: Test with tiny image
    console.log(
      "4️⃣  Testing media upload (THIS MAY TAKE TIME - waiting up to 90 seconds)..."
    );
    console.log("   Creating test image...");

    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
      0x0d, 0x49, 0x44, 0x41, 0x54, 0x08, 0x5b, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
      0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d, 0xb4, 0x00, 0x00, 0x00,
      0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    const testImagePath = path.join(process.cwd(), "diag-image.png");
    fs.writeFileSync(testImagePath, pngBuffer);
    console.log("   Image created (69 bytes)");
    console.log("   Starting upload...");

    const startTime = Date.now();

    const formData = new FormData();
    formData.append("text", "Diagnostic upload test");
    formData.append("media", fs.createReadStream(testImagePath), "test.png");

    const uploadRes = await axios.post(`${API_BASE}/thoughts/`, formData, {
      headers: {
        ...headers,
        ...formData.getHeaders(),
      },
      timeout: 90000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const elapsed = Date.now() - startTime;
    console.log(`✅ Upload successful! (took ${Math.round(elapsed / 1000)}s)`);
    console.log(
      `   Media uploaded: ${uploadRes.data.thought.media.length} file(s)`
    );
    if (uploadRes.data.thought.media.length > 0) {
      console.log(`   URL: ${uploadRes.data.thought.media[0].url}`);
    }

    fs.unlinkSync(testImagePath);
    console.log("\n✅ All diagnostics passed!");
  } catch (err) {
    console.error("\n❌ Diagnostic failed:");
    if (err.response) {
      console.error(`   Status: ${err.response.status}`);
      console.error(
        `   Message: ${err.response.data?.message || err.response.statusText}`
      );
    } else if (err.code === "ECONNABORTED") {
      console.error(
        `   ❌ Request timeout - Cloudinary upload is unresponsive or very slow`
      );
      console.error(`   Check:`);
      console.error(`   - Cloudinary API keys are valid`);
      console.error(
        `   - Network connectivity to Cloudinary (cdn.cloudinary.com)`
      );
      console.error(`   - Server logs for detailed errors`);
    } else {
      console.error(`   ${err.code}: ${err.message}`);
    }
    process.exit(1);
  }
}

diagnostics();
