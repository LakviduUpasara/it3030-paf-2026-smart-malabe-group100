import api, { createServiceError } from "./api";

export async function getMyTickets() {
  try {
    return await api.get("/tickets");
  } catch (error) {
    throw createServiceError(error, "Unable to load tickets.");
  }
}

export async function getManagedTickets() {
  try {
    return await api.get("/admin/tickets");
  } catch (error) {
    throw createServiceError(error, "Unable to load managed tickets.");
  }
}

export async function getTickets() {
  try {
    return await api.get("/tickets");
  } catch (error) {
    throw createServiceError(error, "Unable to load tickets.");
  }
}

export async function getTicketById(id) {
  try {
    return await api.get(`/tickets/${id}`);
  } catch (error) {
    throw createServiceError(error, "Unable to load ticket.");
  }
}

export async function createTicket(payload) {
  try {
    return await api.post("/tickets", payload);
  } catch (error) {
    throw createServiceError(error, "Unable to submit ticket.");
  }
}

export async function updateMyTicket(id, payload) {
  try {
    return await api.patch(`/tickets/${id}`, payload);
  } catch (error) {
    throw createServiceError(error, "Unable to update ticket.");
  }
}

export async function withdrawMyTicket(id, payload) {
  try {
    return await api.post(`/tickets/${id}/withdraw`, payload);
  } catch (error) {
    throw createServiceError(error, "Unable to withdraw ticket.");
  }
}

export async function deleteAttachment(ticketId, attachmentId) {
  try {
    return await api.delete(`/tickets/${ticketId}/attachments/${attachmentId}`);
  } catch (error) {
    throw createServiceError(error, "Unable to delete attachment.");
  }
}

export async function uploadFile(ticketId, file) {
  try {
    const form = new FormData();
    form.append("file", file);
    return await api.post(`/tickets/${ticketId}/attachments`, form);
  } catch (error) {
    throw createServiceError(error, "Unable to upload attachment.");
  }
}

export async function getTicketSuggestion(description) {
  try {
    return await api.post("/tickets/suggestions", { description });
  } catch (error) {
    throw createServiceError(error, "Unable to get suggestion.");
  }
}

/** Axios 1.x may return AxiosHeaders; bracket access to "content-type" is unreliable. */
function readResponseContentType(headers) {
  if (!headers) return "";
  let raw = "";
  if (typeof headers.get === "function") {
    raw = headers.get("content-type") || headers.get("Content-Type") || "";
  } else {
    raw = headers["content-type"] || headers["Content-Type"] || "";
  }
  if (!raw || typeof raw !== "string") return "";
  return raw.split(";")[0].trim();
}

function inferImageMimeFromFileName(fileName) {
  const n = String(fileName || "").toLowerCase();
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".gif")) return "image/gif";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".bmp")) return "image/bmp";
  if (n.endsWith(".svg")) return "image/svg+xml";
  return "";
}

/**
 * Loads ticket attachment bytes (requester or technician evidence) as a blob URL for previews.
 * @param {string} ticketId
 * @param {string} attachmentId
 * @param {{ fileNameHint?: string }} [options] — helps when the server sends application/octet-stream or omits Content-Type (common on Windows/Java).
 */
export async function fetchAttachmentPreview(ticketId, attachmentId, options = {}) {
  const { fileNameHint = "" } = options;
  try {
    const id = encodeURIComponent(String(attachmentId));
    const response = await api.get(`/tickets/${ticketId}/attachments/${id}`, {
      responseType: "blob",
    });
    const { data } = response;
    let mime = readResponseContentType(response.headers);
    if ((!mime || mime === "application/octet-stream") && data instanceof Blob && data.type) {
      const fromBlob = String(data.type).split(";")[0].trim();
      if (fromBlob) mime = fromBlob;
    }
    if (!mime || mime === "application/octet-stream") {
      const inferred = inferImageMimeFromFileName(fileNameHint);
      if (inferred) mime = inferred;
    }
    const url = URL.createObjectURL(data);
    return { url, mime };
  } catch (error) {
    throw createServiceError(error, "Unable to load attachment.");
  }
}

export async function assignTicketToTechnician(ticketId, technicianUserId) {
  try {
    return await api.post(`/tickets/${ticketId}/assign`, { technicianUserId });
  } catch (error) {
    throw createServiceError(error, "Unable to assign ticket.");
  }
}

/** Sets acceptance to accepted (IN_PROGRESS + PENDING → ACCEPTED; legacy ASSIGNED → IN_PROGRESS + ACCEPTED). */
export async function acceptTicketAssignment(ticketId) {
  try {
    return await api.post(`/tickets/${ticketId}/assignment/accept`);
  } catch (error) {
    throw createServiceError(error, "Unable to accept assignment.");
  }
}

/** Returns ticket to OPEN for the desk queue; clears assignee (assigned technician only). */
export async function rejectTicketAssignment(ticketId, payload) {
  try {
    return await api.post(`/tickets/${ticketId}/assignment/reject`, payload ?? {});
  } catch (error) {
    throw createServiceError(error, "Unable to decline assignment.");
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

export async function updateStatus(ticketId, status) {
  try {
    return await api.put(`/tickets/${ticketId}/status`, null, { params: { status } });
  } catch (error) {
    throw createServiceError(error, "Unable to update status.");
  }
}

export async function addUpdate(ticketId, body) {
  try {
    return await api.post(`/tickets/${ticketId}/updates`, body);
  } catch (error) {
    throw createServiceError(error, "Unable to post update.");
  }
}

export async function patchTicketUpdate(ticketId, updateId, body) {
  try {
    return await api.patch(`/tickets/${ticketId}/updates/${updateId}`, body);
  } catch (error) {
    throw createServiceError(error, "Unable to update ticket note.");
  }
}

export async function deleteTicketUpdate(ticketId, updateId) {
  try {
    return await api.delete(`/tickets/${ticketId}/updates/${updateId}`);
  } catch (error) {
    throw createServiceError(error, "Unable to delete update.");
  }
}

export async function uploadTechnicianEvidence(ticketId, file) {
  try {
    const form = new FormData();
    form.append("file", file);
    return await api.post(`/tickets/${ticketId}/technician-evidence`, form);
  } catch (error) {
    throw createServiceError(error, "Unable to upload evidence.");
  }
}

export async function deleteTechnicianEvidence(ticketId, attachmentId) {
  try {
    return await api.delete(`/tickets/${ticketId}/technician-evidence/${attachmentId}`);
  } catch (error) {
    throw createServiceError(error, "Unable to delete evidence.");
  }
}

export async function replaceTechnicianEvidence(ticketId, attachmentId, file) {
  try {
    const form = new FormData();
    form.append("file", file);
    return await api.put(`/tickets/${ticketId}/technician-evidence/${attachmentId}`, form);
  } catch (error) {
    throw createServiceError(error, "Unable to replace evidence.");
  }
}
