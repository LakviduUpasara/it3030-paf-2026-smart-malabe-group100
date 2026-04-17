import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import { addUpdate, fetchAttachmentPreview, getMyTickets, updateStatus, uploadFile } from "../services/ticketService";
import { toToken } from "../utils/formatters";
import { parseTicketDescription } from "../utils/ticketDescription";
import { ROLES } from "../utils/roleUtils";

function normalizeStatusForPicker(status) {
  const raw = String(status || "OPEN")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (raw === "CLOSED") return "RESOLVED";
  if (raw === "OPEN" || raw === "IN_PROGRESS" || raw === "RESOLVED") return raw;
  return "OPEN";
}

function normalizeAttachmentFromApi(att) {
  if (att == null || typeof att !== "object") return null;
  const rawId = att.id ?? att._id;
  return {
    ...att,
    id: rawId != null && rawId !== "" ? String(rawId) : null,
    fileName: att.fileName ?? att.file_name ?? "",
  };
}

function isImageEvidence(mime, fileName) {
  if (mime && String(mime).startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|bmp)$/i.test(fileName || "");
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
  messagesById,
  setMessagesById,
  filesById,
  setFilesById,
  pendingKey,
  onMarkResolved,
  onReopenInProgress,
  onAddUpdate,
  onUploadFile,
  notesFocusSerial = 0,
}) {
  const notesSectionRef = useRef(null);

  const parsed = parseTicketDescription(ticket.description);
  const isResolved = normalizeStatusForPicker(ticket.status) === "RESOLVED";
  const creator = ticket.createdByUsername?.trim();
  const statusToken = toToken(ticket.status || "unknown");

  const normalizedAttachments = useMemo(() => {
    const raw = ticket?.attachments;
    const list = Array.isArray(raw) ? raw : [];
    return list.map(normalizeAttachmentFromApi).filter(Boolean);
  }, [ticket?.attachments]);

  const evidenceAttachmentKey = useMemo(
    () => normalizedAttachments.map((a) => a?.id).join("|"),
    [normalizedAttachments],
  );

  const [evidencePreviewById, setEvidencePreviewById] = useState({});

  useEffect(() => {
    if (!ticket?.id || normalizedAttachments.length === 0) {
      setEvidencePreviewById((prev) => {
        Object.values(prev).forEach((entry) => {
          if (entry?.url) URL.revokeObjectURL(entry.url);
        });
        return {};
      });
      return undefined;
    }

    let cancelled = false;
    async function loadEvidence() {
      const next = {};
      for (const att of normalizedAttachments) {
        if (!att?.id) continue;
        try {
          const preview = await fetchAttachmentPreview(ticket.id, att.id);
          if (!cancelled) {
            next[att.id] = { ...preview, fileName: att.fileName || "" };
          }
        } catch {
          /* skip failed preview */
        }
      }
      if (!cancelled) {
        setEvidencePreviewById((prev) => {
          Object.values(prev).forEach((entry) => {
            if (entry?.url) URL.revokeObjectURL(entry.url);
          });
          return next;
        });
      }
    }

    loadEvidence();
    return () => {
      cancelled = true;
    };
  }, [ticket.id, evidenceAttachmentKey]);

  useEffect(() => {
    if (!notesFocusSerial || !ticket?.id) return undefined;
    const timer = window.setTimeout(() => {
      notesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      const ta = notesSectionRef.current?.querySelector("textarea");
      if (ta && typeof ta.focus === "function") {
        ta.focus();
      }
    }, 200);
    return () => window.clearTimeout(timer);
  }, [notesFocusSerial, ticket?.id]);

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

        {normalizedAttachments.length > 0 ? (
          <div className="technician-evidence-block" aria-label="Requester evidence">
            <h4 className="technician-ticket-section-title technician-evidence-heading">Evidence</h4>
            <p className="technician-ticket-section-hint technician-evidence-hint">
              Photos or files submitted with this request.
            </p>
            <ul className="ticket-detail-evidence-list technician-evidence-list">
              {normalizedAttachments.map((att) => {
                const preview = evidencePreviewById[att.id];
                const name = att.fileName || "Attachment";
                const showImg = preview?.url && isImageEvidence(preview.mime, name);
                return (
                  <li className="ticket-detail-evidence-item" key={att.id || name}>
                    {showImg ? (
                      <a
                        className="ticket-detail-evidence-thumb-link"
                        href={preview.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <img alt={name} className="ticket-detail-evidence-img" src={preview.url} />
                      </a>
                    ) : preview?.url ? (
                      <a className="ticket-detail-evidence-file" download={name} href={preview.url}>
                        {name}
                      </a>
                    ) : att.id ? (
                      <span className="ticket-detail-evidence-loading">{name}</span>
                    ) : (
                      <span className="ticket-detail-evidence-file">{name}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>

      {isResolved ? (
        <div className="technician-ticket-resolved-callout" role="status">
          <strong>Resolved</strong>
          <p>
            This ticket is complete. Change status to <em>In progress</em> if you need to add more
            work, notes, or attachments.
          </p>
          {typeof onReopenInProgress === "function" ? (
            <div className="technician-ticket-toolbar technician-ticket-toolbar--single technician-ticket-resolved-reopen">
              <Button
                type="button"
                onClick={() => onReopenInProgress(ticket.id)}
                disabled={pendingKey === `${ticket.id}-reopen`}
              >
                Mark in progress
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {!isResolved ? (
        <section className="technician-ticket-section" aria-labelledby={`tech-status-${ticket.id}`}>
          <h4 id={`tech-status-${ticket.id}`} className="technician-ticket-section-title">
            Status
          </h4>
          <p className="technician-ticket-section-hint">
            When the work is finished, mark this ticket as resolved.
          </p>
          <div className="technician-ticket-toolbar technician-ticket-toolbar--single">
            <Button
              type="button"
              onClick={() => onMarkResolved(ticket.id)}
              disabled={pendingKey === `${ticket.id}-resolved`}
            >
              Mark as resolved
            </Button>
          </div>
        </section>
      ) : null}

      <section
        ref={notesSectionRef}
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
  const location = useLocation();
  const isResolvedView = location.pathname === "/technician/resolved";
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [pendingKey, setPendingKey] = useState(null);
  const [messagesById, setMessagesById] = useState({});
  const [filesById, setFilesById] = useState({});
  const [activeTicketId, setActiveTicketId] = useState(null);
  /** Increment when opening the modal via "Add comment" so the notes section scrolls into view. */
  const [notesFocusSerial, setNotesFocusSerial] = useState(0);
  const [filterQuery, setFilterQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  const closeDetailModal = () => {
    setActiveTicketId(null);
  };

  useEffect(() => {
    if (!activeTicketId) {
      return undefined;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => {
      if (event.key === "Escape" && pendingKey == null) {
        closeDetailModal();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeTicketId, pendingKey]);

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

  const handleMarkResolved = async (ticketId) => {
    setPendingKey(`${ticketId}-resolved`);
    setFeedback({});

    try {
      await updateStatus(ticketId, "RESOLVED");
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: "RESOLVED" } : t)),
      );
      setFeedback({ type: "success", text: "Ticket marked as resolved." });
      setActiveTicketId(null);
    } catch (err) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setPendingKey(null);
    }
  };

  const handleReopenInProgress = async (ticketId) => {
    setPendingKey(`${ticketId}-reopen`);
    setFeedback({});

    try {
      await updateStatus(ticketId, "IN_PROGRESS");
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: "IN_PROGRESS" } : t)),
      );
      setFeedback({ type: "success", text: "Ticket moved back to In progress." });
      setActiveTicketId(null);
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

  const baseVisibleTickets = useMemo(() => {
    return tickets.filter((t) => {
      const resolved = normalizeStatusForPicker(t.status) === "RESOLVED";
      return isResolvedView ? resolved : !resolved;
    });
  }, [tickets, isResolvedView]);

  const filteredTickets = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    return baseVisibleTickets.filter((ticket) => {
      const parsed = parseTicketDescription(ticket.description);
      const priority = (parsed.priority || "Normal").trim();
      if (filterPriority && priority.toLowerCase() !== filterPriority.toLowerCase()) {
        return false;
      }
      if (q) {
        const title = (ticket.title || "").toLowerCase();
        const id = String(ticket.id || "").toLowerCase();
        const content = (parsed.content || "").toLowerCase();
        if (!title.includes(q) && !id.includes(q) && !content.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [baseVisibleTickets, filterQuery, filterPriority]);

  const hasActiveTechnicianFilters =
    Boolean(filterQuery.trim()) || Boolean(filterPriority);

  const clearTechnicianFilters = () => {
    setFilterQuery("");
    setFilterPriority("");
  };

  if (loading) return <LoadingSpinner label="Loading your tickets…" />;

  const detailTicket = activeTicketId
    ? tickets.find((t) => t.id === activeTicketId)
    : null;

  return (
    <>
    <div className="technician-page">
      <Card
        title={isResolvedView ? "Resolved tickets" : "Technician Dashboard"}
        subtitle={
          isResolvedView
            ? "Work you have marked complete. Open a row for full details."
            : "Active assignments. Mark tickets resolved when finished—they move to the Resolved page."
        }
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
        ) : baseVisibleTickets.length === 0 ? (
          <div className="technician-empty">
            <p className="technician-empty-title">
              {isResolvedView ? "No resolved tickets yet" : "Nothing in your active queue"}
            </p>
            <p className="technician-empty-text">
              {isResolvedView
                ? "When you mark a ticket as resolved from Technician Desk, it will appear here."
                : "All of your assigned tickets are resolved. Open the Resolved tab to review them."}
            </p>
          </div>
        ) : (
          <>
            <div className="technician-filters my-tickets-filters" aria-label="Search and filter tickets">
              <div className="my-tickets-filters-search-row">
                <label className="my-tickets-filters-search">
                  <span>Search</span>
                  <input
                    autoComplete="off"
                    type="search"
                    placeholder="Title, description text, or ticket ID"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                  />
                </label>
              </div>
              <div className="my-tickets-filters-controls">
                <label className="my-tickets-filter-field">
                  <span>Priority</span>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                  >
                    <option value="">All priorities</option>
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </label>
                {hasActiveTechnicianFilters ? (
                  <Button type="button" variant="ghost" onClick={clearTechnicianFilters}>
                    Clear filters
                  </Button>
                ) : null}
              </div>
            </div>

            {filteredTickets.length === 0 ? (
              <p className="supporting-text technician-filter-empty" role="status">
                No tickets match your search or filters. Try adjusting or{" "}
                <button className="link-button" type="button" onClick={clearTechnicianFilters}>
                  clear filters
                </button>
                .
              </p>
            ) : (
              <div
                className="technician-table-wrapper"
                role="region"
                aria-label={isResolvedView ? "Resolved tickets" : "Active assigned tickets"}
              >
                <table className="technician-table">
                  <thead>
                    <tr>
                      <th scope="col">Ticket</th>
                      <th scope="col">Priority</th>
                      <th scope="col">Status</th>
                      <th scope="col" className="technician-table-actions-header">
                        Quick actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map((ticket) => {
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
                              <Button
                                type="button"
                                variant="secondary"
                                className="technician-see-details-button"
                                onClick={() => {
                                  setActiveTicketId(ticket.id);
                                }}
                              >
                                See details
                              </Button>
                              {isResolvedView ? (
                                <Button
                                  type="button"
                                  onClick={() => handleReopenInProgress(ticket.id)}
                                  disabled={pendingKey === `${ticket.id}-reopen`}
                                >
                                  Mark in progress
                                </Button>
                              ) : null}
                              {!isResolvedView && !isResolved ? (
                                <Button
                                  type="button"
                                  onClick={() => handleMarkResolved(ticket.id)}
                                  disabled={pendingKey === `${ticket.id}-resolved`}
                                >
                                  Mark as resolved
                                </Button>
                              ) : null}
                              {!isResolvedView && !isResolved ? (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  onClick={() => {
                                    setActiveTicketId(ticket.id);
                                    setNotesFocusSerial((n) => n + 1);
                                  }}
                                >
                                  Add comment
                                </Button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Card>
    </div>

    {detailTicket ? (
      <div
        className="modal-backdrop"
        onClick={() => {
          if (pendingKey == null) closeDetailModal();
        }}
        role="presentation"
      >
        <div
          className="modal-panel modal-panel--ticket-detail"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="technician-detail-title"
        >
          <div className="modal-header">
            <h3 id="technician-detail-title">Ticket details</h3>
            <button
              type="button"
              className="modal-close"
              disabled={pendingKey != null}
              onClick={closeDetailModal}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="modal-content technician-modal-detail-body">
            <TechnicianTicketPanel
              ticket={detailTicket}
              messagesById={messagesById}
              setMessagesById={setMessagesById}
              filesById={filesById}
              setFilesById={setFilesById}
              pendingKey={pendingKey}
              notesFocusSerial={notesFocusSerial}
              onMarkResolved={handleMarkResolved}
              onReopenInProgress={handleReopenInProgress}
              onAddUpdate={handleAddUpdate}
              onUploadFile={handleUploadAttachment}
            />
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
}

export default TechnicianDashboardPage;
