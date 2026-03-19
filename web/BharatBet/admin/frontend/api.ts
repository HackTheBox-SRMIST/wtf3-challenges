const IS_PROD =
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1";

// In Docker: frontend Nginx proxies /api and /ws to backend.
// VITE_API_URL can be set at build time if deploying externally.
const VITE_API_URL = import.meta.env.VITE_API_URL as string | undefined;

export const API_BASE = VITE_API_URL
  ? VITE_API_URL
  : IS_PROD
    ? ""           // same origin — Nginx proxy handles it
    : "http://localhost:8000";

export const WS_BASE = VITE_API_URL
  ? VITE_API_URL.replace(/^http/, "ws")
  : IS_PROD
    ? `wss://${window.location.host}`
    : "ws://localhost:8000";
