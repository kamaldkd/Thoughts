import ExpressError from "../utils/ExpressError.js";
import logger from "../utils/logger.js";

const SYSTEM_PROMPT =
  "You are Lotus, a friendly and thoughtful assistant on the Thoughts social platform. Be helpful, concise, and respectful. Do not claim to access private account data or perform actions on the user's behalf.";

const MAX_PROVIDER_RETRIES = 2;

const readProviderError = async (response, apiKey) => {
  try {
    const body = await response.text();
    let details = body;

    try {
      const parsed = JSON.parse(body);
      details = parsed.error?.message || parsed.message || body;
    } catch {
      // Keep non-JSON provider error bodies useful for diagnostics.
    }

    return String(details).replaceAll(apiKey, "[redacted]").slice(0, 300);
  } catch (error) {
    logger.warn(`[Lotus] Could not read provider error details: ${error.message}`);
    return "";
  }
};

export const chatWithLotus = async (req, res) => {
  const apiUrl =
    process.env.LOTUS_API_URL ||
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
  const apiKey = process.env.LOTUS_API_KEY || process.env.GEMINI_API_KEY;
  const model = process.env.LOTUS_MODEL || "gemini-4-hydrogen";

  if (!apiKey) {
    throw new ExpressError(503, "Lotus is not configured yet.");
  }

  let endpoint;
  try {
    endpoint = new URL(apiUrl);
  } catch {
    throw new ExpressError(500, "Lotus API endpoint is not a valid URL.");
  }
  if (endpoint.protocol !== "https:" && endpoint.hostname !== "localhost") {
    throw new ExpressError(500, "Lotus API endpoint must use HTTPS.");
  }

  let response;
  let providerError = "";
  const signal = AbortSignal.timeout(30_000);
  try {
    for (let attempt = 0; attempt <= MAX_PROVIDER_RETRIES; attempt += 1) {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...req.body.messages],
          max_tokens: 800,
        }),
        signal,
      });

      if (response.ok || response.status !== 503 || attempt === MAX_PROVIDER_RETRIES) {
        break;
      }

      providerError = await readProviderError(response, apiKey);
      const delayMs = 1000 * (2 ** attempt) + Math.floor(Math.random() * 250);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  } catch (error) {
    if (error.name === "TimeoutError") {
      throw new ExpressError(504, "Lotus took too long to respond. Please try again.");
    }
    logger.error(`[Lotus] Provider request failed: ${error.message}`);
    throw new ExpressError(502, "Lotus is temporarily unavailable. Please try again.");
  }

  if (!response.ok) {
    const finalProviderError = await readProviderError(response, apiKey);
    providerError = finalProviderError || providerError;
    logger.error(
      `[Lotus] Provider returned HTTP ${response.status}${providerError ? `: ${providerError}` : "."}`
    );
    if (response.status === 429) {
      throw new ExpressError(429, "Lotus has reached its current free-tier limit. Please try again later.");
    }
    if (response.status === 503) {
      throw new ExpressError(503, "Gemini is temporarily busy. Please try again shortly.");
    }
    throw new ExpressError(502, "Lotus is temporarily unavailable. Please try again.");
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    logger.error(`[Lotus] Provider returned invalid JSON: ${error.message}`);
    throw new ExpressError(502, "Lotus returned an invalid response. Please try again.");
  }

  const reply = data.choices?.[0]?.message?.content;
  if (typeof reply !== "string" || !reply.trim()) {
    logger.error("[Lotus] Provider response did not contain a reply.");
    throw new ExpressError(502, "Lotus returned an invalid response. Please try again.");
  }

  res.json({ reply: reply.trim() });
};
