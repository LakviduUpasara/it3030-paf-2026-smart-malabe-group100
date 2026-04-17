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

export const getTicketById = (id) =>
  getOrThrow(
    () => api.get(`/tickets/${encodeURIComponent(String(id))}`),
    "Unable to load ticket.",
  );

export const assignTicketToTechnician = (ticketId, technicianUserId) =>
  getOrThrow(
    () =>
      api.post(`/tickets/${encodeURIComponent(String(ticketId))}/assign`, {
        technicianUserId,
      }),
    "Unable to assign technician.",
  );

/**
 * Loads an attachment with auth; returns a blob URL and mime type (revoke URL when done).
 */
export async function fetchAttachmentPreview(ticketId, attachmentId) {
  const tid = encodeURIComponent(String(ticketId));
  const aid = encodeURIComponent(String(attachmentId));
  const res = await api.get(`/tickets/${tid}/attachments/${aid}`, {
    responseType: "blob",
  });
  const mime =
    res.headers["content-type"] ||
    res.headers["Content-Type"] ||
    res.data?.type ||
    "";
  const url = URL.createObjectURL(res.data);
  return { url, mime: String(mime).split(";")[0].trim() };
}

export const createTicket = (data) =>
  getOrThrow(() => api.post("/tickets", data), "Unable to create ticket.");

export const updateMyTicket = (id, data) =>
  getOrThrow(() => api.patch(`/tickets/${id}`, data), "Unable to update ticket.");

export const withdrawMyTicket = (id, data) =>
  getOrThrow(() => api.post(`/tickets/${id}/withdraw`, data), "Unable to withdraw ticket.");

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
    () => api.post(`/tickets/${encodeURIComponent(String(id))}/updates`, data),
    "Unable to add update.",
  );

export const patchTicketUpdate = (ticketId, updateId, data) =>
  getOrThrow(
    () =>
      api.patch(
        `/tickets/${encodeURIComponent(String(ticketId))}/updates/${encodeURIComponent(String(updateId))}`,
        data,
      ),
    "Unable to save update.",
  );

export const deleteTicketUpdate = (ticketId, updateId) =>
  getOrThrow(
    () =>
      api.delete(
        `/tickets/${encodeURIComponent(String(ticketId))}/updates/${encodeURIComponent(String(updateId))}`,
      ),
    "Unable to delete update.",
  );

export const uploadFile = (id, file) => {
  const formData = new FormData();
  formData.append("file", file);

  return getOrThrow(
    () => api.post(`/tickets/${encodeURIComponent(String(id))}/attachments`, formData),
    "Unable to upload attachment.",
  );
};

export const deleteAttachment = (ticketId, attachmentId) =>
  getOrThrow(
    () =>
      api.delete(
        `/tickets/${encodeURIComponent(String(ticketId))}/attachments/${encodeURIComponent(String(attachmentId))}`,
      ),
    "Unable to delete attachment.",
  );

/** Assigned technician evidence (max 3); separate from requester `attachments`. */
export const uploadTechnicianEvidence = (ticketId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return getOrThrow(
    () => api.post(`/tickets/${encodeURIComponent(String(ticketId))}/technician-evidence`, formData),
    "Unable to upload technician evidence.",
  );
};

export const deleteTechnicianEvidence = (ticketId, attachmentId) =>
  getOrThrow(
    () =>
      api.delete(
        `/tickets/${encodeURIComponent(String(ticketId))}/technician-evidence/${encodeURIComponent(String(attachmentId))}`,
      ),
    "Unable to delete technician evidence.",
  );

export const replaceTechnicianEvidence = (ticketId, attachmentId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return getOrThrow(
    () =>
      api.put(
        `/tickets/${encodeURIComponent(String(ticketId))}/technician-evidence/${encodeURIComponent(String(attachmentId))}`,
        formData,
      ),
    "Unable to replace technician evidence.",
  );
};
