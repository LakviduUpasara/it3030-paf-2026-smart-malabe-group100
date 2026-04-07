import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1",
  timeout: 8000,
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
