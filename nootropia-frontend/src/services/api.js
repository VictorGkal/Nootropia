import axios from "axios";

// get backend url
const API_URL = "http://localhost:8000";

// create an axios client
const api = axios.create({
  baseURL: API_URL,

  withCredentials: true, // allow to send cookies to backend

  timeout: 5000, // limit request duration time

  // specify that client is sending json to backend
  headers: {
    "Content-Type": "application/json",
  },
});

// access token saved in memory
let accessToken = null;

// setter for access token
export const setToken = (token) => {
  accessToken = token;
};

// resets access token to null
export const clearToken = () => {
  accessToken = null;
};

// fetch endpoint for refresh
export const refresh = () => api.post("/users/refresh");

// on request add token to it if there is one
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// on response receive response if no errors else deal with errors
api.interceptors.response.use(
  (response) => response, // receive respone for no errors
  async (error) => {
    // check if error is for token expiry and if the error occurs on refresh
    if (
      error.response?.status === 401 &&
      error.config?.url !== "/users/refresh" &&
      error.config?.url !== "/users/login"
    ) {
      try {
        const res = await refresh(); // get a dictionary that contains the access token and the token type
        const newAccessToken = res.data.access_token; // get token from res dictionary
        setToken(newAccessToken); // set the access token in memory

        // puts the new access token in headers
        error.config.headers.Authorization = `Bearer ${newAccessToken}`;

        // replays the same request with new headers
        return api(error.config);
      } catch {
        clearToken(); // set access token in memory to null
        localStorage.removeItem("hasSession"); // mark that session has ended
        window.location.href = "/login"; // relocate user to login page
      }
    }
    // if promise fails and there is another error send error back
    return Promise.reject(error);
  },
);

// endpoint for register
export const register = (email, password) =>
  api.post("/users/register", { email, password });

// endpoint for login
export const login = (email, password) =>
  api.post("/users/login", { email, password });

// endpoint for getting the current user
export const getMe = () => api.get("/users/me");

// endpoint for getting a user's topics
export const getPreferences = () => api.get("/users/preferences");

// endpoint for adding topics for a user
export const addPreference = (topic) =>
  api.post("/users/preferences", { topic });

// endpoint for deleting topics for a user
export const deletePreference = (topic) =>
  api.delete(`/users/preferences/${topic}`);

// endpoint for getting recent publications, limit to 10 per page
export const getRecentPublications = (limit = 10, skip = 0, topics = []) => {
  const topicsParam = topics.length > 0 ? `&topics=${topics.join(",")}` : "";
  return api.get(
    `/publications/recent?limit=${limit}&skip=${skip}${topicsParam}`,
  );
};

// endpoint for getting popular publications, limit to 10 per page
export const getPopularPublications = (limit = 10, skip = 0, topics = []) => {
  const topicsParam = topics.length > 0 ? `&topics=${topics.join(",")}` : "";
  return api.get(
    `/publications/popular?limit=${limit}&skip=${skip}${topicsParam}`,
  );
};

// endpoint for searching publications
export const searchPublications = (q, limit = 10) =>
  api.get(`/publications/search?q=${q}&limit=${limit}`);

// endpoint for adding a bookmark to a publication
export const addBookmark = (publication_id) =>
  api.post("/publications/bookmarks", { publication_id });

// endpoint for getting bookmarks of a user
export const getMyBookmarks = () => api.get("/publications/bookmarks/me");

// endpoint for deleting a bookmark from a publication
export const deleteBookmark = (publication_id) =>
  api.delete(`/publications/bookmarks/${publication_id}`);
