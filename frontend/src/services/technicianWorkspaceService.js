import api, { createServiceError } from "./api";

export async function listTechnicianTickets() {
  try {
    const { data } = await api.get("/technician/tickets");
    return data;
  } catch (error) {
    throw createServiceError(error, "Unable to load assigned tickets.");
  }
}

export async function getTechnicianTicket(ticketId) {
  try {
    const { data } = await api.get(`/technician/tickets/${ticketId}`);
    return data;
  } catch (error) {
    throw createServiceError(error, "Unable to load ticket.");
  }
}

export async function patchTechnicianTicketStatus(ticketId, status) {
  try {
    const { data } = await api.patch(`/technician/tickets/${ticketId}/status`, { status });
    return data;
  } catch (error) {
    throw createServiceError(error, "Unable to update status.");
  }
}

export async function addTechnicianProgressNote(ticketId, content) {
  try {
    const { data } = await api.post(`/technician/tickets/${ticketId}/progress-notes`, { content });
    return data;
  } catch (error) {
    throw createServiceError(error, "Unable to add progress update.");
  }
}

export async function patchTechnicianResolutionNotes(ticketId, resolutionNotes) {
  try {
    const { data } = await api.patch(`/technician/tickets/${ticketId}/resolution-notes`, {
      resolutionNotes,
    });
    return data;
  } catch (error) {
    throw createServiceError(error, "Unable to save resolution notes.");
  }
}

export async function resolveTechnicianTicket(ticketId, resolutionNotes) {
  try {
    const { data } = await api.post(`/technician/tickets/${ticketId}/actions/resolve`, {
      resolutionNotes: resolutionNotes?.trim() ? resolutionNotes.trim() : undefined,
    });
    return data;
  } catch (error) {
    throw createServiceError(error, "Unable to resolve ticket.");
  }
}

export async function getTechnicianNotificationSummary() {
  try {
    const { data } = await api.get("/technician/notifications");
    return data;
  } catch (error) {
    throw createServiceError(error, "Unable to load technician alerts.");
  }
}

export async function markTechnicianNotificationsRead(feedItemIds) {
  try {
    await api.post("/technician/notifications/mark-read", { feedItemIds });
  } catch (error) {
    throw createServiceError(error, "Unable to mark notifications as read.");
  }
}
