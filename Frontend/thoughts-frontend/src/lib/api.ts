import axios from "axios";

const BASE = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: BASE,
});

export function setAuthToken(token?: string | null) {
  if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete api.defaults.headers.common["Authorization"];
}

export function postMultipart(path: string, formData: FormData) {
  return api.post(path, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export default api;

// Convenience wrappers
export function getThoughts(params?: any) {
  return api.get("/thoughts", { params });
}

export function getThought(id: string) {
  return api.get(`/thoughts/${id}`);
}

export function deleteThought(id: string) {
  return api.delete(`/thoughts/${id}`);
}

export function updateThought(id: string, data: any) {
  return api.put(`/thoughts/${id}`, data);
}

export function getUserThoughts(userId: string) {
  return api.get(`/users/${userId}/thoughts`);
}

export function getMyThoughts() {
  return api.get("/thoughts/me");
}

export function getUserProfile(userId: string) {
  return api.get(`/users/${userId}`);
}

export function updateProfile(data: any) {
  return api.patch("/users/me", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export function getFollowers(username: string) {
  return api.get(`/users/${username}/followers`);
}
