import api, { requestWithFallback, createServiceError } from "./api";
import { buildCreatedBooking, mockBookings, mockPendingBookings } from "../utils/mockData";

export async function getMyBookings() {
  return requestWithFallback(
    () => api.get("/bookings/my"),
    () => [...mockBookings],
    "Unable to load bookings.",
  );
}

export async function createBooking(payload) {
  try {
    const response = await api.post("/bookings", payload);
    return response.data;
  } catch (error) {
    if (!error?.response || error.response.status === 404) {
      return buildCreatedBooking(payload);
    }

    throw createServiceError(error, "Unable to create booking.");
  }
}

export async function getPendingBookings() {
  return requestWithFallback(
    () => api.get("/bookings/pending"),
    () => [...mockPendingBookings],
    "Unable to load pending approvals.",
  );
}

export async function approveBooking(bookingId) {
  try {
    const response = await api.patch(`/bookings/${bookingId}/approve`);
    return response.data;
  } catch (error) {
    if (!error?.response || error.response.status === 404) {
      return { success: true, bookingId, status: "Approved" };
    }

    throw createServiceError(error, "Unable to approve booking.");
  }
}

export async function rejectBooking(bookingId) {
  try {
    const response = await api.patch(`/bookings/${bookingId}/reject`);
    return response.data;
  } catch (error) {
    if (!error?.response || error.response.status === 404) {
      return { success: true, bookingId, status: "Rejected" };
    }

    throw createServiceError(error, "Unable to reject booking.");
  }
}

