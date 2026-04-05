import axios from "axios";

const API_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let accessToken = null;

export const setToken = (token) => {
  accessToken = token;
};
export const clearToken = () => {
  accessToken = null;
};

export const refresh = () => api.post("/users/refresh");

// add token from memory
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// auto refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isRefreshCall = error.config?.url === "/users/refresh";

    if (error.response?.status === 401 && !isRefreshCall) {
      try {
        const res = await refresh();
        const newAccessToken = res.data.access_token;
        setToken(newAccessToken);

        error.config.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(error.config);
      } catch {
        clearToken();
        localStorage.removeItem("hasSession");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

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
