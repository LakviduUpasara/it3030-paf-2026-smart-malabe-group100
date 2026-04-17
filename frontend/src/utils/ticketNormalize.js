/** API may expose ids as `id` or `_id` (Mongo); normalize ticket payloads for the UI. */

export function normalizeAttachmentFromApi(att) {
  if (att == null || typeof att !== "object") return null;
  const rawId = att.id ?? att._id;
  return {
    ...att,
    id: rawId != null && rawId !== "" ? String(rawId) : null,
    fileName: att.fileName ?? att.file_name ?? "",
  };
}

export function normalizeTicketUpdateFromApi(u) {
  if (u == null || typeof u !== "object") return null;
  const rawId = u.id ?? u._id;
  return {
    ...u,
    id: rawId != null && rawId !== "" ? String(rawId) : null,
    message: u.message ?? "",
    updatedBy: u.updatedBy ?? "",
    timestamp: u.timestamp ?? null,
  };
}

export function normalizeTicketFromApi(ticket) {
  if (!ticket) return ticket;
  const raw = ticket.attachments;
  const list = Array.isArray(raw) ? raw : [];
  const rawTech = ticket.technicianAttachments;
  const techList = Array.isArray(rawTech) ? rawTech : [];
  const rawUpdates = ticket.updates;
  const ulist = Array.isArray(rawUpdates) ? rawUpdates : [];
  return {
    ...ticket,
    attachments: list.map(normalizeAttachmentFromApi).filter(Boolean),
    technicianAttachments: techList.map(normalizeAttachmentFromApi).filter(Boolean),
    updates: ulist.map(normalizeTicketUpdateFromApi).filter(Boolean),
  };
}
