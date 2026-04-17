import axios from 'axios';
import { readStorageValue, STORAGE_KEYS } from '../utils/storage';

/** Must match backend `server.port` and `/api/v1` prefix used by controllers (e.g. AuthController). */
const API_BASE_URL =
  String(import.meta.env.VITE_API_BASE_URL ?? "").trim() ||
  "http://127.0.0.1:18080/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
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
 * Builds an Error from an axios failure, preferring server message when present.
 */
export function createServiceError(error, fallbackMessage) {
  const data = error?.response?.data;
  const serverMessage =
    (data && typeof data === 'object' && (data.message || data.error)) ||
    (typeof data === 'string' ? data : null);
  const err = new Error(serverMessage || fallbackMessage);
  if (error?.response?.status != null) {
    err.status = error.response.status;
  }
  return err;
}

/**
 * Calls the API; on missing response or 404, returns fallbackFn() (mock/offline data).
 */
export async function requestWithFallback(requestFn, fallbackFn, errorMessage) {
  try {
    const response = await requestFn();
    return response.data;
  } catch (error) {
    if (!error?.response || error.response.status === 404) {
      return fallbackFn();
    }
    throw createServiceError(error, errorMessage);
  }
}

export const bookingAPI = {
  createBooking: (data) => api.post('/bookings', data),
  getAllBookings: (params) => api.get('/bookings', { params }),
  getBookingsByUser: (userId) => api.get(`/bookings/user/${userId}`),
  approveBooking: (bookingId) => api.put(`/bookings/${bookingId}/approve`),
  rejectBooking: (bookingId) => api.put(`/bookings/${bookingId}/reject`),
  cancelBooking: (bookingId) => api.put(`/bookings/${bookingId}/cancel`),
  checkAvailability: (resourceId, start, end) => 
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
