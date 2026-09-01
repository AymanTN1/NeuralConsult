import axios from "axios";
import { getCachedData, getCacheKey, setCachedData, invalidateCache } from "./apiCache";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
  withCredentials: true
});

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

// Invalidation on mutations (POST/PUT/DELETE)
api.interceptors.response.use(
  (response) => {
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
  (error) => Promise.reject(error)
);

export default api;
