import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function test() {
  try {
    // 1. Login to get cookie
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'Password123'
    });
    
    // axios doesn't store cookies automatically, we must grab them from headers
    const cookies = loginRes.headers['set-cookie'];
    if (!cookies) throw new Error("No cookie received on login");
    console.log("Login successful, obtained cookie.");

    // 2. Create a dummy test image
    const imgPath = path.join(__dirname, 'test.png');
    // minimal 1x1 png base64
    const imgBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    fs.writeFileSync(imgPath, Buffer.from(imgBase64, 'base64'));

    // 3. Post a thought with an image
    const form = new FormData();
    form.append('text', 'Test image upload with disk storage!');
    form.append('file', fs.createReadStream(imgPath));

    const postRes = await axios.post('http://localhost:5000/api/thoughts', form, {
      headers: {
        ...form.getHeaders(),
        Cookie: cookies[0]
      }
    });

    console.log("Thought upload response:", !!postRes.data.thought);
    console.log("Media array length:", postRes.data.thought.media.length);
    console.log("Media URl:", postRes.data.thought.media[0].url);

    // cleanup local temporary image
    fs.unlinkSync(imgPath);
    console.log("Test completely successful!");

  } catch (err) {
    console.error("Test failed:", err.response ? err.response.data : err.message);
  }
}

test();
