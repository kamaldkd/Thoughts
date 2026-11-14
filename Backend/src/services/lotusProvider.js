import ExpressError from "../utils/ExpressError.js";
import logger from "../utils/logger.js";

const SYSTEM_PROMPTS = {
  friendly:
    "You are Lotus, a friendly and thoughtful assistant on the Thoughts social platform. Answer naturally and directly, with enough context to fully answer the question. Use complete sentences and finish your thoughts. For straightforward factual questions, avoid source-attribution preambles and citations unless requested; never claim you consulted sources you did not access. Be concise and respectful. Do not claim to access private account data or perform actions on the user's behalf.",
  professional:
    "You are Lotus, a professional and thoughtful assistant on the Thoughts social platform. Give clear, well-structured, accurate answers in a polished tone. Use complete sentences, finish your thoughts, and avoid claiming to access private account data or perform actions on the user's behalf.",
  creative:
    "You are Lotus, a creative and thoughtful assistant on the Thoughts social platform. Explore original ideas and expressive language while staying relevant, useful, and respectful. Use complete sentences and do not claim to access private account data or perform actions on the user's behalf.",
};

const MAX_PROVIDER_RETRIES = 2;

const readProviderError = async (response, apiKey) => {
  try {
    const body = await response.text();
    try {
      const parsed = JSON.parse(body);
      return String(parsed.error?.message || parsed.message || body)
        .replaceAll(apiKey, "[redacted]")
        .slice(0, 300);
    } catch {
      return body.replaceAll(apiKey, "[redacted]").slice(0, 300);
    }
  } catch (error) {
    logger.warn(`[Lotus] Could not read provider error details: ${error.message}`);
    return "";
  }
};

const extractText = (content) => {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (typeof part?.text === "string") return part.text;
      if (typeof part?.content === "string") return part.content;
      return "";
    })
    .join("");
};

const extractReply = (data) => {
  const choice = data.choices?.[0];
  const choiceText = extractText(choice?.message?.content) || extractText(choice?.text);
  if (choiceText.trim()) return choiceText;
  return (data.candidates?.[0]?.content?.parts || [])
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("");
};

const extractStreamReply = (data) => {
  const choice = data.choices?.[0];
  const choiceText =
    extractText(choice?.delta?.content) ||
    extractText(choice?.message?.content) ||
    extractText(choice?.text);
  if (choiceText) return choiceText;
  const candidateText = (data.candidates || [])
    .flatMap((candidate) => candidate.content?.parts || [])
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("");
  return candidateText || extractText(data.delta?.content) || extractText(data.text);
};

const isIncompleteFinishReason = (reason) =>
  ["length", "max_tokens", "max_tokens_exceeded", "max_tokens_reached"].includes(
    String(reason).toLowerCase()
  );

const wait = (milliseconds, signal) =>
  new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timeout);
      signal.removeEventListener("abort", onAbort);
      reject(signal.reason || new Error("Request aborted"));
    };
    const timeout = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, milliseconds);
    signal.addEventListener(
      "abort",
      onAbort,
      { once: true }
    );
  });

const makeRequest = async (messages, signal) => {
  const apiUrl =
    process.env.LOTUS_API_URL ||
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
  const apiKey = process.env.LOTUS_API_KEY || process.env.GEMINI_API_KEY;
  const model = process.env.LOTUS_MODEL || "gemini-3.5-flash-lite";

  if (!apiKey) throw new ExpressError(503, "Lotus is not configured yet.");

  let endpoint;
  try {
    endpoint = new URL(apiUrl);
  } catch {
    throw new ExpressError(500, "Lotus API endpoint is not a valid URL.");
  }
  const isLocalHttp = endpoint.protocol === "http:" && endpoint.hostname === "localhost";
  if (endpoint.protocol !== "https:" && !isLocalHttp) {
    throw new ExpressError(500, "Lotus API endpoint must use HTTPS.");
  }

  let response;
  let providerError = "";
  const timeoutSignal = AbortSignal.timeout(30_000);
  const requestSignal = AbortSignal.any([signal, timeoutSignal]);
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
          messages,
          max_tokens: 1200,
          stream: true,
        }),
        signal: requestSignal,
      });

      if (response.ok || response.status !== 503 || attempt === MAX_PROVIDER_RETRIES) {
        break;
      }
      providerError = await readProviderError(response, apiKey);
      await wait(1000 * (2 ** attempt) + Math.floor(Math.random() * 250), requestSignal);
    }
  } catch (error) {
    if (signal.aborted) throw error;
    if (timeoutSignal.aborted) {
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
      throw new ExpressError(429, "Lotus can't respond right now. Please try again later.");
    }
    if (response.status === 503) {
      throw new ExpressError(503, "Lotus is temporarily busy. Please try again shortly.");
    }
    throw new ExpressError(502, "Lotus is temporarily unavailable. Please try again.");
  }
  return { response, apiKey };
};

export async function* streamLotusCompletion({ messages, mode, signal }) {
  const providerMessages = [
    { role: "system", content: SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.friendly },
    ...messages,
  ];
  const { response, apiKey } = await makeRequest(providerMessages, signal);
  const contentType = response.headers?.get?.("content-type") || "";
  let replyLength = 0;
  let finishReason = "unknown";
  let providerStreamError = "";

  const validateChunk = (chunk) => {
    const choice = chunk.choices?.[0];
    const candidate = chunk.candidates?.[0];
    finishReason = String(
      choice?.finish_reason ||
        candidate?.finishReason ||
        chunk.finishReason ||
        finishReason
    );
    if (chunk.error) {
      providerStreamError = String(
        chunk.error.message || chunk.error.status || "provider stream error"
      ).replaceAll(apiKey, "[redacted]").slice(0, 300);
      return "";
    }
    return extractStreamReply(chunk);
  };

  if (contentType.includes("text/event-stream")) {
    if (!response.body) throw new Error("Provider returned an empty stream.");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let streamDone = false;
    const processEvent = (eventText) => {
      const data = eventText
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");
      if (!data || data === "[DONE]") return "";
      return validateChunk(JSON.parse(data));
    };

    while (!streamDone) {
      const { value, done } = await reader.read();
      streamDone = done;
      buffer = (buffer + decoder.decode(value, { stream: !done })).replace(/\r\n/g, "\n");
      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const text = processEvent(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        if (text) {
          replyLength += text.length;
          yield text;
        }
        boundary = buffer.indexOf("\n\n");
      }
    }
    if (buffer.trim()) {
      const text = processEvent(buffer);
      if (text) {
        replyLength += text.length;
        yield text;
      }
    }
  } else {
    const data = await response.json();
    finishReason = String(
      data.choices?.[0]?.finish_reason ||
        data.candidates?.[0]?.finishReason ||
        "unknown"
    );
    const text = extractReply(data);
    if (text.trim()) {
      replyLength = text.length;
      yield text;
    }
  }

  if (providerStreamError) {
    logger.error(`[Lotus] Provider stream error: ${providerStreamError}`);
    throw new ExpressError(502, "The AI provider couldn't complete this reply. Please try again.");
  }
  if (isIncompleteFinishReason(finishReason)) {
    throw new ExpressError(
      502,
      "Lotus's reply was cut short by the AI provider. Please ask it to continue."
    );
  }
  if (!replyLength) {
    throw new ExpressError(
      502,
      "The AI provider didn't return any text. It may have blocked the prompt or reached a generation limit; please try again."
    );
  }
}

export const collectLotusCompletion = async (options) => {
  let reply = "";
  for await (const text of streamLotusCompletion(options)) reply += text;
  return reply;
};
