import api, { createServiceError } from "./api";

/** Spring {@link com.example.app.dto.ApiResponse} wrapper */
function unwrapData(response) {
  const body = response?.data;
  if (body && typeof body === "object" && "data" in body) {
    return body.data;
  }
  return body;
}

export async function getMyBookings() {
  try {
    const res = await api.get("/bookings/me");
    const data = unwrapData(res);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw createServiceError(error, "Unable to load your bookings.");
  }
}

export async function createBooking(payload) {
  try {
    const res = await api.post("/bookings", payload);
    return unwrapData(res);
  } catch (error) {
    throw createServiceError(error, "Unable to create booking.");
  }
}

export async function getPendingBookings() {
  try {
    const res = await api.get("/bookings/pending");
    const data = unwrapData(res);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw createServiceError(error, "Unable to load pending approvals.");
  }
}

export async function getAllBookingsAdmin(params = {}) {
  const clean = {
    page: params.page ?? 0,
    size: params.size ?? 20,
  };
  if (params.resourceId != null && params.resourceId !== "") {
    clean.resourceId = params.resourceId;
  }
  if (params.userId?.trim()) {
    clean.userId = params.userId.trim();
  }
  if (params.date) {
    clean.date = params.date;
  }
  try {
    const res = await api.get("/bookings", { params: clean });
    const page = unwrapData(res);
    return page;
  } catch (error) {
    throw createServiceError(error, "Unable to load bookings.");
  }
}

export async function approveBooking(bookingId) {
  try {
    const res = await api.put(`/bookings/${bookingId}/approve`);
    return unwrapData(res);
  } catch (error) {
    throw createServiceError(error, "Unable to approve booking.");
  }
}

export async function rejectBooking(bookingId, reason) {
  try {
    const res = await api.put(`/bookings/${bookingId}/reject`, { reason });
    return unwrapData(res);
  } catch (error) {
    throw createServiceError(error, "Unable to reject booking.");
  }
}

export async function cancelBooking(bookingId) {
  try {
    const res = await api.put(`/bookings/${bookingId}/cancel`);
    return unwrapData(res);
  } catch (error) {
    throw createServiceError(error, "Unable to cancel booking.");
  }
}

export async function checkResourceAvailability(resourceId, startIso, endIso) {
  try {
    const res = await api.get("/bookings/check", {
      params: { resourceId, start: startIso, end: endIso },
    });
    return unwrapData(res);
  } catch (error) {
    throw createServiceError(error, "Unable to check availability.");
  }
}
