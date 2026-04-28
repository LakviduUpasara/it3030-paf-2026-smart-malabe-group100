import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import { getTicketById, rejectTicketAssignment } from "../../services/ticketService";
import { toToken } from "../../utils/formatters";
import {
  canUseRejectFlow,
  isAwaitingTechnicianDecision,
  labelForAwaitingTechnicianDecision,
} from "../../utils/technicianTicketFlow";

const REASON_MAX = 500;
const REASON_MIN = 3;

/**
 * Decline an assignment before accepting it — ticket returns {@code OPEN} for admin reassignment (reason required).
 */
function TechnicianTicketRejectPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");

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
      <Card title="Reject ticket">
        {error ? <p className="alert alert-error">{error}</p> : <p className="supporting-text">Ticket not found.</p>}
        <p className="mt-4">
          <Link className="button button-secondary" to="/technician/reject">
            Back to Reject queue
          </Link>
        </p>
      </Card>
    );
  }

  if (!canUseRejectFlow(ticket)) {
    return <Navigate replace to={`/technician/tickets/${ticketId}`} />;
  }

  const summaryPath = `/technician/tickets/${ticketId}`;
  const assignedPhase = isAwaitingTechnicianDecision(ticket);

  const pageTitle = "Reject this assignment";
  const pageSubtitle =
    "The admin and requester are notified with your reason. The ticket returns to Open so the desk can reassign it.";

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
            to="/technician/reject"
          >
            Reject queue
          </Link>
        </div>
        <span className={`status-badge ${toToken(ticket.status)}`}>
          {labelForAwaitingTechnicianDecision(ticket)}
        </span>
      </div>

      <Card subtitle={pageSubtitle} title={pageTitle}>
        {error ? <p className="alert alert-error">{error}</p> : null}

        <div className="form-grid mb-4">
          <div className="field">
            <span>Title</span>
            <p className="font-medium text-heading">{ticket.title || "—"}</p>
          </div>
          <div className="field">
            <span>Description</span>
            <p className="supporting-text whitespace-pre-wrap">{ticket.description || "—"}</p>
          </div>
          <p className="supporting-text text-sm text-amber-800/90 dark:text-amber-200/90">
            The desk will see the ticket as <strong>Open</strong> under <strong>Rejected assignments</strong> with your
            note, then can assign another technician.
          </p>
        </div>

        <label className="field mb-4">
          <span>
            Reason for rejecting this assignment <span className="required-mark">*</span>
          </span>
          <textarea
            aria-invalid={reason.trim().length > 0 && reason.trim().length < REASON_MIN ? "true" : "false"}
            aria-required="true"
            className="min-h-[100px] w-full rounded-xl border border-border bg-surface p-3 text-sm"
            maxLength={REASON_MAX}
            minLength={REASON_MIN}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Outside my area / need specialist / cannot complete"
            required
            value={reason}
          />
          <small className="supporting-text">
            A short note helps the admin reassign quickly. Minimum {REASON_MIN} characters, max {REASON_MAX}.
          </small>
        </label>

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={busy || reason.trim().length < REASON_MIN}
            onClick={async () => {
              const trimmed = reason.trim();
              if (trimmed.length < REASON_MIN) {
                setError(`A reason is required (at least ${REASON_MIN} characters).`);
                return;
              }
              setBusy(true);
              setError("");
              try {
                await rejectTicketAssignment(ticketId, { reason: trimmed });
                navigate("/technician/reject");
              } catch (e) {
                setError(e.message || "Could not return ticket.");
              } finally {
                setBusy(false);
              }
            }}
            type="button"
            variant="primary"
          >
            Confirm — reject assignment
          </Button>
          <Link className="button button-secondary inline-flex items-center justify-center" to={summaryPath}>
            Back without rejecting
          </Link>
          {assignedPhase ? (
            <Link
              className="button button-secondary inline-flex items-center justify-center"
              to={`/technician/tickets/${ticketId}/accept`}
            >
              Go to Accept page instead
            </Link>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

export default TechnicianTicketRejectPage;
