import api, { createServiceError } from "./api";

async function getOrThrow(request, fallbackMessage) {
  try {
    return await request();
  } catch (error) {
    throw createServiceError(error, fallbackMessage);
  }
}

export const getTickets = () =>
  getOrThrow(() => api.get("/tickets"), "Unable to load tickets.");

export const getMyTickets = () =>
  getOrThrow(() => api.get("/tickets"), "Unable to load your tickets.");

export const getManagedTickets = () =>
  getOrThrow(() => api.get("/tickets"), "Unable to load tickets.");

export const createTicket = (data) =>
  getOrThrow(() => api.post("/tickets", data), "Unable to create ticket.");

export const getTicketSuggestion = (description) =>
  getOrThrow(
    () => api.post("/tickets/suggestions", { description }),
    "Unable to generate ticket suggestion.",
  );

export const updateStatus = (id, status) =>
  getOrThrow(
    () => api.put(`/tickets/${id}/status`, null, { params: { status } }),
    "Unable to update ticket status.",
  );

export const addUpdate = (id, data) =>
  getOrThrow(
    () => api.post(`/tickets/${id}/updates`, data),
    "Unable to add update.",
  );

export const uploadFile = (id, file) => {
  const formData = new FormData();
  formData.append("file", file);

  return getOrThrow(
    () => api.post(`/tickets/${id}/attachments`, formData),
    "Unable to upload attachment.",
  );
};
