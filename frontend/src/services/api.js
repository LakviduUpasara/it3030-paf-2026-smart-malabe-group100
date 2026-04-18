import axios from 'axios';
import { clearAllAuthStorage, readStorageValue, STORAGE_KEYS } from '../utils/storage';

const DEFAULT_API_BASE = "http://127.0.0.1:18080/api/v1";

/** Ensures the path ends with /api/v1 (fixes VITE_API_BASE_URL=http://host:port with no suffix). */
function ensureApiV1Suffix(url) {
  const u = url.replace(/\/+$/, "");
  if (/\/api\/v1$/i.test(u)) {
    return u;
  }
  return `${u}/api/v1`;
}

/**
 * Resolves the backend REST base URL.
 * - Relative "/api/v1" + Vite proxy = same origin, no CORS preflight (recommended in dev).
 * - Absolute URLs must end with /api/v1 or it is appended (common misconfiguration).
 */
function resolveApiBaseUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL;
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed) {
    return DEFAULT_API_BASE;
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return ensureApiV1Suffix(trimmed);
  }
  if (trimmed.startsWith("/")) {
    if (typeof window !== "undefined" && window.location?.origin) {
      return ensureApiV1Suffix(`${window.location.origin}${trimmed}`);
    }
    return ensureApiV1Suffix(`${DEFAULT_API_BASE.replace(/\/api\/v1$/i, "")}${trimmed}`);
  }
  return DEFAULT_API_BASE;
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = readStorageValue(STORAGE_KEYS.SESSION);
  if (typeof token === 'string' && token.trim()) {
    config.headers.Authorization = `Bearer ${token.trim()}`;
  }
  return config;
});

/**
 * 401 on a protected call with a stored session usually means the account was removed or the token revoked.
 * Do not clear on public auth endpoints where 401 means "wrong password" only — those still benefit from clearing stale tokens.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const reqUrl = String(error.config?.url || "");
    if (status !== 401) {
      return Promise.reject(error);
    }
    const sessionVal = readStorageValue(STORAGE_KEYS.SESSION);
    const hadSession = typeof sessionVal === "string" && sessionVal.trim();
    if (!hadSession) {
      return Promise.reject(error);
    }
    const isPublicAuth =
      /\/auth\/(login|register|google|apple|dev-login|verify-2fa|resend-email-otp|security-hints)(\?|$)/.test(reqUrl)
      || /\/auth\/signup-requests\//.test(reqUrl)
      || /\/auth\/first-login\//.test(reqUrl);
    if (isPublicAuth) {
      return Promise.reject(error);
    }
    const message =
      error.response?.data?.message
      || "Your session is no longer valid. You may have been signed out because your account was removed.";
    clearAllAuthStorage();
    window.dispatchEvent(
      new CustomEvent("smart-campus:session-invalid", {
        detail: { message },
      }),
    );
    return Promise.reject(error);
  },
);

/**
 * Builds an Error from an axios failure, preferring server message when present.
 */
export function createServiceError(error, fallbackMessage) {
  const data = error?.response?.data;
  let responseMessage = data?.message;
  if (data?.errors && typeof data.errors === "object" && !Array.isArray(data.errors)) {
    const parts = Object.entries(data.errors).map(([k, v]) => `${k}: ${v}`);
    if (parts.length) {
      const base = responseMessage && responseMessage !== "Validation failed" ? `${responseMessage} ` : "";
      responseMessage = `${base}${parts.join("; ")}`.trim();
    }
  }
  const isNetworkError = !error?.response;
  const networkHint =
    error?.code === "ECONNREFUSED" || error?.code === "ECONNRESET"
      ? " Cannot reach the API. Start the backend (port 18080) or check your proxy/VITE_API_BASE_URL."
      : "";
  const message =
    responseMessage ||
    (isNetworkError ? `${error?.message || "Network error"}${networkHint}` : null) ||
    error?.message ||
    fallbackMessage;
  const normalizedError = new Error(message);

  normalizedError.status = error?.response?.status ?? (isNetworkError ? 0 : 500);
  normalizedError.isNetworkError = isNetworkError;

  return normalizedError;
}

export const bookingAPI = {
  createBooking: (data) => api.post('/bookings', data),
  getAllBookings: (params) => api.get('/bookings', { params }),
  getBookingsByUser: (userId) => api.get(`/bookings/user/${userId}`),
  approveBooking: (bookingId) => api.put(`/bookings/${bookingId}/approve`),
  rejectBooking: (bookingId) => api.put(`/bookings/${bookingId}/reject`),
  cancelBooking: (bookingId) => api.put(`/bookings/${bookingId}/cancel`),
  checkAvailability: (resourceId, start, end) =>
    api.get(`/resources/${resourceId}/availability`, { params: { start, end } }),
  /** Same as checkAvailability (BookingService#checkAvailability). */
  checkAvailabilityBookingsPath: (resourceId, start, end) =>
    api.get('/bookings/check', { params: { resourceId, start, end } }),
};

export const messageAPI = {
  getAllMessages: () => api.get("/messages"),
  createMessage: (data) => api.post("/messages", data),
};

export const healthAPI = {
  check: () => api.get("../health"),
};

export default api;
