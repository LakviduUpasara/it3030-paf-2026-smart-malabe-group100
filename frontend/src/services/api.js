import axios from "axios";
import { readStorageValue, STORAGE_KEYS } from "../utils/storage";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:18081/api/v1",
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
