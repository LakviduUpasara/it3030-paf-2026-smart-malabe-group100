import axios from "axios";
import { readStorageValue, STORAGE_KEYS } from "../utils/storage";

const DEFAULT_API_BASE = "http://127.0.0.1:18081/api/v1";

/**
 * Resolves the backend REST base URL. Relative values (e.g. "/api/v1") are joined to the
 * current origin so they work with Vite's dev proxy; absolute http(s) URLs are used as-is.
 * A missing or wrong base URL often causes "No static resource api/v1/..." from the wrong server.
 */
function resolveApiBaseUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL;
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed) {
    return DEFAULT_API_BASE;
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed.replace(/\/+$/, "");
  }
  if (trimmed.startsWith("/")) {
    if (typeof window !== "undefined" && window.location?.origin) {
      return `${window.location.origin}${trimmed}`.replace(/\/+$/, "");
    }
    return `${DEFAULT_API_BASE.replace(/\/api\/v1$/, "")}${trimmed}`.replace(/\/+$/, "");
  }
  return DEFAULT_API_BASE;
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 8000,
});

api.interceptors.request.use((config) => {
  const persistedSession = readStorageValue(STORAGE_KEYS.SESSION);
  const sessionToken =
    typeof persistedSession === "string"
      ? persistedSession
      : persistedSession?.token;

  if (sessionToken) {
    config.headers.Authorization = `Bearer ${sessionToken}`;
  }

  return config;
});

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
  const message = responseMessage || error?.message || fallbackMessage;
  const normalizedError = new Error(message);

  normalizedError.status = error?.response?.status || 500;
  normalizedError.isNetworkError = !error?.response;

  return normalizedError;
}

export async function requestWithFallback(requestFn, fallbackFactory, fallbackMessage) {
  try {
    const response = await requestFn();
    return response.data;
  } catch (error) {
    if (!error?.response || error.response.status === 404) {
      return typeof fallbackFactory === "function"
        ? fallbackFactory()
        : fallbackFactory;
    }

    throw createServiceError(error, fallbackMessage);
  }
}

export default api;
