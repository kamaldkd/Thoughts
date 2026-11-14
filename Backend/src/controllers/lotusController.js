import ExpressError from "../utils/ExpressError.js";
import logger from "../utils/logger.js";

const SYSTEM_PROMPT =
  "You are Lotus, a friendly and thoughtful assistant on the Thoughts social platform. Answer naturally and directly, with enough context to fully answer the question. Use complete sentences and finish your thoughts. For straightforward factual questions, avoid source-attribution preambles and citations unless requested; never claim you consulted sources you did not access. Be concise and respectful. Do not claim to access private account data or perform actions on the user's behalf.";

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

const writeEvent = (res, event, data) => {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
};

export const chatWithLotus = async (req, res) => {
  const apiUrl =
    process.env.LOTUS_API_URL ||
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
  const apiKey = process.env.LOTUS_API_KEY || process.env.GEMINI_API_KEY;
  const model = process.env.LOTUS_MODEL || "gemini-3.5-flash-lite";

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
          stream: true,
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
      throw new ExpressError(
        429,
        "Lotus can't respond right now. Please try again later."
      );
    }
    if (response.status === 503) {
      throw new ExpressError(503, "Lotus is temporarily busy. Please try again shortly.");
    }
    throw new ExpressError(502, "Lotus is temporarily unavailable. Please try again.");
  }

  const contentType = response.headers?.get?.("content-type") || "";
  let responseStarted = false;
  let replyLength = 0;
  let providerFrames = 0;
  let providerShape = "no stream data";
  let finishReason = "unknown";
  let providerStreamError = "";
  const sendDelta = (text) => {
    if (!text) return;
    if (!responseStarted) {
      res.status(200);
      res.set({
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      });
      res.flushHeaders();
      responseStarted = true;
    }
    replyLength += text.length;
    writeEvent(res, "delta", { text });
  };

  try {
    if (contentType.includes("text/event-stream")) {
      if (!response.body) {
        throw new Error("Provider returned an empty stream.");
      }

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
        if (!data || data === "[DONE]") return;

        const chunk = JSON.parse(data);
        providerFrames += 1;
        const choice = chunk.choices?.[0];
        const candidate = chunk.candidates?.[0];
        providerShape = `keys=${Object.keys(chunk).slice(0, 8).join(",") || "none"}, choices=${chunk.choices?.length || 0}, candidates=${chunk.candidates?.length || 0}`;
        finishReason = String(
          choice?.finish_reason ||
            candidate?.finishReason ||
            chunk.finishReason ||
            finishReason
        );
        if (chunk.error) {
          const errorMessage =
            chunk.error.message || chunk.error.status || "provider stream error";
          providerShape += `, error=${String(errorMessage).replaceAll(apiKey, "[redacted]").slice(0, 160)}`;
          providerStreamError = String(errorMessage)
            .replaceAll(apiKey, "[redacted]")
            .slice(0, 300);
          return;
        }
        sendDelta(extractStreamReply(chunk));
      };

      while (!streamDone) {
        const { value, done } = await reader.read();
        streamDone = done;
        buffer = (buffer + decoder.decode(value, { stream: !done })).replace(/\r\n/g, "\n");

        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          processEvent(buffer.slice(0, boundary));
          buffer = buffer.slice(boundary + 2);
          boundary = buffer.indexOf("\n\n");
        }
      }

      if (buffer.trim()) processEvent(buffer);
    } else {
      const data = await response.json();
      const reply = extractReply(data);
      finishReason = String(
        data.choices?.[0]?.finish_reason ||
          data.candidates?.[0]?.finishReason ||
          "unknown"
      );
      if (!reply.trim()) {
        logger.warn(
          `[Lotus] Provider response contained no text. finish_reason=${finishReason}`
        );
        throw new ExpressError(
          502,
          "Lotus couldn't generate a text reply. Please try again."
        );
      }
      sendDelta(reply);
    }

    if (isIncompleteFinishReason(finishReason)) {
      const message =
        "Lotus's reply was cut short by the AI provider. Please ask it to continue.";
      logger.warn(`[Lotus] Provider stopped at its output limit: ${finishReason}`);
      if (responseStarted) {
        writeEvent(res, "error", { message });
        res.end();
        return;
      }
      throw new ExpressError(502, message);
    }

    if (providerStreamError) {
      logger.error(`[Lotus] Provider stream error: ${providerStreamError}`);
      if (responseStarted) {
        writeEvent(res, "error", {
          message: "The AI provider couldn't complete this reply. Please try again.",
        });
        res.end();
        return;
      }
      throw new ExpressError(
        502,
        "The AI provider couldn't complete this reply. Please try again."
      );
    }

    if (!replyLength) {
      logger.warn(
        `[Lotus] Provider stream completed without text. frames=${providerFrames}, ${providerShape}, finish_reason=${finishReason}, content_type=${contentType || "unknown"}`
      );
      throw new ExpressError(
        502,
        "The AI provider didn't return any text. It may have blocked the prompt or reached a generation limit; please try again."
      );
    }

    writeEvent(res, "done", {});
    res.end();
  } catch (error) {
    if (!responseStarted) {
      if (error instanceof ExpressError) throw error;
      logger.error(`[Lotus] Provider stream could not be read: ${error.message}`);
      throw new ExpressError(502, "Lotus's response was interrupted. Please try again.");
    }

    logger.error(`[Lotus] Provider stream ended unexpectedly: ${error.message}`);
    writeEvent(res, "error", {
      message: "Lotus's response was interrupted. Please try again.",
    });
    res.end();
  }
};
