import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
});

/* ─────────────────────────────────────────────
   AUTH
───────────────────────────────────────────── */

export function setAuthToken(token?: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

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

export default api;
