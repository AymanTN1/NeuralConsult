// ─── Warm-up / Keep-Alive Service for Cloud Backend ──────────
// Ensures backend cold starts on platforms like Render / Railway / Fly.io are handled gracefully

import api from "./api";

let warmedUp = false;

export const warmUpBackend = async () => {
  if (warmedUp) return;
  try {
    warmedUp = true;
    await api.get("/actuator/health", { skipCache: true, timeout: 5000 }).catch(() => null);
  } catch (err) {
    // silently catch warm-up errors
  }
};

export default {
  warmUpBackend
};
