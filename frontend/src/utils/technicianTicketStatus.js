/** Statuses for legacy /tickets API (technician queue). */
export function isResolvedTicketStatus(status) {
  const s = String(status || "")
    .trim()
    .toUpperCase();
  return s === "RESOLVED" || s === "CLOSED";
}

export function isActiveTicketStatus(status) {
  return !isResolvedTicketStatus(status);
}
