import axios from "axios";

async function testCSRF() {
  console.log("1. Testing POST without token...");
  try {
    await axios.post("http://localhost:5000/api/thoughts", { text: "Hello" });
    throw new Error("Should have failed CSRF!");
  } catch (err) {
    if (err.response && err.response.status === 403 && err.response.data.error === "invalid csrf token") {
      console.log("✅ Passed: Blocked request without CSRF token.");
    } else {
      console.error("❌ Failed: Did not get 403 CSRF error", err.response?.data || err.message);
      process.exit(1);
    }
  }

  console.log("2. Fetching CSRF Token...");
  let csrfToken = null;
  let sessionCookie = null;
  try {
    const res = await axios.get("http://localhost:5000/api/csrf-token");
    csrfToken = res.data.csrfToken;
    sessionCookie = res.headers["set-cookie"][0];
    console.log("✅ Passed: Retrieved Token:", csrfToken);
  } catch (err) {
    console.error("❌ Failed to get CSRF token:", err.message);
    process.exit(1);
  }

  console.log("3. Testing POST WITH token...");
  try {
    await axios.post("http://localhost:5000/api/thoughts", { text: "Hello" }, {
      headers: {
        "CSRF-Token": csrfToken,
        Cookie: sessionCookie
      }
    });
    // It should pass CSRF but fail Auth (401)
  } catch (err) {
    if (err.response && err.response.status === 401) {
      console.log("✅ Passed: CSRF test succeeded, request progressed to Auth layer (401).");
    } else {
      console.error("❌ Failed CSRF (unexpected status):", err.response?.status, err.response?.data);
      process.exit(1);
    }
  }
}

testCSRF();
