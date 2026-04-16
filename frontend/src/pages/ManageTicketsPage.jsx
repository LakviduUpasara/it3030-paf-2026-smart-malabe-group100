import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminCategoriesPanel from "../components/AdminCategoriesPanel";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import TicketCard from "../components/TicketCard";
import { getTechnicians } from "../services/adminService";
import { assignTicketToTechnician, getTicketById, getTickets } from "../services/ticketService";
import { parseTicketDescription } from "../utils/ticketDescription";
import { formatDateTime, toToken } from "../utils/formatters";
import { formatWithdrawalReasonForDisplay } from "../utils/withdrawalReason";

function formatTicketStatusLabel(status) {
  const raw = String(status || "OPEN").trim().toUpperCase().replace(/\s+/g, "_");
  if (raw === "IN_PROGRESS") return "In Progress";
  if (raw === "OPEN") return "Open";
  if (raw === "RESOLVED") return "Resolved";
  if (raw === "WITHDRAWN") return "Withdrawn";
  return String(status || "Open")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Splits seeded names like "Alex Rivera (Facilities)" into display name + team label. */
function parseTechnicianDisplay(fullName) {
  const raw = String(fullName || "").trim();
  const m = raw.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (m) {
    return { name: m[1].trim(), team: m[2].trim() };
  }
  return { name: raw || "Technician", team: null };
}

function technicianInitials(displayName) {
  const parts = String(displayName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function shortTicketReference(id) {
  if (id == null || id === "") return "—";
  const s = String(id);
  if (s.length <= 14) return s;
  return `…${s.slice(-10)}`;
}

function normalizeTicketStatus(status) {
  return String(status || "OPEN")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

const ADMIN_TICKET_SECTIONS = [
  { id: "open", label: "Open tickets", status: "OPEN" },
  { id: "assigned", label: "Assigned tickets", status: "IN_PROGRESS" },
  { id: "resolved", label: "Resolved tickets", status: "RESOLVED" },
  { id: "withdrawn", label: "Withdrawn tickets", status: "WITHDRAWN" },
];

const VALID_ADMIN_SECTIONS = new Set([
  "open",
  "assigned",
  "resolved",
  "withdrawn",
  "categories",
]);

function ManageTicketsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeSection = (() => {
    const s = searchParams.get("section");
    return VALID_ADMIN_SECTIONS.has(s) ? s : "open";
  })();

  const setActiveSection = (id) => {
    if (id === "open") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ section: id }, { replace: true });
    }
  };

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTicket, setDetailTicket] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTicket, setAssignTicket] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [assignListLoading, setAssignListLoading] = useState(false);
  const [assignListError, setAssignListError] = useState("");
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignActionError, setAssignActionError] = useState("");
  const [assignIdCopied, setAssignIdCopied] = useState(false);

  /** Align fixed left rail with the real navbar bottom (avoids overlap and blocked clicks). */
  useLayoutEffect(() => {
    const root = document.documentElement;

    function measureAndApply() {
      const nav = document.querySelector("header.navbar");
      if (!nav) return;
      const h = nav.getBoundingClientRect().height;
      if (h > 0) {
        root.style.setProperty("--navbar-measured-height", `${Math.ceil(h)}px`);
      }
    }

    measureAndApply();
    const nav = document.querySelector("header.navbar");
    const ro =
      nav && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => measureAndApply())
        : null;
    if (nav && ro) {
      ro.observe(nav);
    }
    window.addEventListener("resize", measureAndApply);
    const id = window.requestAnimationFrame(measureAndApply);
    const t = window.setTimeout(measureAndApply, 0);

    return () => {
      window.clearTimeout(t);
      window.cancelAnimationFrame(id);
      ro?.disconnect();
      window.removeEventListener("resize", measureAndApply);
      root.style.removeProperty("--navbar-measured-height");
    };
  }, []);

  const sectionCounts = useMemo(() => {
    const counts = { open: 0, assigned: 0, resolved: 0, withdrawn: 0 };
    for (const ticket of tickets) {
      const s = normalizeTicketStatus(ticket?.status);
      if (s === "OPEN") counts.open += 1;
      else if (s === "IN_PROGRESS") counts.assigned += 1;
      else if (s === "RESOLVED") counts.resolved += 1;
      else if (s === "WITHDRAWN") counts.withdrawn += 1;
    }
    return counts;
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    if (activeSection === "categories") {
      return [];
    }
    const def = ADMIN_TICKET_SECTIONS.find((sec) => sec.id === activeSection);
    const want = def ? def.status : "OPEN";
    return tickets.filter((t) => normalizeTicketStatus(t?.status) === want);
  }, [tickets, activeSection]);

  useEffect(() => {
    let active = true;

    async function loadTickets() {
      setLoading(true);
      setError("");

      try {
        const res = await getTickets();
        const data = res.data;

        if (active) {
          setTickets(Array.isArray(data) ? data : []);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Failed to load tickets.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadTickets();

    return () => {
      active = false;
    };
  }, []);

  async function reloadTicketsQuiet() {
    try {
      const res = await getTickets();
      setTickets(Array.isArray(res.data) ? res.data : []);
    } catch {
      /* keep existing list */
    }
  }

  const closeDetailModal = () => {
    setDetailOpen(false);
    setDetailTicket(null);
    setDetailError("");
  };

  const closeAssignModal = () => {
    setAssignOpen(false);
    setAssignTicket(null);
    setAssignListError("");
    setAssignActionError("");
    setTechnicians([]);
    setSelectedTechnicianId("");
    setAssignIdCopied(false);
  };

  const openAssignTicket = async (ticket) => {
    if (!ticket?.id) return;
    setAssignTicket(ticket);
    setAssignOpen(true);
    setAssignListError("");
    setAssignActionError("");
    setAssignIdCopied(false);
    setAssignListLoading(true);
    setTechnicians([]);
    setSelectedTechnicianId(ticket.assignedTechnicianUserId || "");
    try {
      const res = await getTechnicians();
      const list = Array.isArray(res.data) ? res.data : [];
      setTechnicians(list);
      if (list.length > 0) {
        const current = ticket.assignedTechnicianUserId;
        const hasCurrent = current && list.some((t) => t.id === current);
        setSelectedTechnicianId(hasCurrent ? current : list[0].id);
      }
    } catch (err) {
      setAssignListError(err.message || "Failed to load technicians.");
    } finally {
      setAssignListLoading(false);
    }
  };

  const confirmAssignTechnician = async () => {
    if (!assignTicket?.id || !selectedTechnicianId) return;
    setAssignSubmitting(true);
    setAssignActionError("");
    try {
      await assignTicketToTechnician(assignTicket.id, selectedTechnicianId);
      await reloadTicketsQuiet();
      if (detailTicket && detailTicket.id === assignTicket.id) {
        const refreshed = await getTicketById(assignTicket.id);
        setDetailTicket(refreshed.data);
      }
      closeAssignModal();
    } catch (err) {
      setAssignActionError(err.message || "Assignment failed.");
    } finally {
      setAssignSubmitting(false);
    }
  };

  const copyAssignTicketId = async () => {
    if (!assignTicket?.id) return;
    const text = String(assignTicket.id);
    try {
      await navigator.clipboard.writeText(text);
      setAssignIdCopied(true);
      window.setTimeout(() => setAssignIdCopied(false), 2000);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setAssignIdCopied(true);
        window.setTimeout(() => setAssignIdCopied(false), 2000);
      } catch {
        /* ignore */
      }
    }
  };

  const openTicketDetails = async (ticket) => {
    const id = ticket?.id;
    if (!id) return;
    setDetailOpen(true);
    setDetailTicket(null);
    setDetailError("");
    setDetailLoading(true);
    try {
      const res = await getTicketById(id);
      setDetailTicket(res.data);
    } catch (err) {
      setDetailError(err.message || "Unable to load ticket.");
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading tickets..." />;
  }

  const detailParsed = detailTicket ? parseTicketDescription(detailTicket.description) : null;

  const emptySectionMessage =
    activeSection === "open"
      ? "No open tickets awaiting assignment."
      : activeSection === "assigned"
        ? "No tickets are currently assigned to a technician."
        : activeSection === "resolved"
          ? "No resolved tickets yet."
          : "No withdrawn tickets.";

  const showTicketList = activeSection !== "categories";

  return (
    <>
      <div className="admin-tickets-layout">
        <aside className="admin-tickets-sidebar" aria-label="Tickets and category setup">
          <h2 className="admin-tickets-sidebar-heading">Tickets</h2>
          <nav className="admin-tickets-nav" aria-label="Filter by status">
            {ADMIN_TICKET_SECTIONS.map((sec) => {
              const count = sectionCounts[sec.id] ?? 0;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  className={`admin-tickets-nav-item${isActive ? " is-active" : ""}`}
                  onClick={() => setActiveSection(sec.id)}
                  aria-pressed={isActive}
                >
                  <span className="admin-tickets-nav-label">{sec.label}</span>
                  <span className="admin-tickets-nav-count" aria-hidden="true">
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
          <h2 className="admin-tickets-sidebar-heading admin-tickets-sidebar-heading--after-nav">
            Setup
          </h2>
          <nav className="admin-tickets-nav" aria-label="Ticket configuration">
            <button
              type="button"
              className={`admin-tickets-nav-item admin-tickets-nav-item--no-count${
                activeSection === "categories" ? " is-active" : ""
              }`}
              onClick={() => setActiveSection("categories")}
              aria-pressed={activeSection === "categories"}
            >
              <span className="admin-tickets-nav-label">Category setup</span>
            </button>
          </nav>
        </aside>

        <div className="admin-tickets-main">
          {showTicketList ? (
            <Card title="Manage Tickets" subtitle="View all incident tickets">
              {error && <p className="alert alert-error">{error}</p>}

              {!error && tickets.length === 0 && (
                <p className="supporting-text">No tickets yet.</p>
              )}

              {!error && tickets.length > 0 && filteredTickets.length === 0 && (
                <p className="supporting-text">{emptySectionMessage}</p>
              )}

              <div className="list-stack">
                {filteredTickets.map((ticket, index) => (
                  <TicketCard
                    key={ticket.id != null ? ticket.id : `ticket-${index}`}
                    ticket={ticket}
                    variant="admin"
                    onViewDetails={openTicketDetails}
                    onAssigned={openAssignTicket}
                  />
                ))}
              </div>
            </Card>
          ) : (
            <AdminCategoriesPanel />
          )}
        </div>
      </div>

      {detailOpen ? (
        <div
          className="modal-backdrop"
          onClick={() => !detailLoading && closeDetailModal()}
          role="presentation"
        >
          <div
            className="modal-panel modal-panel--admin-ticket-detail"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-ticket-detail-title"
          >
            <div className="modal-header">
              <h3 id="admin-ticket-detail-title">Ticket details</h3>
              <button
                className="modal-close"
                disabled={detailLoading}
                onClick={closeDetailModal}
                type="button"
              >
                ×
              </button>
            </div>
            <div className="modal-content admin-ticket-detail-modal">
              {detailLoading ? (
                <p className="supporting-text">Loading…</p>
              ) : null}
              {detailError ? <p className="alert alert-error">{detailError}</p> : null}
              {!detailLoading && detailTicket && detailParsed ? (
                <>
                  <div className="ticket-detail-modal-hero">
                    <div className="ticket-detail-modal-hero-text">
                      <p className="ticket-detail-ticket-id">
                        {detailTicket.id != null ? `Ticket #${detailTicket.id}` : "Ticket"}
                      </p>
                      <h4 className="ticket-detail-heading">{detailTicket.title || "Untitled ticket"}</h4>
                      <span
                        className={`my-ticket-card-badge status-badge ${toToken(detailTicket.status || "unknown")}`}
                      >
                        {formatTicketStatusLabel(detailTicket.status)}
                      </span>
                    </div>
                  </div>
                  {normalizeTicketStatus(detailTicket.status) === "WITHDRAWN" ? (
                    <div
                      className={`admin-ticket-detail-withdrawal-banner${formatWithdrawalReasonForDisplay(detailTicket) ? "" : " admin-ticket-detail-withdrawal-banner--muted"}`}
                      role="status"
                    >
                      <span className="admin-ticket-detail-withdrawal-banner-label">Withdrawal reason</span>
                      <p className="admin-ticket-detail-withdrawal-banner-text">
                        {formatWithdrawalReasonForDisplay(detailTicket) ||
                          "No withdrawal details recorded."}
                      </p>
                    </div>
                  ) : null}
                  <div className="ticket-detail-modal-body">
                    <div className="ticket-detail-modal-fields">
                      <div className="ticket-detail-row">
                        <div className="ticket-detail-label">Created by (username)</div>
                        <div className="ticket-detail-value">
                          {detailTicket.createdByUsername || "—"}
                        </div>
                      </div>
                      <div className="ticket-detail-row">
                        <div className="ticket-detail-label">Created by (user ID)</div>
                        <div className="ticket-detail-value">{detailTicket.createdByUserId || "—"}</div>
                      </div>
                      <div className="ticket-detail-row ticket-detail-row--assign">
                        <div className="ticket-detail-label">Assigned technician</div>
                        <div className="ticket-detail-assign-row">
                          <div className="ticket-detail-value">
                            {detailTicket.assignedTechnicianUsername || "—"}
                            {detailTicket.assignedTechnicianUserId
                              ? ` · ${detailTicket.assignedTechnicianUserId}`
                              : ""}
                          </div>
                          <Button
                            type="button"
                            variant="primary"
                            className="ticket-detail-assign-btn"
                            onClick={() => openAssignTicket(detailTicket)}
                          >
                            {detailTicket.assignedTechnicianUserId ||
                            detailTicket.assignedTechnicianUsername
                              ? "Reassign"
                              : "Assign"}
                          </Button>
                        </div>
                      </div>
                      {detailTicket.createdAt ? (
                        <div className="ticket-detail-row">
                          <div className="ticket-detail-label">Submitted</div>
                          <div className="ticket-detail-value">{formatDateTime(detailTicket.createdAt)}</div>
                        </div>
                      ) : null}
                      <div className="ticket-detail-row">
                        <div className="ticket-detail-label">Location</div>
                        <div className="ticket-detail-value">{detailParsed.location || "—"}</div>
                      </div>
                      <div className="ticket-detail-row">
                        <div className="ticket-detail-label">Priority</div>
                        <div className="ticket-detail-value">{detailParsed.priority || "Normal"}</div>
                      </div>
                      <div className="ticket-detail-row">
                        <div className="ticket-detail-label">Preferred contact</div>
                        <div className="ticket-detail-value">
                          {detailParsed.contactMethod || "—"}
                          {detailParsed.contactDetails ? ` · ${detailParsed.contactDetails}` : ""}
                        </div>
                      </div>
                      <div className="ticket-detail-row ticket-detail-row--block">
                        <div className="ticket-detail-label">Description</div>
                        <div className="ticket-detail-value ticket-detail-description">
                          {detailParsed.content || "No description provided."}
                        </div>
                      </div>
                      {detailTicket.attachments && detailTicket.attachments.length > 0 ? (
                        <div className="ticket-detail-row ticket-detail-row--block">
                          <div className="ticket-detail-label">Attachments</div>
                          <div className="ticket-detail-value">
                            <ul className="admin-ticket-attachment-list">
                              {detailTicket.attachments.map((a) => (
                                <li key={a.id || a.fileName}>{a.fileName || "File"}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="modal-actions">
                    <Button type="button" variant="secondary" onClick={closeDetailModal}>
                      Close
                    </Button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {assignOpen ? (
        <div
          className="modal-backdrop"
          onClick={() => !assignSubmitting && closeAssignModal()}
          role="presentation"
        >
          <div
            className="modal-panel modal-panel--admin-assign"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-assign-title"
            aria-describedby="admin-assign-desc"
          >
            <div className="modal-header">
              <div className="modal-header-main">
                <h3 id="admin-assign-title">Assign technician</h3>
                <p id="admin-assign-desc" className="modal-subtitle">
                  Pick who will take this ticket. They will see it in their queue.
                </p>
              </div>
              <button
                className="modal-close"
                disabled={assignSubmitting}
                onClick={closeAssignModal}
                type="button"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-content admin-assign-modal">
              {assignTicket ? (
                <div className="admin-assign-ticket-card">
                  <div className="admin-assign-ticket-card-top">
                    <span
                      className={`my-ticket-card-badge status-badge ${toToken(assignTicket.status || "unknown")}`}
                    >
                      {formatTicketStatusLabel(assignTicket.status)}
                    </span>
                  </div>
                  <h4 className="admin-assign-ticket-title">
                    {assignTicket.title?.trim() || "Untitled ticket"}
                  </h4>
                  <div className="admin-assign-ticket-id-row">
                    <span className="admin-assign-ticket-id-label">Ticket ID</span>
                    <code className="admin-assign-ticket-id-short" title={assignTicket.id || undefined}>
                      {shortTicketReference(assignTicket.id)}
                    </code>
                    {assignTicket.id ? (
                      <button
                        type="button"
                        className="text-link admin-assign-copy-id"
                        onClick={copyAssignTicketId}
                        disabled={assignSubmitting}
                      >
                        {assignIdCopied ? "Copied" : "Copy full ID"}
                      </button>
                    ) : null}
                  </div>
                  {assignTicket && normalizeTicketStatus(assignTicket.status) === "WITHDRAWN" ? (
                    <div
                      className={`admin-assign-withdrawal-note${formatWithdrawalReasonForDisplay(assignTicket) ? "" : " admin-assign-withdrawal-note--muted"}`}
                      role="status"
                    >
                      <span className="admin-assign-withdrawal-note-label">Withdrawal reason</span>
                      <p className="admin-assign-withdrawal-note-text">
                        {formatWithdrawalReasonForDisplay(assignTicket) ||
                          "No withdrawal details recorded."}
                      </p>
                      <p className="admin-assign-withdrawal-note-hint">
                        Assigning will move this ticket back to <strong>In progress</strong> for the technician.
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {assignListLoading ? (
                <p className="supporting-text admin-assign-loading">Loading technicians…</p>
              ) : null}
              {assignListError ? <p className="alert alert-error">{assignListError}</p> : null}
              {assignActionError ? <p className="alert alert-error">{assignActionError}</p> : null}
              {!assignListLoading && technicians.length > 0 ? (
                <fieldset className="admin-assign-fieldset">
                  <legend className="admin-assign-legend">Choose technician</legend>
                  <div className="admin-assign-tech-list">
                    {technicians.map((tech) => {
                      const { name, team } = parseTechnicianDisplay(tech.fullName);
                      const selected = selectedTechnicianId === tech.id;
                      return (
                        <label
                          key={tech.id}
                          className={`admin-assign-tech-card${selected ? " is-selected" : ""}`}
                        >
                          <input
                            type="radio"
                            name="assign-technician"
                            className="admin-assign-tech-radio"
                            value={tech.id}
                            checked={selected}
                            onChange={() => setSelectedTechnicianId(tech.id)}
                            disabled={assignSubmitting}
                          />
                          <span className="admin-assign-tech-avatar" aria-hidden="true">
                            {technicianInitials(name)}
                          </span>
                          <span className="admin-assign-tech-body">
                            <span className="admin-assign-tech-name">{name}</span>
                            {team ? (
                              <span className="admin-assign-tech-team">{team}</span>
                            ) : null}
                            <span className="admin-assign-tech-email">{tech.email}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ) : null}
              {!assignListLoading && !assignListError && technicians.length === 0 ? (
                <p className="supporting-text">
                  No technicians available. Add technician accounts in the system first.
                </p>
              ) : null}
              <div className="modal-actions modal-actions--assign">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={assignSubmitting}
                  onClick={closeAssignModal}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={
                    assignSubmitting ||
                    !selectedTechnicianId ||
                    technicians.length === 0 ||
                    !!assignListError
                  }
                  onClick={confirmAssignTechnician}
                >
                  {assignSubmitting ? "Saving…" : "Confirm assignment"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default ManageTicketsPage;
