import axios from "axios";

const API_BASE = "http://localhost:5000/api";

// Test credentials with unique username and email
const timestamp = Date.now();
const testUser = {
  username: `testuser${timestamp}`,
  email: `testuser${timestamp}@example.com`,
  password: "Test@123456",
};

async function runTests() {
  try {
    console.log("🧪 Starting API tests...\n");

    // Step 1: Register a user
    console.log("📝 Step 1: Registering user...");
    let registerRes;
    try {
      registerRes = await axios.post(`${API_BASE}/auth/register`, testUser);
      console.log("✅ Registration successful");
      console.log("Token:", registerRes.data.token);
    } catch (err) {
      if (
        err.response?.status === 400 &&
        err.response?.data?.message?.includes("already registered")
      ) {
        console.log("⚠️  User already exists, logging in instead...");
        const loginRes = await axios.post(`${API_BASE}/auth/login`, {
          email: testUser.email,
          password: testUser.password,
        });
        registerRes = loginRes;
      } else {
        throw err;
      }
    }

    const token = registerRes.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    console.log("\n✅ Authentication successful\n");

    // Step 2: Test POST /api/thoughts (without media)
    console.log("📝 Step 2: Testing POST /api/thoughts (text only)...");
    const thought1Res = await axios.post(
      `${API_BASE}/thoughts/`,
      { text: "This is my first thought!" },
      { headers }
    );
    console.log("✅ Thought created successfully");
    console.log("Response:", JSON.stringify(thought1Res.data, null, 2));

    // Step 3: Test with empty text
    console.log("\n📝 Step 3: Testing POST /api/thoughts (with empty text)...");
    try {
      await axios.post(`${API_BASE}/thoughts/`, { text: "" }, { headers });
      console.log("⚠️  Empty text was accepted (might be a validation issue)");
    } catch (err) {
      console.log("✅ Empty text rejected as expected");
      console.log("Error:", err.response?.data?.message || err.message);
    }

    // Step 4: Test without text field
    console.log(
      "\n📝 Step 4: Testing POST /api/thoughts (missing text field)..."
    );
    try {
      await axios.post(`${API_BASE}/thoughts/`, {}, { headers });
      console.log(
        "⚠️  Missing text was accepted (might be a validation issue)"
      );
    } catch (err) {
      console.log("✅ Missing text rejected as expected");
      console.log("Error:", err.response?.data?.message || err.message);
    }

    // Step 5: Test without authentication token
    console.log("\n📝 Step 5: Testing POST /api/thoughts (without token)...");
    try {
      await axios.post(`${API_BASE}/thoughts/`, {
        text: "This should fail without auth",
      });
      console.log(
        "⚠️  Request succeeded without token (authentication not enforced!)"
      );
    } catch (err) {
      console.log("✅ Request rejected without token");
      console.log("Error:", err.response?.data?.message || err.message);
    }

    console.log("\n✅ All tests completed!");
  } catch (err) {
    console.error("❌ Test failed:", err.response?.data || err.message);
    process.exit(1);
  }
}

runTests();
