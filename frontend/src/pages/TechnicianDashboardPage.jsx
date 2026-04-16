import { useEffect, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import { addUpdate, getMyTickets, updateStatus, uploadFile } from "../services/ticketService";
import { toToken } from "../utils/formatters";
import { parseTicketDescription } from "../utils/ticketDescription";
import { ROLES } from "../utils/roleUtils";

/** Backend and admin views use RESOLVED (not CLOSED). */
const STATUS_OPTIONS = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
];

function normalizeStatusForPicker(status) {
  const raw = String(status || "OPEN")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (raw === "CLOSED") return "RESOLVED";
  if (raw === "OPEN" || raw === "IN_PROGRESS" || raw === "RESOLVED") return raw;
  return "OPEN";
}

function formatTicketStatusLabel(status) {
  const raw = String(status || "OPEN")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (raw === "IN_PROGRESS") return "In progress";
  if (raw === "OPEN") return "Open";
  if (raw === "RESOLVED") return "Resolved";
  if (raw === "WITHDRAWN") return "Withdrawn";
  return String(status || "Unknown")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function TechnicianTicketPanel({
  ticket,
  statusDraftById,
  setStatusDraftById,
  messagesById,
  setMessagesById,
  filesById,
  setFilesById,
  pendingKey,
  onApplyStatus,
  onMarkResolved,
  onAddUpdate,
  onUploadFile,
}) {
  const parsed = parseTicketDescription(ticket.description);
  const isResolved = normalizeStatusForPicker(ticket.status) === "RESOLVED";
  const creator = ticket.createdByUsername?.trim();
  const statusToken = toToken(ticket.status || "unknown");

  return (
    <article className="technician-ticket-panel">
      <div className="technician-ticket-panel-header">
        <div className="technician-ticket-panel-title-row">
          <h3 className="technician-ticket-panel-title">
            {ticket.title?.trim() || "Untitled request"}
          </h3>
          <span
            className={`status-badge ${statusToken}`}
            title={`Status: ${formatTicketStatusLabel(ticket.status)}`}
          >
            {formatTicketStatusLabel(ticket.status)}
          </span>
        </div>
        {creator ? (
          <p className="technician-ticket-panel-sub">
            <span className="technician-ticket-panel-label">Submitted by</span> {creator}
          </p>
        ) : null}
      </div>

      <div className="technician-ticket-panel-body">
        <h4 className="technician-ticket-section-title">What they reported</h4>
        <p className="technician-ticket-description">
          {parsed.content?.trim() ? parsed.content : "—"}
        </p>

        <dl className="technician-ticket-meta">
          <div className="technician-ticket-meta-item">
            <dt>Location</dt>
            <dd>{parsed.location?.trim() || "—"}</dd>
          </div>
          <div className="technician-ticket-meta-item">
            <dt>Priority</dt>
            <dd>{parsed.priority?.trim() || "Normal"}</dd>
          </div>
          <div className="technician-ticket-meta-item">
            <dt>Preferred contact</dt>
            <dd>
              {parsed.contactMethod?.trim() || "—"}
              {parsed.contactDetails?.trim() ? (
                <>
                  <span className="technician-ticket-meta-sep" aria-hidden="true">
                    {" "}
                    ·{" "}
                  </span>
                  <span className="technician-ticket-contact-detail">{parsed.contactDetails.trim()}</span>
                </>
              ) : null}
            </dd>
          </div>
        </dl>
      </div>

      {isResolved ? (
        <div className="technician-ticket-resolved-callout" role="status">
          <strong>Resolved</strong>
          <p>
            This ticket is complete. Change status to <em>In progress</em> if you need to add more
            work, notes, or attachments.
          </p>
        </div>
      ) : null}

      <section className="technician-ticket-section" aria-labelledby={`tech-status-${ticket.id}`}>
        <h4 id={`tech-status-${ticket.id}`} className="technician-ticket-section-title">
          Status
        </h4>
        <p className="technician-ticket-section-hint">
          Update when you start work or finish the request.
        </p>
        <div className="technician-ticket-toolbar">
          <label className="technician-field">
            <span className="technician-field-label">Set status</span>
            <select
              aria-label="Ticket status"
              className="technician-select"
              value={statusDraftById[ticket.id] ?? "OPEN"}
              onChange={(e) =>
                setStatusDraftById((prev) => ({
                  ...prev,
                  [ticket.id]: e.target.value,
                }))
              }
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <div className="technician-ticket-toolbar-buttons">
            <Button
              type="button"
              onClick={() => onApplyStatus(ticket.id)}
              disabled={pendingKey === `${ticket.id}-status`}
            >
              Apply status
            </Button>
            {!isResolved ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => onMarkResolved(ticket.id)}
                disabled={pendingKey === `${ticket.id}-resolved`}
              >
                Mark as resolved
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <section
        className={`technician-ticket-section${isResolved ? " technician-ticket-section--muted" : ""}`}
        aria-labelledby={`tech-notes-${ticket.id}`}
      >
        <h4 id={`tech-notes-${ticket.id}`} className="technician-ticket-section-title">
          Notes and updates
        </h4>
        <p className="technician-ticket-section-hint">
          {isResolved
            ? "Unavailable while the ticket is resolved. Reopen by setting status to In progress."
            : "Add a short update for the requester (shown on the ticket)."}
        </p>
        <label className="technician-field technician-field--block">
          <span className="technician-field-label">Message</span>
          <textarea
            className="technician-textarea"
            placeholder="e.g. Inspected the bus bay — part ordered, ETA Tuesday."
            rows={4}
            disabled={isResolved}
            value={messagesById[ticket.id] || ""}
            onChange={(e) =>
              setMessagesById((prev) => ({
                ...prev,
                [ticket.id]: e.target.value,
              }))
            }
          />
        </label>
        <div className="technician-ticket-toolbar-buttons">
          <Button
            type="button"
            onClick={() => onAddUpdate(ticket.id)}
            disabled={isResolved || pendingKey === `${ticket.id}-update`}
          >
            Post update
          </Button>
        </div>
      </section>

      <section
        className={`technician-ticket-section${isResolved ? " technician-ticket-section--muted" : ""}`}
        aria-labelledby={`tech-file-${ticket.id}`}
      >
        <h4 id={`tech-file-${ticket.id}`} className="technician-ticket-section-title">
          Attachments
        </h4>
        <p className="technician-ticket-section-hint">
          {isResolved
            ? "Uploads are disabled until the ticket is in progress again."
            : "Add a photo or document if it helps document the fix."}
        </p>
        <div className="technician-file-row">
          <label className="technician-file-label">
            <span className="technician-field-label">Choose file</span>
            <input
              className="technician-file-input"
              type="file"
              disabled={isResolved}
              onChange={(e) =>
                setFilesById((prev) => ({
                  ...prev,
                  [ticket.id]: e.target.files?.[0],
                }))
              }
            />
          </label>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onUploadFile(ticket.id)}
            disabled={isResolved || pendingKey === `${ticket.id}-upload` || !filesById[ticket.id]}
          >
            Upload
          </Button>
        </div>
      </section>
    </article>
  );
}

function TechnicianDashboardPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [pendingKey, setPendingKey] = useState(null);
  const [statusDraftById, setStatusDraftById] = useState({});
  const [messagesById, setMessagesById] = useState({});
  const [filesById, setFilesById] = useState({});
  const [activeTicketId, setActiveTicketId] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadTickets() {
      setLoading(true);
      setError("");

      try {
        const res = await getMyTickets();
        const data = res.data;

        if (active) {
          let list = Array.isArray(data) ? data : [];
          if (user?.role === ROLES.TECHNICIAN && user?.id) {
            const uid = String(user.id);
            list = list.filter(
              (t) => t && String(t.assignedTechnicianUserId || "") === uid,
            );
          }
          setTickets(list);

          const draft = {};
          list.forEach((t) => {
            draft[t.id] = normalizeStatusForPicker(t.status);
          });
          setStatusDraftById(draft);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to load tickets.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTickets();
    return () => (active = false);
  }, [user?.id, user?.role]);

  const handleApplyStatus = async (ticketId) => {
    const nextStatus = statusDraftById[ticketId];

    setPendingKey(`${ticketId}-status`);
    setFeedback({});

    try {
      await updateStatus(ticketId, nextStatus);

      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId ? { ...t, status: nextStatus } : t,
        ),
      );

      setFeedback({ type: "success", text: "Status updated." });
    } catch (err) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setPendingKey(null);
    }
  };

  const handleMarkResolved = async (ticketId) => {
    setPendingKey(`${ticketId}-resolved`);
    setFeedback({});

    try {
      await updateStatus(ticketId, "RESOLVED");
      setStatusDraftById((prev) => ({ ...prev, [ticketId]: "RESOLVED" }));
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: "RESOLVED" } : t)),
      );
      setFeedback({ type: "success", text: "Ticket marked as resolved." });
    } catch (err) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setPendingKey(null);
    }
  };

  const handleAddUpdate = async (ticketId) => {
    const message = messagesById[ticketId];

    if (!message?.trim()) return;

    setPendingKey(`${ticketId}-update`);
    setFeedback({});

    try {
      await addUpdate(ticketId, {
        message: message.trim(),
        updatedBy: "Technician",
      });

      setMessagesById((prev) => ({ ...prev, [ticketId]: "" }));
      setFeedback({ type: "success", text: "Update posted." });
    } catch (err) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setPendingKey(null);
    }
  };

  const handleUploadAttachment = async (ticketId) => {
    const file = filesById[ticketId];
    if (!file) return;

    setPendingKey(`${ticketId}-upload`);
    setFeedback({});

    try {
      await uploadFile(ticketId, file);
      setFeedback({ type: "success", text: "File uploaded." });

      setFilesById((prev) => {
        const next = { ...prev };
        delete next[ticketId];
        return next;
      });
    } catch (err) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setPendingKey(null);
    }
  };

  if (loading) return <LoadingSpinner label="Loading your tickets…" />;

  return (
    <div className="technician-page">
      <Card
        title="Technician Dashboard"
        subtitle="Tickets assigned to you. Use the table to quickly scan and update status."
        className="technician-page-card"
      >
        {error ? <p className="alert alert-error">{error}</p> : null}
        {feedback.text ? (
          <p
            className={`alert ${feedback.type === "success" ? "alert-success" : "alert-error"}`}
            role="status"
          >
            {feedback.text}
          </p>
        ) : null}

        {tickets.length === 0 ? (
          <div className="technician-empty">
            <p className="technician-empty-title">No assigned tickets</p>
            <p className="technician-empty-text">
              When an administrator assigns a ticket to you, it will show up here.
            </p>
          </div>
        ) : (
          <div className="technician-table-wrapper" role="region" aria-label="Assigned tickets">
            <table className="technician-table">
              <thead>
                <tr>
                  <th scope="col">Ticket</th>
                  <th scope="col">Location</th>
                  <th scope="col">Priority</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="technician-table-actions-header">
                    Quick actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => {
                  const parsed = parseTicketDescription(ticket.description);
                  const isResolved = normalizeStatusForPicker(ticket.status) === "RESOLVED";
                  const statusToken = toToken(ticket.status || "unknown");
                  return (
                    <tr key={ticket.id}>
                      <td>
                        <div className="technician-table-title">
                          <span className="technician-table-ticket-title">
                            {ticket.title?.trim() || "Untitled request"}
                          </span>
                          <span className="technician-table-ticket-id">
                            ID: {ticket.id ?? "—"}
                          </span>
                        </div>
                      </td>
                      <td>{parsed.location?.trim() || "—"}</td>
                      <td>{parsed.priority?.trim() || "Normal"}</td>
                      <td>
                        <span
                          className={`status-badge ${statusToken}`}
                          title={formatTicketStatusLabel(ticket.status)}
                        >
                          {formatTicketStatusLabel(ticket.status)}
                        </span>
                      </td>
                      <td className="technician-table-actions-cell">
                        <div className="technician-table-actions">
                          <select
                            aria-label="Ticket status"
                            className="technician-select technician-select--sm"
                            value={statusDraftById[ticket.id] ?? "OPEN"}
                            onChange={(e) =>
                              setStatusDraftById((prev) => ({
                                ...prev,
                                [ticket.id]: e.target.value,
                              }))
                            }
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                          <Button
                            type="button"
                            onClick={() => handleApplyStatus(ticket.id)}
                            disabled={pendingKey === `${ticket.id}-status`}
                          >
                            Apply
                          </Button>
                          {!isResolved ? (
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => handleMarkResolved(ticket.id)}
                              disabled={pendingKey === `${ticket.id}-resolved`}
                            >
                              Mark resolved
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="secondary"
                            className="technician-see-details-button"
                            onClick={() =>
                              setActiveTicketId((prev) =>
                                prev === ticket.id ? null : ticket.id,
                              )
                            }
                          >
                            {activeTicketId === ticket.id ? "Hide details" : "See details"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {activeTicketId && (
          <div className="technician-details-panel">
            {(() => {
              const activeTicket = tickets.find((t) => t.id === activeTicketId);
              if (!activeTicket) return null;
              return (
                <TechnicianTicketPanel
                  ticket={activeTicket}
                  statusDraftById={statusDraftById}
                  setStatusDraftById={setStatusDraftById}
                  messagesById={messagesById}
                  setMessagesById={setMessagesById}
                  filesById={filesById}
                  setFilesById={setFilesById}
                  pendingKey={pendingKey}
                  onApplyStatus={handleApplyStatus}
                  onMarkResolved={handleMarkResolved}
                  onAddUpdate={handleAddUpdate}
                  onUploadFile={handleUploadAttachment}
                />
              );
            })()}
          </div>
        )}
      </Card>
    </div>
  );
}

export default TechnicianDashboardPage;
