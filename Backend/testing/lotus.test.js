import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { chatWithLotus } from "../src/controllers/lotusController.js";

const configKeys = [
  "LOTUS_API_URL",
  "LOTUS_API_KEY",
  "LOTUS_MODEL",
  "GEMINI_API_KEY",
];
const originalConfig = Object.fromEntries(
  configKeys.map((key) => [key, process.env[key]])
);
const originalFetch = globalThis.fetch;

afterEach(() => {
  for (const key of configKeys) {
    if (originalConfig[key] === undefined) delete process.env[key];
    else process.env[key] = originalConfig[key];
  }
  globalThis.fetch = originalFetch;
});

test("returns a clear configuration error when Lotus is not configured", async () => {
  for (const key of configKeys) delete process.env[key];

  await assert.rejects(
    chatWithLotus({ body: { messages: [{ role: "user", content: "Hi" }] } }, {}),
    { statusCode: 503, message: "Lotus is not configured yet." }
  );
});

test("sends the conversation to the configured endpoint and returns Lotus's reply", async () => {
  process.env.LOTUS_API_URL = "https://ai.example/v1/chat/completions";
  process.env.LOTUS_API_KEY = "server-only-test-key";
  process.env.LOTUS_MODEL = "free-model";

  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Hello!" } }],
      }),
    };
  };

  let payload;
  await chatWithLotus(
    { body: { messages: [{ role: "user", content: "Hi" }] } },
    { json: (body) => { payload = body; } }
  );

  assert.equal(request.url.href, process.env.LOTUS_API_URL);
  assert.equal(request.options.headers.Authorization, "Bearer server-only-test-key");
  assert.deepEqual(payload, { reply: "Hello!" });
});

test("uses the Gemini API key and free-tier defaults when configured", async () => {
  delete process.env.LOTUS_API_URL;
  delete process.env.LOTUS_API_KEY;
  delete process.env.LOTUS_MODEL;
  process.env.GEMINI_API_KEY = "server-only-gemini-test-key";

  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options, body: JSON.parse(options.body) };
    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Gemini reply" } }],
      }),
    };
  };

  let payload;
  await chatWithLotus(
    { body: { messages: [{ role: "user", content: "Hi" }] } },
    { json: (body) => { payload = body; } }
  );

  assert.equal(
    request.url.href,
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
  );
  assert.equal(request.options.headers.Authorization, "Bearer server-only-gemini-test-key");
  assert.equal(request.body.model, "gemini-4-hydrogen");
  assert.deepEqual(payload, { reply: "Gemini reply" });
});

test("retries a transient Gemini 503 and returns the successful reply", async () => {
  process.env.GEMINI_API_KEY = "server-only-gemini-test-key";

  let attempts = 0;
  globalThis.fetch = async () => {
    attempts += 1;
    if (attempts === 1) {
      return {
        ok: false,
        status: 503,
        text: async () => JSON.stringify({ error: { message: "Model overloaded" } }),
      };
    }
    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "Try again succeeded" } }],
      }),
    };
  };

  let payload;
  await chatWithLotus(
    { body: { messages: [{ role: "user", content: "Hi" }] } },
    { json: (body) => { payload = body; } }
  );

  assert.equal(attempts, 2);
  assert.deepEqual(payload, { reply: "Try again succeeded" });
});
