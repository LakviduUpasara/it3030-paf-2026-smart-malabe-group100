import axios from 'axios';

const API_BASE_URL = 'http://localhost:8082/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  getAllMessages: () => api.get('/v1/messages'),
  createMessage: (data) => api.post('/v1/messages', data),
};

export const healthAPI = {
  check: () => api.get('/health'),
};

function extractApiErrorMessage(error) {
  if (!error) {
    return null;
  }

  const data = error.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data.trim();
  }

  if (data && typeof data === "object") {
    if (typeof data.message === "string" && data.message.trim()) {
      return data.message.trim();
    }
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error.trim();
    }
  }

  return null;
}

/**
 * Builds an Error with a user-facing message (prefers backend body, then fallback).
 */
export function createServiceError(error, fallbackMessage) {
  const message =
    extractApiErrorMessage(error) ||
    fallbackMessage ||
    "Something went wrong.";

  const err = new Error(message);
  const status = error?.response?.status;
  if (status != null) {
    err.status = status;
  }
  return err;
}

/**
 * Calls the API; on success returns response.data. If the route is missing or unreachable,
 * runs fallback (e.g. mock data) so local dev works without a full backend.
 */
export async function requestWithFallback(request, fallback, errorMessage) {
  try {
    const res = await request();
    return res?.data;
  } catch (error) {
    const useFallback = !error?.response || error.response.status === 404;

    if (useFallback) {
      return await fallback();
    }

    throw createServiceError(error, errorMessage);
  }
}

export default api;
