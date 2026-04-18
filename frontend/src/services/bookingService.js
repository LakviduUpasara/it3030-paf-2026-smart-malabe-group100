import api, { requestWithFallback, createServiceError } from "./api";
import { buildCreatedBooking, mockBookings, mockPendingBookings } from "../utils/mockData";

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
    facility: `Resource #${booking.resourceId}`,
    requestedBy: `User #${booking.userId}`,
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
    return unwrapBookingPayload(response);
  } catch (error) {
    if (!error?.response || error.response.status === 404) {
      return buildCreatedBooking(payload);
    }

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
    if (!error?.response || error.response.status === 404) {
      return [...mockPendingBookings];
    }
    throw createServiceError(error, "Unable to load pending approvals.");
  }
}

export async function approveBooking(bookingId) {
  try {
    const response = await api.put(`/bookings/${bookingId}/approve`);
    return unwrapBookingPayload(response);
  } catch (error) {
    if (!error?.response || error.response.status === 404) {
      return { success: true, bookingId, status: "Approved" };
    }

    throw createServiceError(error, "Unable to approve booking.");
  }
}

export async function rejectBooking(bookingId, reason = "Rejected by administrator.") {
  try {
    const response = await api.put(`/bookings/${bookingId}/reject`, { reason });
    return unwrapBookingPayload(response);
  } catch (error) {
    if (!error?.response || error.response.status === 404) {
      return { success: true, bookingId, status: "Rejected" };
    }

    throw createServiceError(error, "Unable to reject booking.");
  }
}
