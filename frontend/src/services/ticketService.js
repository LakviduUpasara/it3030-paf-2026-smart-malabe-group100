import api, { createServiceError } from "./api";

export async function getMyTickets() {
  try {
    const { data } = await api.get("/tickets/my");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw createServiceError(error, "Unable to load tickets.");
  }
}

export async function getManagedTickets() {
  try {
    const { data } = await api.get("/admin/tickets");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw createServiceError(error, "Unable to load managed tickets.");
  }
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
