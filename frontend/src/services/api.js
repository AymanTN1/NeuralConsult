import axios from "axios";
import { getCachedData, getCacheKey, setCachedData, invalidateCache } from "./apiCache";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" ? "" : "http://localhost:8080"),
  withCredentials: true,
  timeout: 15000
});

// Attach JWT token from localStorage to every outgoing request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("nc_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => Promise.reject(error));

// High-speed In-Memory Cache interceptor for GET requests
const originalGet = api.get;
api.get = async function (url, config = {}) {
  const key = getCacheKey(url, config.params);
  if (!config.skipCache) {
    const cached = getCachedData(key);
    if (cached !== null) {
      return Promise.resolve({ data: cached, status: 200, fromCache: true });
    }
  }

  const response = await originalGet.call(this, url, config);
  if (response && response.status === 200 && response.data) {
    setCachedData(key, response.data, config.ttl);
  }
  return response;
};

// Handle token saving and cache invalidation on mutations (POST/PUT/DELETE)
api.interceptors.response.use(
  (response) => {
    // If backend returns accessToken, persist it in localStorage
    if (response.data && response.data.accessToken && typeof window !== "undefined") {
      localStorage.setItem("nc_token", response.data.accessToken);
    }

    const method = response.config?.method?.toUpperCase();
    if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
      const url = response.config.url || "";
      if (url.includes("/auth")) {
        invalidateCache("/api/me");
      } else if (url.includes("/sevrage-plan")) {
        invalidateCache("/api/sevrage-plan");
      } else if (url.includes("/daily-reports")) {
        invalidateCache("/api/daily-reports");
      } else if (url.includes("/tests")) {
        invalidateCache("/api/tests");
      } else if (url.includes("/doctors")) {
        invalidateCache("/api/doctors");
      } else if (url.includes("/notifications")) {
        invalidateCache("/api/notifications");
      }
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("nc_token");
    }
    return Promise.reject(error);
  }
);

export default api;
