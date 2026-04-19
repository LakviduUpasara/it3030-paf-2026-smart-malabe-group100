import api, { createServiceError } from "./api";

/** Spring returns `{ success, message, data }` for booking APIs. */
function unwrapBookingPayload(response) {
  const body = response?.data;
  if (body && typeof body === "object" && "data" in body && body.data !== undefined) {
    return body.data;
  }
  return body;
}

function mapPendingForAdminUi(booking) {
  const start = booking.startTime ? new Date(booking.startTime) : null;
  const end = booking.endTime ? new Date(booking.endTime) : null;
  const statusRaw = booking.status?.name || booking.status || "PENDING";
  const statusLabel = String(statusRaw).replace(/_/g, " ");
  return {
    id: booking.id,
    facility: `Resource ${booking.resourceId}`,
    requestedBy: `User ${booking.userId}`,
    date: start ? start.toLocaleDateString() : "—",
    time:
      start && end
        ? `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        : "—",
    attendees: 0,
    status: statusLabel,
    purpose: booking.purpose || "",
  };
}

export async function checkResourceAvailability(resourceId, startIso, endIso) {
  const response = await api.get(`/resources/${resourceId}/availability`, {
    params: { start: startIso, end: endIso },
  });
  return unwrapBookingPayload(response);
}

export async function checkResourceAvailabilityBookingsCheck(resourceId, startIso, endIso) {
  const response = await api.get("/bookings/check", {
    params: { resourceId, start: startIso, end: endIso },
  });
  return unwrapBookingPayload(response);
}

export async function getMyBookings() {
  try {
    const response = await api.get("/bookings/me");
    const data = unwrapBookingPayload(response);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw createServiceError(error, "Unable to load bookings.");
  }
}

export async function createBooking(payload) {
  try {
    const response = await api.post("/bookings", payload);
    return unwrapBookingPayload(response);
  } catch (error) {
    throw createServiceError(error, "Unable to create booking.");
  }
}

export async function getPendingBookings() {
  try {
    const response = await api.get("/bookings/pending");
    const list = unwrapBookingPayload(response);
    const rows = Array.isArray(list) ? list : [];
    return rows.map(mapPendingForAdminUi);
  } catch (error) {
    throw createServiceError(error, "Unable to load pending approvals.");
  }
}

export async function approveBooking(bookingId) {
  try {
    const response = await api.put(`/bookings/${bookingId}/approve`);
    return unwrapBookingPayload(response);
  } catch (error) {
    throw createServiceError(error, "Unable to approve booking.");
  }
}

export async function rejectBooking(bookingId, reason) {
  if (!reason?.trim()) {
    throw new Error("A rejection reason is required.");
  }
  try {
    const response = await api.put(`/bookings/${bookingId}/reject`, { reason: reason.trim() });
    return unwrapBookingPayload(response);
  } catch (error) {
    throw createServiceError(error, "Unable to reject booking.");
  }
}

/** Platform admin only — Mongo-backed counts. */
export async function getAdminBookingSummary() {
  try {
    const response = await api.get("/admin/bookings/summary");
    return unwrapBookingPayload(response);
  } catch (error) {
    throw createServiceError(error, "Unable to load booking summary.");
  }
}

/**
 * @param {{ page?: number, size?: number, status?: string }} params
 * @returns {Promise<{ content: unknown[], totalElements: number, totalPages: number, number: number }>}
 */
export async function getAdminBookings(params = {}) {
  try {
    const response = await api.get("/admin/bookings", { params });
    return unwrapBookingPayload(response);
  } catch (error) {
    throw createServiceError(error, "Unable to load bookings.");
  }
}

export async function adminApproveBooking(bookingId) {
  try {
    const response = await api.patch(`/admin/bookings/${bookingId}/approve`);
    return unwrapBookingPayload(response);
  } catch (error) {
    throw createServiceError(error, "Unable to approve booking.");
  }
}

export async function adminRejectBooking(bookingId, reason) {
  if (!reason?.trim()) {
    throw new Error("A rejection reason is required.");
  }
  try {
    const response = await api.patch(`/admin/bookings/${bookingId}/reject`, { reason: reason.trim() });
    return unwrapBookingPayload(response);
  } catch (error) {
    throw createServiceError(error, "Unable to reject booking.");
  }
}
