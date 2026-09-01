// ─── High Performance Client Cache for NeuralConsult ──────────
// Keeps idempotent GET requests cached in-memory for instant navigation (0ms)
// Automatically invalidates or bypasses when mutations happen.

const cache = new Map();
const DEFAULT_TTL_MS = 60 * 1000; // 60 seconds default

const CACHE_CONFIG = {
  "/api/me": 120 * 1000,                    // 2 minutes
  "/api/doctors": 120 * 1000,               // 2 minutes
  "/api/doctors/profile/me": 60 * 1000,     // 1 minute
  "/api/sevrage-plan/current": 60 * 1000,   // 1 minute
  "/api/daily-reports": 45 * 1000,          // 45 seconds
  "/api/tests/had": 60 * 1000,              // 1 minute
  "/api/tests/fagerstrom": 60 * 1000,       // 1 minute
  "/api/clinical-notes": 60 * 1000,         // 1 minute
  "/api/onboarding": 120 * 1000,            // 2 minutes
  "/api/notifications/summary": 15 * 1000   // 15 seconds
};

export const getCacheKey = (url, params) => {
  if (!params || Object.keys(params).length === 0) return url;
  return `${url}?${new URLSearchParams(params).toString()}`;
};

export const getCachedData = (key) => {
  const item = cache.get(key);
  if (!item) return null;
  const isExpired = Date.now() - item.timestamp > item.ttl;
  if (isExpired) {
    cache.delete(key);
    return null;
  }
  return item.data;
};

export const setCachedData = (key, data, customTtl) => {
  const matchingPattern = Object.keys(CACHE_CONFIG).find((pat) => key.startsWith(pat));
  const ttl = customTtl || (matchingPattern ? CACHE_CONFIG[matchingPattern] : DEFAULT_TTL_MS);
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
};

export const invalidateCache = (pattern) => {
  if (!pattern) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
};

export default {
  get: getCachedData,
  set: setCachedData,
  invalidate: invalidateCache
};
