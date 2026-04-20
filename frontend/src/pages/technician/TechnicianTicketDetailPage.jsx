import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import { getTicketById } from "../../services/ticketService";
import { formatDateTime, toToken } from "../../utils/formatters";
import {
  isAcceptedTechnicianWork,
  isAwaitingTechnicianDecision,
  normalizeTicketStatusKey,
} from "../../utils/technicianTicketFlow";
import { isResolvedTicketStatus } from "../../utils/technicianTicketStatus";
import { formatWithdrawalReasonForDisplay } from "../../utils/withdrawalReason";

function formatTechnicianDetailStatusLabel(ticket) {
  if (ticket && isAwaitingTechnicianDecision(ticket)) {
    const raw = normalizeTicketStatusKey(ticket.status);
    if (raw === "IN_PROGRESS") return "In progress — your decision pending";
    return "Awaiting your response";
  }
  if (ticket && isAcceptedTechnicianWork(ticket)) {
    const r = normalizeTicketStatusKey(ticket.status);
    return r === "ACCEPTED" ? "Accepted" : "In progress";
  }
  const raw = normalizeTicketStatusKey(ticket?.status);
  if (raw === "ASSIGNED") return "Awaiting your response";
  if (raw === "IN_PROGRESS") return "In progress";
  if (raw === "ACCEPTED") return "Accepted";
  if (raw === "REJECTED") return "Rejected";
  if (raw === "RESOLVED") return "Resolved";
  if (raw === "OPEN") return "Open";
  if (raw === "WITHDRAWN") return "Withdrawn";
  return String(ticket?.status || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isTerminalStatus(status) {
  const s = String(status || "").toUpperCase();
  return s === "RESOLVED" || s === "WITHDRAWN";
}

/**
 * Summary view: one **Workflow** card always shows the correct next action.
 * Accept / Reject while assignment is pending; workspace after acceptance (DB: technicianAcceptance).
 */
function TechnicianTicketDetailPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const workspacePath = ticketId ? `/technician/tickets/${ticketId}/work` : "/technician/tickets";
  const acceptPath = ticketId ? `/technician/tickets/${ticketId}/accept` : "/technician/accept";
  const rejectPath = ticketId ? `/technician/tickets/${ticketId}/reject` : "/technician/tickets";

  const load = async () => {
    if (!ticketId) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await getTicketById(ticketId);
      const data = res?.data;
      setTicket(data);
    } catch (e) {
      setError(e.message || "Failed to load ticket.");
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when id changes
  }, [ticketId]);

  const isClosed = ticket && isTerminalStatus(ticket.status);
  const awaitingAssignment = ticket && isAwaitingTechnicianDecision(ticket);
  const inProgressWorking = ticket && isAcceptedTechnicianWork(ticket);
  const listPath = ticket && isResolvedTicketStatus(ticket.status) ? "/technician/resolved" : "/technician/tickets";

  if (loading) {
    return <LoadingSpinner label="Loading ticket..." />;
  }

  if (!ticket) {
    return (
      <Card title="Ticket">
        {error ? <p className="alert alert-error">{error}</p> : <p className="supporting-text">Ticket not found.</p>}
        <p className="mt-4">
          <Link className="button button-secondary" to={listPath}>
            Back to list
          </Link>
        </p>
      </Card>
    );
  }

  const updates = Array.isArray(ticket.updates) ? ticket.updates : [];

  return (
    <div className="page-stack">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link className="text-sm font-semibold text-heading underline-offset-2 hover:underline" to={listPath}>
          ← {isResolvedTicketStatus(ticket.status) ? "Back to resolved" : "Back to tickets"}
        </Link>
        <span className={`status-badge ${toToken(ticket.status)}`}>
          {formatTechnicianDetailStatusLabel(ticket)}
        </span>
      </div>

      <Card
        subtitle={`${ticket.id ? String(ticket.id).slice(0, 10) : "—"} · Requester: ${ticket.createdByUsername || "—"}`}
        title={ticket.title}
      >
        {error ? <p className="alert alert-error">{error}</p> : null}

        {/* Withdrawal banner mirrors the admin ticket-detail layout so the technician sees the same detail view. */}
        {normalizeTicketStatusKey(ticket.status) === "WITHDRAWN" ? (
          <div
            className={`admin-ticket-detail-withdrawal-banner${formatWithdrawalReasonForDisplay(ticket) ? "" : " admin-ticket-detail-withdrawal-banner--muted"}`}
            role="status"
          >
            <span className="admin-ticket-detail-withdrawal-banner-label">Withdrawal reason</span>
            <p className="admin-ticket-detail-withdrawal-banner-text">
              {formatWithdrawalReasonForDisplay(ticket) || "No withdrawal details recorded."}
            </p>
          </div>
        ) : null}

        {isClosed && normalizeTicketStatusKey(ticket.status) !== "WITHDRAWN" ? (
          <p className="alert alert-success">This ticket is closed. Details remain visible below.</p>
        ) : null}
        {normalizeTicketStatusKey(ticket.status) === "WITHDRAWN" ? (
          <p className="alert alert-error">
            The requester withdrew this ticket. It has been removed from active assigned tickets.
          </p>
        ) : null}

        <div className="form-grid">
          <div className="field">
            <span>Description</span>
            <p className="supporting-text whitespace-pre-wrap">{ticket.description || "—"}</p>
          </div>
          <div className="field">
            <span>Category</span>
            <p className="supporting-text">
              {[ticket.categoryId, ticket.subCategoryId].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
          <div className="field">
            <span>Submitted</span>
            <p className="supporting-text">{ticket.createdAt ? formatDateTime(ticket.createdAt) : "—"}</p>
          </div>
        </div>
      </Card>

      {!isClosed ? (
        <Card subtitle="What happens next depends on status — this is the control centre for the ticket" title="Workflow">
          {awaitingAssignment ? (
            <>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text/60">
                Step 1 · Decision (desk assigned this to you)
              </p>
              <p className="mb-4 text-sm text-text/85">
                Choose <strong>Accept</strong> if you can do the work, or <strong>Reject</strong> if you cannot. You
                confirm on the next screen — nothing changes until you confirm there.
              </p>
              <div className="mb-4 flex flex-wrap gap-2">
                <Link
                  className="button button-primary inline-flex min-h-[44px] flex-1 items-center justify-center sm:flex-none sm:px-8"
                  to={acceptPath}
                >
                  Accept this ticket
                </Link>
                <Link
                  className="button button-secondary inline-flex min-h-[44px] flex-1 items-center justify-center sm:flex-none sm:px-8"
                  to={rejectPath}
                >
                  Reject this ticket
                </Link>
              </div>
              <p className="mb-2 text-xs text-text/60">Ticket views</p>
              <div className="flex flex-wrap gap-2">
                <Link className="text-sm font-semibold text-heading underline underline-offset-2" to="/technician/accept">
                  Accepted tickets
                </Link>
                <span className="text-text/40">·</span>
                <Link className="text-sm font-semibold text-heading underline underline-offset-2" to="/technician/tickets">
                  Assigned tickets
                </Link>
              </div>
            </>
          ) : inProgressWorking ? (
            <>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text/60">
                Step 2 · Working
              </p>
              <p className="mb-4 text-sm text-text/85">
                Primary: <strong>Open workspace</strong> to add updates and <strong>mark resolved</strong>. You can still
                open <strong>Accept</strong> (shows you&apos;re already in progress) or <strong>Reject</strong> to return
                the ticket to the desk if you can&apos;t finish it.
              </p>
              <div className="space-y-4 rounded-xl border border-border bg-tint/50 p-4">
                <p className="text-sm font-medium text-heading">
                  Status: <span className="text-heading">In progress</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="min-h-[44px] flex-1 sm:flex-none"
                    onClick={() => navigate(workspacePath)}
                    type="button"
                    variant="primary"
                  >
                    Open workspace
                  </Button>
                  <Link
                    className="button button-secondary inline-flex min-h-[44px] flex-1 items-center justify-center sm:flex-none"
                    to={acceptPath}
                  >
                    Accept page
                  </Link>
                  <Link
                    className="button button-secondary inline-flex min-h-[44px] flex-1 items-center justify-center sm:flex-none"
                    to={rejectPath}
                  >
                    Reject — return to desk
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <p className="supporting-text text-sm">
              Status: <strong>{formatTechnicianDetailStatusLabel(ticket.status)}</strong>. Open the ticket from{" "}
              <Link className="font-semibold underline" to="/technician/tickets">
                My tickets
              </Link>{" "}
              if you need another view.
            </p>
          )}
        </Card>
      ) : null}

      <Card
        subtitle={
          awaitingAssignment
            ? "History will appear after you accept and post from the workspace"
            : "Read-only here — write updates in the workspace when in progress"
        }
        title="Technician updates"
      >
        {updates.length ? (
          <ul className="mb-4 space-y-3">
            {updates.map((u) => (
              <li className="rounded-2xl border border-border bg-tint/60 p-3" key={u.id}>
                <p className="text-sm text-text/80 whitespace-pre-wrap">{u.message}</p>
                <p className="mt-2 text-xs text-text/60">
                  {u.updatedBy || "Technician"}
                  {u.timestamp ? ` · ${formatDateTime(u.timestamp)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="supporting-text mb-4">No updates yet.</p>
        )}

        {awaitingAssignment ? (
          <p className="supporting-text text-sm">
            Use <strong>Workflow</strong> above to go to <strong>Accept this ticket</strong> or{" "}
            <strong>Reject this ticket</strong>.
          </p>
        ) : inProgressWorking ? (
          <p className="supporting-text text-sm">
            <Link className="font-semibold text-heading underline underline-offset-2" to={workspacePath}>
              Open workspace
            </Link>{" "}
            to post updates.
          </p>
        ) : null}
      </Card>
    </div>
  );
}

export default TechnicianTicketDetailPage;
