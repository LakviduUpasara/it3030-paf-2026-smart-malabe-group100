import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import TechnicianRejectAssignmentModal from "../../components/technician/TechnicianRejectAssignmentModal";
import { getTicketById, rejectTicketAssignment } from "../../services/ticketService";
import { toToken } from "../../utils/formatters";
import {
  canUseRejectFlow,
  isAcceptedTechnicianWork,
  isAwaitingTechnicianDecision,
  labelForAcceptedTechnicianWork,
  labelForAwaitingTechnicianDecision,
} from "../../utils/technicianTicketFlow";

/**
 * Return ticket to the desk — status becomes {@code OPEN} for reassignment — while assignment is pending or after acceptance.
 */
function TechnicianTicketRejectPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

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
          <Link className="button button-secondary" to="/technician/tickets">
            Back to My tickets
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
  const inProgressPhase = isAcceptedTechnicianWork(ticket);

  const pageTitle = inProgressPhase ? "Return ticket to desk" : "Reject this ticket";
  const pageSubtitle = inProgressPhase
    ? "You already accepted, but you can still hand it back if you can’t complete the work — the desk can reassign it."
    : "Use this only if you cannot take this assignment before you start";

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
            to="/technician/tickets"
          >
            My tickets
          </Link>
        </div>
        <span className={`status-badge ${toToken(ticket.status)}`}>
          {assignedPhase ? labelForAwaitingTechnicianDecision(ticket) : labelForAcceptedTechnicianWork(ticket)}
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
          {inProgressPhase ? (
            <p className="supporting-text text-sm text-amber-800/90 dark:text-amber-200/90">
              This removes your assignment and puts the ticket back to <strong>Open</strong> so the desk can assign someone
              else. Confirm only when you&apos;re sure.
            </p>
          ) : (
            <p className="supporting-text text-sm text-amber-800/90 dark:text-amber-200/90">
              The desk will see the ticket as <strong>Open</strong> again and can assign another technician.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={busy}
            onClick={() => {
              setError("");
              setRejectModalOpen(true);
            }}
            type="button"
            variant="primary"
          >
            {inProgressPhase ? "Return to desk…" : "Return to queue…"}
          </Button>
          <Link className="button button-secondary inline-flex items-center justify-center" to={summaryPath}>
            Back without returning
          </Link>
          {assignedPhase ? (
            <Link
              className="button button-secondary inline-flex items-center justify-center"
              to={`/technician/tickets/${ticketId}/accept`}
            >
              Go to Accept page instead
            </Link>
          ) : (
            <Link
              className="button button-secondary inline-flex items-center justify-center"
              to={`/technician/tickets/${ticketId}/work`}
            >
              Back to workspace
            </Link>
          )}
        </div>
      </Card>

      <TechnicianRejectAssignmentModal
        busy={busy}
        inProgressPhase={inProgressPhase}
        onClose={() => {
          if (!busy) setRejectModalOpen(false);
        }}
        onComplete={async (reasonText) => {
          setBusy(true);
          setError("");
          try {
            await rejectTicketAssignment(ticketId, { reason: reasonText });
            navigate("/technician/tickets");
          } catch (e) {
            setError(e.message || "Could not return ticket.");
            throw e;
          } finally {
            setBusy(false);
          }
        }}
        open={rejectModalOpen}
        ticketTitle={ticket.title}
      />
    </div>
  );
}

export default TechnicianTicketRejectPage;
