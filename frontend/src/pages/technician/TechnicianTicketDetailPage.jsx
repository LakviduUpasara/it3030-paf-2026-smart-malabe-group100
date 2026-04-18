import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
  addTechnicianProgressNote,
  getTechnicianTicket,
  patchTechnicianResolutionNotes,
  patchTechnicianTicketStatus,
  resolveTechnicianTicket,
} from "../../services/technicianWorkspaceService";
import { formatDateTime, toToken } from "../../utils/formatters";

const WORKING_STATUSES = [
  { value: "OPEN", label: "Open" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "In progress" },
];

function TechnicianTicketDetailPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusDraft, setStatusDraft] = useState("");
  const [progressText, setProgressText] = useState("");
  const [resolutionDraft, setResolutionDraft] = useState("");
  const [resolveNotes, setResolveNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!ticketId) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await getTechnicianTicket(ticketId);
      setTicket(data);
      setStatusDraft(data?.status || "");
      setResolutionDraft(data?.resolutionNotes || "");
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

  const isClosed = ticket && (ticket.status === "RESOLVED" || ticket.status === "CLOSED");

  const handleStatusSave = async (event) => {
    event.preventDefault();
    if (!ticketId || !statusDraft) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const updated = await patchTechnicianTicketStatus(ticketId, statusDraft);
      setTicket(updated);
    } catch (e) {
      setError(e.message || "Could not update status.");
    } finally {
      setBusy(false);
    }
  };

  const handleProgressSubmit = async (event) => {
    event.preventDefault();
    if (!ticketId || !progressText.trim()) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const updated = await addTechnicianProgressNote(ticketId, progressText.trim());
      setTicket(updated);
      setProgressText("");
    } catch (e) {
      setError(e.message || "Could not add note.");
    } finally {
      setBusy(false);
    }
  };

  const handleResolutionSave = async (event) => {
    event.preventDefault();
    if (!ticketId) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const updated = await patchTechnicianResolutionNotes(ticketId, resolutionDraft);
      setTicket(updated);
    } catch (e) {
      setError(e.message || "Could not save resolution notes.");
    } finally {
      setBusy(false);
    }
  };

  const handleResolve = async (event) => {
    event.preventDefault();
    if (!ticketId) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const updated = await resolveTechnicianTicket(ticketId, resolveNotes);
      setTicket(updated);
      setResolveNotes("");
    } catch (e) {
      setError(e.message || "Could not resolve ticket.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading ticket..." />;
  }

  if (!ticket) {
    return (
      <Card title="Ticket">
        {error ? <p className="alert alert-error">{error}</p> : <p className="supporting-text">Ticket not found.</p>}
        <p className="mt-4">
          <Link className="button button-secondary" to="/technician/tickets">
            Back to queue
          </Link>
        </p>
      </Card>
    );
  }

  return (
    <div className="page-stack">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link className="text-sm font-semibold text-heading underline-offset-2 hover:underline" to="/technician/tickets">
          ← Back to queue
        </Link>
        <span className={`status-badge ${toToken(ticket.status)}`}>{ticket.status}</span>
      </div>

      <Card
        subtitle={`${ticket.reference || ticket.id} · ${ticket.location || "—"}`}
        title={ticket.title}
      >
        {error ? <p className="alert alert-error">{error}</p> : null}
        {isClosed ? (
          <p className="alert alert-success">This ticket is closed for field work. Details remain visible below.</p>
        ) : null}

        <div className="form-grid">
          <div className="field">
            <span>Description</span>
            <p className="supporting-text whitespace-pre-wrap">{ticket.description || "—"}</p>
          </div>
          <div className="field">
            <span>Reporter</span>
            <p className="supporting-text">{ticket.reporterDisplayName || ticket.reporterUserId || "—"}</p>
          </div>
          <div className="field">
            <span>Priority</span>
            <p className="supporting-text">{ticket.priority}</p>
          </div>
          <div className="field">
            <span>Updated</span>
            <p className="supporting-text">
              {ticket.updatedAt ? formatDateTime(ticket.updatedAt) : "—"}
              {ticket.resolvedAt ? ` · Resolved ${formatDateTime(ticket.resolvedAt)}` : ""}
            </p>
          </div>
        </div>
      </Card>

      {!isClosed ? (
        <Card subtitle="Use the dedicated resolve action when work is finished" title="Workflow">
          <form className="form-grid" onSubmit={handleStatusSave}>
            <label className="field">
              <span>Status</span>
              <select
                disabled={busy}
                onChange={(e) => setStatusDraft(e.target.value)}
                value={statusDraft}
              >
                {WORKING_STATUSES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="field flex items-end">
              <Button disabled={busy || statusDraft === ticket.status} type="submit" variant="secondary">
                Update status
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card subtitle="Visible to operations and the reporter" title="Progress updates">
        {ticket.progressNotes?.length ? (
          <ul className="mb-4 space-y-3">
            {ticket.progressNotes.map((note) => (
              <li className="rounded-2xl border border-border bg-tint/60 p-3" key={note.id}>
                <p className="text-sm text-text/80 whitespace-pre-wrap">{note.content}</p>
                <p className="mt-2 text-xs text-text/60">
                  {note.authorDisplayName || note.authorUserId || "Technician"}
                  {note.createdAt ? ` · ${formatDateTime(note.createdAt)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="supporting-text mb-4">No progress updates yet.</p>
        )}

        {!isClosed ? (
          <form className="form-grid" onSubmit={handleProgressSubmit}>
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
        ) : null}
      </Card>

      <Card subtitle="Draft the final summary before resolving" title="Resolution notes">
        {!isClosed ? (
          <form className="form-grid" onSubmit={handleResolutionSave}>
            <label className="field">
              <span>Resolution notes</span>
              <textarea
                className="min-h-[100px]"
                disabled={busy}
                onChange={(e) => setResolutionDraft(e.target.value)}
                value={resolutionDraft}
              />
            </label>
            <div>
              <Button disabled={busy} type="submit" variant="secondary">
                Save notes
              </Button>
            </div>
          </form>
        ) : (
          <p className="supporting-text whitespace-pre-wrap">{ticket.resolutionNotes || "—"}</p>
        )}
      </Card>

      {!isClosed ? (
        <Card subtitle="Sets status to RESOLVED and timestamps completion" title="Resolve ticket">
          <form className="form-grid" onSubmit={handleResolve}>
            <label className="field">
              <span>Optional final notes</span>
              <textarea
                className="min-h-[80px]"
                disabled={busy}
                onChange={(e) => setResolveNotes(e.target.value)}
                placeholder="Merged into resolution notes when provided"
                value={resolveNotes}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button disabled={busy} type="submit" variant="primary">
                Mark resolved
              </Button>
              <Button disabled={busy} onClick={() => navigate("/technician/tickets")} type="button" variant="secondary">
                Done — return to list
              </Button>
            </div>
          </form>
        </Card>
      ) : null}
    </div>
  );
}

export default TechnicianTicketDetailPage;
