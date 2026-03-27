import axios from "axios";

const API_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// automatically add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const register = (email, password) =>
  api.post("/users/register", { email, password });

export const login = (email, password) =>
  api.post("/users/login", { email, password });

export const getMe = () => api.get("/users/me");

// Preferences
export const getPreferences = () => api.get("/users/preferences");

export const addPreference = (topic) =>
  api.post("/users/preferences", { topic });

export const deletePreference = (topic) =>
  api.delete(`/users/preferences/${topic}`);

// Publications

export const getRecentPublications = (limit = 10, skip = 0, topics = []) => {
  const topicsParam = topics.length > 0 ? `&topics=${topics.join(",")}` : "";
  return api.get(
    `/publications/recent?limit=${limit}&skip=${skip}${topicsParam}`,
  );
};

export const getPopularPublications = (limit = 10, skip = 0, topics = []) => {
  const topicsParam = topics.length > 0 ? `&topics=${topics.join(",")}` : "";
  return api.get(
    `/publications/popular?limit=${limit}&skip=${skip}${topicsParam}`,
  );
};

export const getRandomPublications = (count = 5, topics = []) => {
  const topicsParam = topics.length > 0 ? `&topics=${topics.join(",")}` : "";
  return api.get(`/publications/random?count=${count}${topicsParam}`);
};

export const getPublications = (skip = 0, limit = 10) =>
  api.get(`/publications/?skip=${skip}&limit=${limit}`);

export const searchPublications = (q, limit = 10) =>
  api.get(`/publications/search?q=${q}&limit=${limit}`);

export const getPublication = (id) => api.get(`/publications/${id}`);

// Bookmarks
export const addBookmark = (publication_id) =>
  api.post("/publications/bookmarks", { publication_id });

export const getMyBookmarks = () => api.get("/publications/bookmarks/me");

export const deleteBookmark = (publication_id) =>
  api.delete(`/publications/bookmarks/${publication_id}`);
