import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import { addUpdate, getTicketById, updateStatus } from "../../services/ticketService";
import { formatDateTime, toToken } from "../../utils/formatters";
import { isAcceptedTechnicianWork, isAwaitingTechnicianDecision } from "../../utils/technicianTicketFlow";

function normalizeTicketStatusKey(status) {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

/**
 * Active work surface after the technician accepts a ticket: in-progress only, updates, mark resolved.
 * Route: /technician/tickets/:ticketId/work
 */
function TechnicianTicketWorkspacePage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progressText, setProgressText] = useState("");
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

  const statusKey = ticket ? normalizeTicketStatusKey(ticket.status) : "";

  const redirect = useMemo(() => {
    if (!ticket || loading) return null;
    if (isAwaitingTechnicianDecision(ticket)) {
      return `/technician/tickets/${ticketId}`;
    }
    if (statusKey === "RESOLVED" || statusKey === "WITHDRAWN") {
      return `/technician/tickets/${ticketId}`;
    }
    if (!isAcceptedTechnicianWork(ticket)) {
      return `/technician/tickets/${ticketId}`;
    }
    return null;
  }, [ticket, loading, statusKey, ticketId]);

  if (loading) {
    return <LoadingSpinner label="Loading workspace…" />;
  }

  if (!ticket) {
    return (
      <Card title="Ticket workspace">
        {error ? <p className="alert alert-error">{error}</p> : <p className="supporting-text">Ticket not found.</p>}
        <p className="mt-4">
          <Link className="button button-secondary" to="/technician/tickets">
            Back to my tickets
          </Link>
        </p>
      </Card>
    );
  }

  if (redirect) {
    return <Navigate replace to={redirect} />;
  }

  const updates = Array.isArray(ticket.updates) ? ticket.updates : [];

  return (
    <div className="page-stack">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            className="text-sm font-semibold text-heading underline-offset-2 hover:underline"
            to={`/technician/tickets/${ticketId}`}
          >
            ← Ticket summary
          </Link>
          <span className="text-text/50">·</span>
          <Link
            className="text-sm font-semibold text-heading underline-offset-2 hover:underline"
            to="/technician/tickets"
          >
            All tickets
          </Link>
        </div>
        <span className={`status-badge ${toToken(ticket.status)}`}>
          {statusKey === "ACCEPTED" ? "Accepted" : "In progress"}
        </span>
      </div>

      <Card
        subtitle="Step 3 · Working — you already confirmed Accept; finish the job here"
        title={ticket.title?.trim() || "Ticket workspace"}
      >
        {error ? <p className="alert alert-error">{error}</p> : null}

        <div className="form-grid mb-4">
          <div className="field">
            <span className="text-sm font-medium text-heading">Workflow</span>
            <p className="supporting-text mt-1">
              Status stays <strong>{statusKey === "ACCEPTED" ? "Accepted" : "In progress"}</strong> until you{" "}
              <strong>mark resolved</strong> below. Requester:{" "}
              {ticket.createdByUsername || "—"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                className="text-sm font-semibold text-heading underline underline-offset-2"
                to={`/technician/tickets/${ticketId}/accept`}
              >
                Accept page
              </Link>
              <span className="text-text/40">·</span>
              <Link
                className="text-sm font-semibold text-heading underline underline-offset-2"
                to={`/technician/tickets/${ticketId}/reject`}
              >
                Reject / return to desk
              </Link>
            </div>
          </div>
        </div>
      </Card>

      <Card subtitle="Visible to the person who submitted the ticket" title="Updates">
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

        <form
          className="form-grid"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!ticketId || !progressText.trim()) return;
            setBusy(true);
            setError("");
            try {
              const res = await addUpdate(ticketId, { message: progressText.trim() });
              if (res?.data) {
                setTicket(res.data);
              } else {
                await load();
              }
              setProgressText("");
            } catch (e) {
              setError(e.message || "Could not add update.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="field">
            <span>Add update</span>
            <textarea
              className="min-h-[120px]"
              disabled={busy}
              onChange={(e) => setProgressText(e.target.value)}
              placeholder="What did you check or change?"
              value={progressText}
            />
          </label>
          <div>
            <Button disabled={busy || !progressText.trim()} type="submit" variant="primary">
              Post update
            </Button>
          </div>
        </form>
      </Card>

      <Card subtitle="When the issue is fully handled for the requester" title="Complete ticket">
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await updateStatus(ticketId, "RESOLVED");
                navigate("/technician/resolved");
              } catch (e) {
                setError(e.message || "Could not resolve ticket.");
              } finally {
                setBusy(false);
              }
            }}
            type="button"
            variant="primary"
          >
            Mark as resolved
          </Button>
          <Button disabled={busy} onClick={() => navigate("/technician/tickets")} type="button" variant="secondary">
            Back to list
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default TechnicianTicketWorkspacePage;
