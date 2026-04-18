import api, { requestWithFallback, createServiceError } from "./api";
import { mockTickets } from "../utils/mockData";

export async function getMyTickets() {
  return requestWithFallback(
    () => api.get("/tickets/my"),
    () => [...mockTickets],
    "Unable to load tickets.",
  );
}

export async function getManagedTickets() {
  return requestWithFallback(
    () => api.get("/admin/tickets"),
    () => [...mockTickets],
    "Unable to load managed tickets.",
  );
}

export async function getAssignableTechnicians() {
  try {
    const { data } = await api.get("/admin/tickets/assignable-technicians");
    return data;
  } catch (error) {
    throw createServiceError(error, "Unable to load technicians.");
  }
}

export async function assignTicketOnDesk(ticketId, assigneeTechnicianId) {
  try {
    const { data } = await api.patch(`/admin/tickets/${ticketId}/assignment`, { assigneeTechnicianId });
    return data;
  } catch (error) {
    throw createServiceError(error, "Unable to assign ticket.");
  }
}

export async function createCampusTicket(payload) {
  try {
    const { data } = await api.post("/tickets", payload);
    return data;
  } catch (error) {
    throw createServiceError(error, "Unable to submit ticket.");
  }
}
