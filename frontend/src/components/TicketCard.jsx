import Button from "./Button";
import { toToken } from "../utils/formatters";
import { formatWithdrawalReasonForDisplay } from "../utils/withdrawalReason";

function TicketCard({ ticket, variant = "list", className = "", onViewDetails, onAssigned }) {
  const title = ticket.title ?? "";
  const description = ticket.description ?? "";
  const statusLabel = ticket.status || "Unknown";

  const badge = (
    <span className={`status-badge ${toToken(ticket.status || "unknown")}`}>{statusLabel}</span>
  );

  if (variant === "admin") {
    const creatorUsername = ticket.createdByUsername ?? "";
    const creatorId = ticket.createdByUserId ?? "";
    const hasTechnician =
      Boolean(ticket.assignedTechnicianUsername) || Boolean(ticket.assignedTechnicianUserId);
    const normStatus = String(ticket.status || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_");
    const withdrawalSummary =
      normStatus === "WITHDRAWN" ? formatWithdrawalReasonForDisplay(ticket) : "";
    const withdrawalCalloutText =
      normStatus === "WITHDRAWN"
        ? withdrawalSummary || "No withdrawal details recorded."
        : "";
    const assignmentLocked = normStatus === "RESOLVED" || normStatus === "WITHDRAWN";
    const assignmentLockedTitle =
      normStatus === "RESOLVED"
        ? "Resolved tickets cannot be reassigned."
        : normStatus === "WITHDRAWN"
          ? "Withdrawn tickets cannot be reassigned."
          : "";
    return (
      <article className={`list-row align-start admin-ticket-card ${className}`.trim()}>
        <div className="admin-ticket-card-main">
          <p className="admin-ticket-meta-line">
            <span className="admin-ticket-label">Ticket ID</span>{" "}
            <code className="admin-ticket-id">{ticket.id != null ? ticket.id : "—"}</code>
          </p>
          <p className="admin-ticket-meta-line">
            <span className="admin-ticket-label">Created by</span>{" "}
            <span className="admin-ticket-value">{creatorUsername || "—"}</span>
            <span className="admin-ticket-sep" aria-hidden="true">
              ·
            </span>
            <span className="admin-ticket-label">User ID</span>{" "}
            <code className="admin-ticket-id">{creatorId || "—"}</code>
          </p>
          <strong className="admin-ticket-title">{title || "Untitled ticket"}</strong>
          {normStatus === "WITHDRAWN" ? (
            <div
              className={`admin-ticket-withdrawal-callout${withdrawalSummary ? "" : " admin-ticket-withdrawal-callout--muted"}`}
              role="status"
            >
              <span className="admin-ticket-withdrawal-callout-label">Withdrawal reason</span>
              <span className="admin-ticket-withdrawal-callout-text">{withdrawalCalloutText}</span>
            </div>
          ) : null}
          {ticket.assignedTechnicianUsername || ticket.assignedTechnicianUserId ? (
            <p className="admin-ticket-meta-line admin-ticket-assigned">
              <span className="admin-ticket-label">Assigned to</span>{" "}
              <span className="admin-ticket-value">
                {ticket.assignedTechnicianUsername || "—"}
              </span>
              {ticket.assignedTechnicianUserId ? (
                <>
                  <span className="admin-ticket-sep" aria-hidden="true">
                    ·
                  </span>
                  <code className="admin-ticket-id">{ticket.assignedTechnicianUserId}</code>
                </>
              ) : null}
            </p>
          ) : null}
        </div>
        <div className="inline-actions admin-ticket-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onViewDetails?.(ticket)}
          >
            View details
          </Button>
          {assignmentLocked ? (
            <span className="admin-ticket-assign-locked" title={assignmentLockedTitle || undefined}>
              Assignment closed
            </span>
          ) : (
            <Button type="button" variant="primary" onClick={() => onAssigned?.(ticket)}>
              {hasTechnician ? "Assigned" : "Assign"}
            </Button>
          )}
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <div className={className.trim() || undefined} style={{ flex: "1 1 240px" }}>
        <strong>{title}</strong>
        <p className="supporting-text">{description || "—"}</p>
        {badge}
      </div>
    );
  }

  return (
    <article className={`list-row align-start ${className}`.trim()}>
      <div>
        <strong>{title}</strong>
        <p className="supporting-text">{description || "—"}</p>
      </div>
      <div className="inline-actions">{badge}</div>
    </article>
  );
}

export default TicketCard;
