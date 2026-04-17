import axios from "axios";
import { readStorageValue, STORAGE_KEYS } from "../utils/storage";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:18080/api/v1",
  timeout: 8000,
});

function readStoredSessionToken() {
  try {
    // AuthContext persists session token separately from the user profile.
    const sessionToken = readStorageValue(STORAGE_KEYS.SESSION);
    if (typeof sessionToken === "string" && sessionToken.trim()) {
      return sessionToken.trim();
    }

    // Backward-compatibility fallback for older local storage layouts.
    const legacyUser = readStorageValue(STORAGE_KEYS.USER);
    return legacyUser?.token || legacyUser?.user?.token || null;
  } catch {
    return null;
  }
}

api.interceptors.request.use((config) => {
  const token = readStoredSessionToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function createServiceError(error, fallbackMessage) {
  const responseMessage = error?.response?.data?.message;
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
