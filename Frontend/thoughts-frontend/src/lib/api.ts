import axios from "axios";

// In production: VITE_API_URL is not set on Vercel → falls back to "/api"
// Vercel proxies /api/* → https://thoughts-5bxn.onrender.com/api/* (see vercel.json)
// In local dev: VITE_API_URL=http://localhost:5000/api (set in .env)
const BASE_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // still send cookies as secondary fallback
});

/* ─────────────────────────────────────────────
   TOKEN STORAGE — Authorization header approach
   Stores accessToken in memory (not localStorage — avoids XSS risk).
   Cleared on page refresh; refreshToken cookie handles session restoration.
───────────────────────────────────────────── */

export let accessTokenInMemory: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessTokenInMemory = token;
};

/* ─────────────────────────────────────────────
   CSRF PROTECTION & REFRESH TOKEN QUEUES
───────────────────────────────────────────── */

export let csrfTokenInMemory: string | null = null;

let csrfPromise: Promise<void> | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

export const fetchCsrfToken = async (retries = 2, delayMs = 800) => {
  // If a fetch is already in-flight, reuse it — prevents duplicate parallel requests.
  if (csrfPromise) return csrfPromise;

  csrfPromise = (async () => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await axios.get(`${BASE_URL}/csrf-token`, {
          withCredentials: true,
          timeout: 8000,
        });
        csrfTokenInMemory = res.data.csrfToken;
        return;
      } catch (err) {
        console.warn(
          `CSRF token fetch attempt ${attempt}/${retries} failed:`,
          err
        );
        if (attempt < retries) {
          await new Promise((res) => setTimeout(res, delayMs * attempt));
        } else {
          console.error("Failed to fetch CSRF token after all retries.");
        }
      }
    }
  })();

  // Reset the promise reference only AFTER it resolves/rejects so that concurrent
  // callers who check `if (csrfPromise)` after we set it will all await the same promise.
  // Previously the .finally() reset csrfPromise = null before the outer await chain
  // completed, creating a window where a second fetchCsrfToken() would start a duplicate request.
  const p = csrfPromise;
  p.finally(() => {
    if (csrfPromise === p) csrfPromise = null;
  });
  return p;
};

api.interceptors.request.use(async (config) => {
  // Await global CSRF readiness before ANY request fires
  if (csrfPromise) await csrfPromise;

  // PRIMARY AUTH: Send Authorization: Bearer header — works on ALL browsers/devices.
  // This eliminates reliance on cookies which are blocked by Samsung Browser, Safari ITP, etc.
  if (accessTokenInMemory) {
    config.headers["Authorization"] = `Bearer ${accessTokenInMemory}`;
  }

  // CSRF token for state-changing requests
  if (
    csrfTokenInMemory &&
    ["post", "put", "patch", "delete"].includes(
      config.method?.toLowerCase() || ""
    )
  ) {
    config.headers["CSRF-Token"] = csrfTokenInMemory;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 1. Handle CSRF Expiration (403)
    const errMsg = String(
      error.response?.data?.message || error.response?.data?.error || ""
    ).toLowerCase();

    if (
      error.response?.status === 403 &&
      errMsg.includes("csrf") &&
      !originalRequest._csrfRetried
    ) {
      originalRequest._csrfRetried = true;

      console.warn(
        "CSRF Token Invalid/Expired. Fetching fresh token and retrying request..."
      );
      await fetchCsrfToken();

      if (csrfTokenInMemory) {
        originalRequest.headers["CSRF-Token"] = csrfTokenInMemory;
      }
      return api(originalRequest); // Retry instantly
    }

    // 2. Handle Access Token Expiration (401)
    if (
      error.response?.status === 401 &&
      !originalRequest._authRetried &&
      originalRequest.url !== "/auth/refresh" &&
      originalRequest.url !== "/auth/login" &&
      originalRequest.url !== "/auth/logout"
    ) {
      if (isRefreshing) {
        // Queue the request until the token refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._authRetried = true;
      isRefreshing = true;

      try {
        console.warn("Access Token Expired. Refreshing session...");
        // Use raw axios (not the `api` instance) for the refresh call to avoid re-triggering
        // this interceptor, which would cause an infinite loop. withCredentials ensures
        // the refreshToken HttpOnly cookie is sent with the request.
        const refreshRes = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          {
            withCredentials: true,
            timeout: 10000,
          }
        );

        // Store new accessToken from response body
        if (refreshRes.data?.accessToken) {
          setAccessToken(refreshRes.data.accessToken);
          originalRequest.headers[
            "Authorization"
          ] = `Bearer ${refreshRes.data.accessToken}`;
        }

        // Fetch refreshed CSRF token
        await fetchCsrfToken();
        if (csrfTokenInMemory) {
          originalRequest.headers["CSRF-Token"] = csrfTokenInMemory;
        }

        processQueue(null, "Refreshed");
        return api(originalRequest);
      } catch (refreshError) {
        setAccessToken(null); // clear stale token
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/* ─────────────────────────────────────────────
   GENERIC HELPERS
───────────────────────────────────────────── */

export function postMultipart(path: string, formData: FormData) {
  return api.post(path, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

/* ─────────────────────────────────────────────
   THOUGHTS
───────────────────────────────────────────── */

export function getThoughts(params?: {
  cursor?: string;
  feed?: "for-you" | "following";
  limit?: number;
}) {
  return api.get("/thoughts", { params });
}

export function getThought(id: string) {
  return api.get(`/thoughts/${id}`);
}

export function updateThought(id: string, data: { text: string }) {
  return api.put(`/thoughts/${id}`, data);
}

export function deleteThought(id: string) {
  return api.delete(`/thoughts/${id}`);
}

export function getMyThoughts() {
  return api.get("/thoughts/me");
}

/* ─────────────────────────────────────────────
   USER (BY USERNAME — preferred)
───────────────────────────────────────────── */

export function getUserProfile(username: string) {
  return api.get(`/users/username/${username}`);
}

export const getUserProfileByUsername = getUserProfile;

export function getUserThoughts(username: string, params?: any) {
  return api.get(`/users/username/${username}/thoughts`, { params });
}

export const getThoughtsByUsername = getUserThoughts;

export function getFollowers(username: string) {
  return api.get(`/users/username/${username}/followers`);
}

export function getFollowing(username: string) {
  return api.get(`/users/username/${username}/following`);
}

/* ─────────────────────────────────────────────
   USER (BY ID — internal use only)
───────────────────────────────────────────── */

export function getUserById(id: string) {
  return api.get(`/users/${id}`);
}

export function followUser(id: string) {
  return api.post(`/users/${id}/follow`);
}

export function unfollowUser(id: string) {
  return api.post(`/users/${id}/unfollow`);
}

export function isFollowing(id: string) {
  return api.get(`/users/${id}/is-following`);
}

export function checkIsFollowing(id: string) {
  return api.get(`/users/${id}/is-following`);
}

/* ─────────────────────────────────────────────
   PROFILE UPDATE
───────────────────────────────────────────── */

export function updateProfile(data: FormData) {
  return api.patch("/users/me", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

/* ─────────────────────────────────────────────
   LIKES
─────────────────────────────────────────────────── */

export function toggleLike(thoughtId: string) {
  return api.post(`/likes/toggle/${thoughtId}`);
}

export function getLikeStatus(thoughtId: string) {
  return api.get(`/likes/status/${thoughtId}`);
}

/* ─────────────────────────────────────────────
   COMMENTS
─────────────────────────────────────────────────── */

export function getComments(thoughtId: string) {
  return api.get(`/thoughts/${thoughtId}/comments`);
}

export function addComment(thoughtId: string, text: string) {
  return api.post(`/thoughts/${thoughtId}/comments`, { text });
}

export function replyToComment(
  thoughtId: string,
  commentId: string,
  text: string
) {
  return api.post(`/thoughts/${thoughtId}/comments/${commentId}/reply`, {
    text,
  });
}

export function editComment(commentId: string, text: string) {
  return api.put(`/comments/${commentId}`, { text });
}

export function deleteComment(commentId: string) {
  return api.delete(`/comments/${commentId}`);
}

// ─────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────

export function getNotifications(params?: { limit?: number; cursor?: string }) {
  return api.get("/notifications", { params });
}

export function getUnreadNotificationCount() {
  return api.get("/notifications/unread-count");
}

export function markNotificationRead(id: string) {
  return api.patch(`/notifications/${id}/read`);
}

export function markAllNotificationsRead() {
  return api.patch("/notifications/read-all");
}

export function deleteNotification(id: string) {
  return api.delete(`/notifications/${id}`);
}

export type LotusMode = "friendly" | "professional" | "creative";

export type LotusThoughtAction =
  | "ask"
  | "explain"
  | "comment"
  | "reply"
  | "summarize";

export type LotusConversation = {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type LotusMessage = {
  _id?: string;
  role: "user" | "assistant";
  content: string;
  status?: "pending" | "complete" | "stopped" | "failed";
  thoughtId?: string | null;
  thoughtAction?: LotusThoughtAction | null;
  createdAt?: string;
};

type LotusStreamResult = {
  reply: string;
  messageId?: string;
  userMessageId?: string;
  title?: string;
  updatedAt?: string;
  status?: string;
};

const readLotusEventStream = async (
  stream: ReadableStream<Uint8Array>,
  onDelta?: (text: string) => void
): Promise<LotusStreamResult> => {
  let reply = "";
  let pending = "";
  let streamError: string | null = null;
  let completion: Omit<LotusStreamResult, "reply"> = {};

  const processEvent = (frame: string) => {
    let eventName = "message";
    const dataLines: string[] = [];

    for (const line of frame.split("\n")) {
      if (line.startsWith("event:")) eventName = line.slice(6).trim();
      if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
    }

    if (!dataLines.length) return;
    let data: {
      text?: string;
      message?: string;
      messageId?: string;
      userMessageId?: string;
      title?: string;
      updatedAt?: string;
      status?: string;
    };
    try {
      data = JSON.parse(dataLines.join("\n")) as {
        text?: string;
        message?: string;
        messageId?: string;
        userMessageId?: string;
        title?: string;
        updatedAt?: string;
        status?: string;
      };
    } catch {
      streamError = "Lotus returned an unreadable response. Please try again.";
      return;
    }

    if (eventName === "delta" && typeof data.text === "string") {
      reply += data.text;
      onDelta?.(data.text);
    } else if (eventName === "error") {
      streamError = data.message || "Lotus's response was interrupted. Please try again.";
    } else if (eventName === "done") {
      completion = data;
    }
  };

  const processText = (text: string) => {
    pending = (pending + text).replace(/\r\n/g, "\n");
    let boundary = pending.indexOf("\n\n");
    while (boundary !== -1) {
      processEvent(pending.slice(0, boundary));
      pending = pending.slice(boundary + 2);
      boundary = pending.indexOf("\n\n");
    }
  };

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let done = false;
  while (!done) {
    const chunk = await reader.read();
    done = chunk.done;
    processText(decoder.decode(chunk.value, { stream: !done }));
  }
  if (pending.trim()) processEvent(pending);
  if (streamError) throw new Error(streamError);
  if (!reply.trim()) throw new Error("Lotus couldn't generate a text reply. Please try again.");

  return { ...completion, reply: reply.trim() };
};

const postLotusStream = async (
  path: string,
  body: unknown,
  signal?: AbortSignal
) => {
  try {
    return await api.post<ReadableStream<Uint8Array>>(path, body, {
      adapter: "fetch",
      responseType: "stream",
      signal,
    });
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      error.response?.data instanceof ReadableStream
    ) {
      const responseText = await new Response(error.response.data).text();
      let responseBody: unknown;
      try {
        responseBody = JSON.parse(responseText);
      } catch {
        responseBody = null;
      }
      if (
        responseBody &&
        typeof responseBody === "object" &&
        "message" in responseBody &&
        typeof responseBody.message === "string"
      ) {
        throw new Error(responseBody.message);
      }
    }
    throw error;
  }
};

export async function sendLotusMessage(
  conversationId: string,
  content: string,
  clientMessageId: string,
  onDelta?: (text: string) => void,
  signal?: AbortSignal,
  thoughtContext?: { thoughtId: string; thoughtAction: LotusThoughtAction }
) {
  const response = await postLotusStream(
    `/lotus/conversations/${conversationId}/messages`,
    {
      content,
      clientMessageId,
      ...thoughtContext,
    },
    signal
  );
  if (!response.data?.getReader) {
    throw new Error("Lotus returned an unreadable response. Please try again.");
  }
  return readLotusEventStream(response.data, onDelta);
}

export const getLotusConversations = async () => {
  const response = await api.get<{ conversations: LotusConversation[] }>(
    "/lotus/conversations"
  );
  return response.data.conversations;
};

export const createLotusConversation = async () => {
  const response = await api.post<{ conversation: LotusConversation }>(
    "/lotus/conversations"
  );
  return response.data.conversation;
};

export const getLotusMessages = async (conversationId: string) => {
  const response = await api.get<{ messages: LotusMessage[] }>(
    `/lotus/conversations/${conversationId}/messages`
  );
  return response.data.messages;
};

export const renameLotusConversation = async (conversationId: string, title: string) => {
  const response = await api.patch<{ conversation: LotusConversation }>(
    `/lotus/conversations/${conversationId}`,
    { title }
  );
  return response.data.conversation;
};

export const deleteLotusConversation = (conversationId: string) =>
  api.delete(`/lotus/conversations/${conversationId}`);

export const getLotusMode = async () => {
  const response = await api.get<{ mode: LotusMode }>("/lotus/preferences");
  return response.data.mode;
};

export const setLotusMode = async (mode: LotusMode) => {
  const response = await api.patch<{ mode: LotusMode }>("/lotus/preferences", {
    mode,
  });
  return response.data.mode;
};

export const regenerateLotusMessage = async (
  conversationId: string,
  messageId: string,
  onDelta?: (text: string) => void,
  signal?: AbortSignal
) => {
  const response = await postLotusStream(
    `/lotus/conversations/${conversationId}/regenerate`,
    { messageId },
    signal
  );
  if (!response.data?.getReader) {
    throw new Error("Lotus returned an unreadable response. Please try again.");
  }
  return readLotusEventStream(response.data, onDelta);
};

export default api;

// ─────────────────────────────────
// SEARCH
// ─────────────────────────────────

export function searchUsers(query: string, signal?: AbortSignal) {
  return api.get("/users/search", {
    params: { q: query },
    signal,
  });
}
