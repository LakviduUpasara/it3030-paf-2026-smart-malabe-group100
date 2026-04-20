/** Normalize status for legacy /api/v1/tickets payloads. */
export function normalizeTicketStatusKey(status) {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

export function normalizeTechnicianAcceptance(raw) {
  return String(raw ?? "")
    .trim()
    .toUpperCase();
}

/** Ticket returned to desk with {@code technicianAcceptance === "REJECTED"} (you declined this assignment). */
export function isTechnicianAcceptanceRejected(ticket) {
  if (!ticket) return false;
  return normalizeTechnicianAcceptance(ticket.technicianAcceptance) === "REJECTED";
}

/**
 * Desk assigned the ticket but the technician has not accepted yet:
 * legacy {@code ASSIGNED}, or {@code IN_PROGRESS} with {@code technicianAcceptance === "PENDING"}.
 */
export function isAwaitingTechnicianDecision(ticket) {
  if (!ticket) return false;
  const k = normalizeTicketStatusKey(ticket.status);
  if (k === "ASSIGNED") return true;
  if (k !== "IN_PROGRESS") return false;
  const acc = normalizeTechnicianAcceptance(ticket.technicianAcceptance);
  return acc === "PENDING";
}

/**
 * Technician may work and resolve: status {@code ACCEPTED}, or legacy {@code IN_PROGRESS}
 * with ({@code ACCEPTED} or no acceptance field).
 */
export function isAcceptedTechnicianWork(ticket) {
  if (!ticket) return false;
  const k = normalizeTicketStatusKey(ticket.status);
  if (k === "ACCEPTED") return true;
  if (k !== "IN_PROGRESS") return false;
  const acc = normalizeTechnicianAcceptance(ticket.technicianAcceptance);
  if (!acc) return true;
  return acc === "ACCEPTED";
}

/** @deprecated Use {@link isAwaitingTechnicianDecision} with the full ticket. */
export function isAwaitingTechnicianResponse(status) {
  return normalizeTicketStatusKey(status) === "ASSIGNED";
}

/** @deprecated Use {@link isAcceptedTechnicianWork} with the full ticket (status alone is ambiguous). */
export function isInProgressTicket(status) {
  return normalizeTicketStatusKey(status) === "IN_PROGRESS";
}

/** Accept / Reject landing pages and queues. */
export function canOpenAcceptPage(ticket) {
  if (!ticket) return false;
  return isAwaitingTechnicianDecision(ticket) || isAcceptedTechnicianWork(ticket);
}

/** Reject assignment: only while the desk is waiting for accept/decline (API enforces the same). */
export function canUseRejectFlow(ticket) {
  if (!ticket) return false;
  return isAwaitingTechnicianDecision(ticket);
}

/**
 * Technician may post updates and upload evidence (assigned, accepted, ticket still mutable).
 */
export function canTechnicianPostWorkOnTicket(ticket) {
  if (!ticket) return false;
  if (!isAcceptedTechnicianWork(ticket)) return false;
  const s = normalizeTicketStatusKey(ticket.status);
  if (s === "RESOLVED" || s === "WITHDRAWN" || s === "REJECTED") return false;
  return true;
}

/**
 * Badge / row label for tickets you have accepted (or legacy in-progress accepted rows).
 * Prefer this over hardcoding "In progress" now that API uses status {@code ACCEPTED}.
 */
export function labelForAcceptedTechnicianWork(ticket) {
  if (!ticket || !isAcceptedTechnicianWork(ticket)) return "—";
  return normalizeTicketStatusKey(ticket.status) === "ACCEPTED" ? "Accepted" : "In progress";
}

/** Badge for assignments not yet accepted (pending decision). */
export function labelForAwaitingTechnicianDecision(ticket) {
  if (!ticket || !isAwaitingTechnicianDecision(ticket)) return "—";
  const k = normalizeTicketStatusKey(ticket.status);
  return k === "IN_PROGRESS" ? "Decision pending" : "Awaiting your response";
}

