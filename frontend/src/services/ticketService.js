import api, { requestWithFallback, createServiceError } from "./api";
import { mockAssignedTickets, mockTickets } from "../utils/mockData";

export async function getMyTickets() {
  return requestWithFallback(
    () => api.get("/tickets/my"),
    () => [...mockTickets],
    "Unable to load tickets.",
  );
}

export async function getManagedTickets() {
  return requestWithFallback(
    () => api.get("/tickets"),
    () => [...mockTickets],
    "Unable to load managed tickets.",
  );
}

export async function getAssignedTickets() {
  return requestWithFallback(
    () => api.get("/tickets/assigned"),
    () => [...mockAssignedTickets],
    "Unable to load assigned tickets.",
  );
}

export async function resolveTicket(ticketId) {
  try {
    const response = await api.patch(`/tickets/${ticketId}/resolve`);
    return response.data;
  } catch (error) {
    if (!error?.response || error.response.status === 404) {
      return { success: true, ticketId, status: "Resolved" };
    }

    throw createServiceError(error, "Unable to update ticket.");
  }
}

