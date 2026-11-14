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

const createResponse = () => ({
  chunks: [],
  headers: {},
  statusCode: undefined,
  ended: false,
  status(code) {
    this.statusCode = code;
    return this;
  },
  set(headers) {
    Object.assign(this.headers, headers);
    return this;
  },
  flushHeaders() {},
  write(chunk) {
    this.chunks.push(chunk);
  },
  end() {
    this.ended = true;
  },
});

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
      headers: { get: () => "application/json" },
      json: async () => ({
        choices: [{ message: { content: "Hello!" } }],
      }),
    };
  };

  const response = createResponse();
  await chatWithLotus(
    { body: { messages: [{ role: "user", content: "Hi" }] } },
    response
  );

  assert.equal(request.url.href, process.env.LOTUS_API_URL);
  assert.equal(request.options.headers.Authorization, "Bearer server-only-test-key");
  const requestBody = JSON.parse(request.options.body);
  assert.equal(requestBody.stream, true);
  assert.match(requestBody.messages[0].content, /Answer naturally and directly/);
  assert.match(response.chunks.join(""), /data: \{"text":"Hello!"\}/);
  assert.equal(response.ended, true);
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
      headers: { get: () => "application/json" },
      json: async () => ({
        choices: [{ message: { content: [{ type: "text", text: "Gemini reply" }] } }],
      }),
    };
  };

  const response = createResponse();
  await chatWithLotus(
    { body: { messages: [{ role: "user", content: "Hi" }] } },
    response
  );

  assert.equal(
    request.url.href,
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
  );
  assert.equal(request.options.headers.Authorization, "Bearer server-only-gemini-test-key");
  assert.equal(request.body.model, "gemini-4-hydrogen");
  assert.match(response.chunks.join(""), /data: \{"text":"Gemini reply"\}/);
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
        headers: { get: () => "application/json" },
        text: async () => JSON.stringify({ error: { message: "Model overloaded" } }),
      };
    }
    return {
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({
        choices: [{ message: { content: "Try again succeeded" } }],
      }),
    };
  };

  const response = createResponse();
  await chatWithLotus(
    { body: { messages: [{ role: "user", content: "Hi" }] } },
    response
  );

  assert.equal(attempts, 2);
  assert.match(response.chunks.join(""), /data: \{"text":"Try again succeeded"\}/);
});

test("forwards provider stream chunks as Lotus SSE deltas", async () => {
  process.env.GEMINI_API_KEY = "server-only-gemini-test-key";
  const encoder = new TextEncoder();
  const providerEvents = [
    'data: {"choices":[{"delta":{"content":"Hello "}}]}\r\n\r\n',
    'data: {"choices":[{"delta":{"content":"there!"}}]}\r\n\r\n',
    "data: [DONE]\r\n\r\n",
  ];

  globalThis.fetch = async () => new Response(
    new ReadableStream({
      start(controller) {
        for (const event of providerEvents) controller.enqueue(encoder.encode(event));
        controller.close();
      },
    }),
    { headers: { "Content-Type": "text/event-stream" } }
  );

  const response = createResponse();
  await chatWithLotus(
    { body: { messages: [{ role: "user", content: "Hi" }] } },
    response
  );

  const output = response.chunks.join("");
  assert.match(output, /data: \{"text":"Hello "\}/);
  assert.match(output, /data: \{"text":"there!"\}/);
  assert.match(output, /event: done/);
  assert.equal(response.ended, true);
});

test("extracts Gemini candidate text from streamed response chunks", async () => {
  process.env.GEMINI_API_KEY = "server-only-gemini-test-key";
  const encoder = new TextEncoder();
  globalThis.fetch = async () => new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'data: {"candidates":[{"content":{"parts":[{"text":"Gemini candidate reply"}]}}]}\n\n'
          )
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    }),
    { headers: { "Content-Type": "text/event-stream" } }
  );

  const response = createResponse();
  await chatWithLotus(
    { body: { messages: [{ role: "user", content: "Who is Narendra Modi?" }] } },
    response
  );

  assert.match(response.chunks.join(""), /data: \{"text":"Gemini candidate reply"\}/);
  assert.equal(response.ended, true);
});

test("reports a streamed reply that Gemini cut off at its output limit", async () => {
  process.env.GEMINI_API_KEY = "server-only-gemini-test-key";
  const encoder = new TextEncoder();
  globalThis.fetch = async () => new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'data: {"choices":[{"delta":{"content":"An unfinished reply"},"finish_reason":null}]}\n\n'
          )
        );
        controller.enqueue(
          encoder.encode(
            'data: {"choices":[{"delta":{},"finish_reason":"length"}]}\n\n'
          )
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    }),
    { headers: { "Content-Type": "text/event-stream" } }
  );

  const response = createResponse();
  await chatWithLotus(
    { body: { messages: [{ role: "user", content: "Tell me about this person." }] } },
    response
  );

  const output = response.chunks.join("");
  assert.match(output, /An unfinished reply/);
  assert.match(output, /event: error/);
  assert.match(output, /reply was cut short/);
  assert.doesNotMatch(output, /event: done/);
  assert.equal(response.ended, true);
});

test("returns a useful error when provider finishes without text", async () => {
  process.env.GEMINI_API_KEY = "server-only-gemini-test-key";
  globalThis.fetch = async () => ({
    ok: true,
    headers: { get: () => "application/json" },
    json: async () => ({ choices: [{ message: { content: null }, finish_reason: "length" }] }),
  });

  await assert.rejects(
    chatWithLotus(
      { body: { messages: [{ role: "user", content: "Hi" }] } },
      createResponse()
    ),
    {
      statusCode: 502,
      message: "Lotus couldn't generate a text reply. Please try again.",
    }
  );
});

test("hides upstream quota details from Lotus users", async () => {
  process.env.GEMINI_API_KEY = "server-only-gemini-test-key";
  globalThis.fetch = async () => ({
    ok: false,
    status: 429,
    headers: { get: () => "application/json" },
    text: async () => JSON.stringify({
      error: { message: "Quota exceeded" },
    }),
  });

  await assert.rejects(
    chatWithLotus(
      { body: { messages: [{ role: "user", content: "Hi" }] } },
      createResponse()
    ),
    {
      statusCode: 429,
      message: "Lotus can't respond right now. Please try again later.",
    }
  );
});
