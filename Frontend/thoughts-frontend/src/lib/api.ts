import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

/* ─────────────────────────────────────────────
   CSRF PROTECTION & REFRESH TOKEN QUEUES (Priority 4 & 5)
───────────────────────────────────────────── */

// Secure in-memory token storage (prevents XSS extraction from localStorage)
export let csrfTokenInMemory: string | null = null;

// Promise locks and Queues
let csrfPromise: Promise<void> | null = null;
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

export const fetchCsrfToken = async () => {
  if (csrfPromise) return csrfPromise;
  
  csrfPromise = (async () => {
    try {
      // Intentionally use base axios to avoid hitting interceptors if not needed
      const res = await axios.get(`${BASE_URL}/csrf-token`, { withCredentials: true });
      csrfTokenInMemory = res.data.csrfToken;
    } catch (err) {
      console.error("Failed to fetch CSRF token on boot", err);
    } finally {
      csrfPromise = null;
    }
  })();
  
  return csrfPromise;
};

api.interceptors.request.use(async (config) => {
  // Await global CSRF readiness before ANY request fires (eliminates Race Conditions)
  if (csrfPromise) await csrfPromise;

  // csurf natively looks for CSRF-Token, XSRF-Token, X-CSRF-Token
  if (csrfTokenInMemory && ["post", "put", "patch", "delete"].includes(config.method?.toLowerCase() || "")) {
    config.headers["CSRF-Token"] = csrfTokenInMemory;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // 1. Handle CSRF Expiration (403)
    const errText = String(error.response?.data || "").toLowerCase() + String(error.response?.data?.message || "").toLowerCase();
    
    if (error.response?.status === 403 && errText.includes("csrf") && !originalRequest._csrfRetried) {
      originalRequest._csrfRetried = true;
      
      console.warn("CSRF Token Invalid/Expired. Fetching fresh token and retrying request...");
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
      originalRequest.url !== '/auth/refresh' && 
      originalRequest.url !== '/auth/login' && 
      originalRequest.url !== '/auth/logout'
    ) {
      if (isRefreshing) {
        // Queue the request until the token refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest)).catch(err => Promise.reject(err));
      }

      originalRequest._authRetried = true;
      isRefreshing = true;

      try {
        console.warn("Access Token Expired. Refreshing session...");
        await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        
        // Backend destroys the old _csrf token during auth/refresh rotation. Fetch a new one instantly.
        await fetchCsrfToken();
        if (csrfTokenInMemory) {
           originalRequest.headers["CSRF-Token"] = csrfTokenInMemory;
        }

        processQueue(null, "Refreshed");
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh token died / theft detected: redirect to login or clear state realistically
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

export function getThoughts(params?: any) {
  return api.get("/thoughts", { params });
}

export function getThought(id: string) {
  return api.get(`/thoughts/${id}`);
}

export function updateThought(id: string, data: any) {
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

export function replyToComment(thoughtId: string, commentId: string, text: string) {
  return api.post(`/thoughts/${thoughtId}/comments/${commentId}/reply`, { text });
}

export function editComment(commentId: string, text: string) {
  return api.put(`/comments/${commentId}`, { text });
}

export function deleteComment(commentId: string) {
  return api.delete(`/comments/${commentId}`);
}

export default api;
