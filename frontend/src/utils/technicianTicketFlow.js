/** Normalize status for legacy /api/v1/tickets payloads. */
export function normalizeTicketStatusKey(status) {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

export function isAwaitingTechnicianResponse(status) {
  return normalizeTicketStatusKey(status) === "ASSIGNED";
}
