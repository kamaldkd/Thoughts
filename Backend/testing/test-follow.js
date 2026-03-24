import axios from "axios";
import mongoose from "mongoose";

async function testFollow() {
  try {
    // Fetch CSRF Token first
    const csrfRes = await axios.get("http://localhost:5000/api/csrf-token");
    const csrfToken = csrfRes.data.csrfToken;
    const extractCookies = (headers) => {
        if (!headers || !headers["set-cookie"]) return [];
        return headers["set-cookie"].map(c => c.split(";")[0]);
    };
    let cookies = extractCookies(csrfRes.headers);

    // 1. Login user A
    const loginA = await axios.post("http://localhost:5000/api/auth/login", {
      email: "test@example.com",
      password: "Password123"
    }, {
      headers: { "X-CSRF-Token": csrfToken, "Cookie": cookies.join('; ') }
    });
    
    // Merge new cookies
    const newCookies = extractCookies(loginA.headers);
    if (newCookies.length) {
       cookies = [...cookies, ...newCookies];
    }

    // 2. We need another user B to follow. Let's register one dynamically.
    const dynamicUsername = "user" + Date.now();
    await axios.post("http://localhost:5000/api/auth/register", {
      name: "Test User B",
      username: dynamicUsername,
      email: dynamicUsername + "@example.com",
      password: "Password123"
    }, {
      headers: { "X-CSRF-Token": csrfToken, "Cookie": cookies.join('; ') }
    });

    // Get B's profile
    const profileBBefore = await axios.get(`http://localhost:5000/api/users/username/${dynamicUsername}`, {
      headers: { Cookie: cookies.join('; '), "X-CSRF-Token": csrfToken }
    });

    const targetId = profileBBefore.data._id;
    console.log(`Before Follow: B's followers = ${profileBBefore.data.followersCount}, isFollowing = ${profileBBefore.data.isFollowing}`);

    if (profileBBefore.data.followersCount !== 0 || profileBBefore.data.isFollowing) {
        throw new Error("Initial state is wrong.");
    }

    // 3. User A follows User B
    const followRes = await axios.post(`http://localhost:5000/api/users/${targetId}/follow`, {}, {
      headers: { Cookie: cookies.join('; '), "X-CSRF-Token": csrfToken }
    });
    console.log("Follow response:", followRes.data.message);

    // 4. Verify B's profile again
    const profileBAfter = await axios.get(`http://localhost:5000/api/users/username/${dynamicUsername}`, {
      headers: { Cookie: cookies.join('; '), "X-CSRF-Token": csrfToken }
    });

    console.log(`After Follow: B's followers = ${profileBAfter.data.followersCount}, isFollowing = ${profileBAfter.data.isFollowing}`);

    if (profileBAfter.data.followersCount !== 1 || !profileBAfter.data.isFollowing) {
        throw new Error("Follow did not reflect on B's profile.");
    }

    // 5. Unfollow
    const unfollowRes = await axios.post(`http://localhost:5000/api/users/${targetId}/unfollow`, {}, {
      headers: { Cookie: cookies.join('; '), "X-CSRF-Token": csrfToken }
    });
    console.log("Unfollow response:", unfollowRes.data.message);

    // 6. Verify B's profile again
    const profileBFinal = await axios.get(`http://localhost:5000/api/users/username/${dynamicUsername}`, {
      headers: { Cookie: cookies.join('; '), "X-CSRF-Token": csrfToken }
    });

    console.log(`After Unfollow: B's followers = ${profileBFinal.data.followersCount}, isFollowing = ${profileBFinal.data.isFollowing}`);

    if (profileBFinal.data.followersCount !== 0 || profileBFinal.data.isFollowing) {
        throw new Error("Unfollow did not reflect on B's profile.");
    }

    console.log("Follow Test completed successfully!");
    
  } catch (err) {
    if (err.response) {
      console.error("Test failed with API Error:", err.response.data);
    } else {
      console.error("Test failed:", err);
    }
    process.exit(1);
  }
}

testFollow();
