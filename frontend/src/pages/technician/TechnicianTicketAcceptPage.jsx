import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import { acceptTicketAssignment, getTicketById } from "../../services/ticketService";
import { formatDateTime, toToken } from "../../utils/formatters";
import {
  canOpenAcceptPage,
  isAcceptedTechnicianWork,
  isAwaitingTechnicianDecision,
  labelForAcceptedTechnicianWork,
  labelForAwaitingTechnicianDecision,
} from "../../utils/technicianTicketFlow";

/**
 * Confirm acceptance, or view status when already accepted (ready for workspace).
 */
function TechnicianTicketAcceptPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!ticketId) return;
    setLoading(true);
    setError("");
    try {
      const res = await getTicketById(ticketId);
      setTicket(res?.data ?? null);
    } catch (e) {
      setError(e.message || "Failed to load ticket.");
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  if (loading) {
    return <LoadingSpinner label="Loading…" />;
  }

  if (!ticket) {
    return (
      <Card title="Accept ticket">
        {error ? <p className="alert alert-error">{error}</p> : <p className="supporting-text">Ticket not found.</p>}
        <p className="mt-4">
          <Link className="button button-secondary" to="/technician/accept">
            Back to Accept
          </Link>
        </p>
      </Card>
    );
  }

  if (!canOpenAcceptPage(ticket)) {
    return <Navigate replace to={`/technician/tickets/${ticketId}`} />;
  }

  const workspacePath = `/technician/tickets/${ticketId}/work`;
  const summaryPath = `/technician/tickets/${ticketId}`;

  if (isAcceptedTechnicianWork(ticket)) {
    return (
      <div className="page-stack">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <Link
              className="text-sm font-semibold text-heading underline-offset-2 hover:underline"
              to={summaryPath}
            >
              ← Ticket summary
            </Link>
            <span className="text-text/40">·</span>
            <Link
              className="text-sm font-semibold text-heading underline-offset-2 hover:underline"
              to="/technician/accept"
            >
              Accept queue
            </Link>
          </div>
          <span className={`status-badge ${toToken(ticket.status)}`}>
            {labelForAcceptedTechnicianWork(ticket)}
          </span>
        </div>

        <Card subtitle="You already confirmed — continue in the workspace" title="Ready to work">
          <p className="supporting-text mb-4 text-sm">
            You already confirmed this assignment — status is <strong>{labelForAcceptedTechnicianWork(ticket)}</strong>.
            Open the workspace to post updates and mark <strong>resolved</strong> when done. If you can&apos;t finish
            it, use <strong>Reject</strong> to return it to the desk.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate(workspacePath)} type="button" variant="primary">
              Open workspace
            </Button>
            <Link
              className="button button-secondary inline-flex items-center justify-center"
              to={`/technician/tickets/${ticketId}/reject`}
            >
              Return ticket to desk (Reject page)
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (!isAwaitingTechnicianDecision(ticket)) {
    return <Navigate replace to={`/technician/tickets/${ticketId}`} />;
  }

  const badgeClass = toToken(ticket.status);
  const awaitingBadge = labelForAwaitingTechnicianDecision(ticket);

  return (
    <div className="page-stack">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <Link
            className="text-sm font-semibold text-heading underline-offset-2 hover:underline"
            to={summaryPath}
          >
            ← Ticket summary
          </Link>
          <span className="text-text/40">·</span>
          <Link
            className="text-sm font-semibold text-heading underline-offset-2 hover:underline"
            to="/technician/accept"
          >
            Accept queue
          </Link>
        </div>
        <span className={`status-badge ${badgeClass}`}>{awaitingBadge}</span>
      </div>

      <Card subtitle="Review the request, then confirm if you can do the work" title="Accept this ticket">
        {error ? <p className="alert alert-error">{error}</p> : null}

        <div className="form-grid mb-6">
          <div className="field">
            <span>Title</span>
            <p className="font-medium text-heading">{ticket.title || "—"}</p>
          </div>
          <div className="field">
            <span>Description</span>
            <p className="supporting-text whitespace-pre-wrap">{ticket.description || "—"}</p>
          </div>
          <div className="field">
            <span>Submitted</span>
            <p className="supporting-text">{ticket.createdAt ? formatDateTime(ticket.createdAt) : "—"}</p>
          </div>
        </div>

        <p className="supporting-text mb-4 text-sm">
          The desk assigned this ticket to you; it is <strong>waiting for your decision</strong>. Confirm below if you
          can take it — your status becomes <strong>Accepted</strong> and you can use the workspace for updates and{" "}
          <strong>resolved</strong> when the work is done.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await acceptTicketAssignment(ticketId);
                navigate(workspacePath);
              } catch (e) {
                setError(e.message || "Could not accept.");
              } finally {
                setBusy(false);
              }
            }}
            type="button"
            variant="primary"
          >
            Confirm — I can take this ticket
          </Button>
          <Link className="button button-secondary inline-flex items-center justify-center" to={summaryPath}>
            Back without accepting
          </Link>
          <Link
            className="button button-secondary inline-flex items-center justify-center"
            to={`/technician/tickets/${ticketId}/reject`}
          >
            Go to Reject page instead
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default TechnicianTicketAcceptPage;
