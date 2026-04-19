import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminCategoriesPanel from "../components/AdminCategoriesPanel";
import AdminTechniciansPanel from "../components/AdminTechniciansPanel";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import TicketCard from "../components/TicketCard";
import { getTechnicians } from "../services/adminService";
import {
  assignTicketToTechnician,
  fetchAttachmentPreview,
  getTicketById,
  getTickets,
} from "../services/ticketService";
import { parseTicketDescription } from "../utils/ticketDescription";
import { formatDateTime, toToken } from "../utils/formatters";
import { formatWithdrawalReasonForDisplay } from "../utils/withdrawalReason";

function formatTicketStatusLabel(status) {
  const raw = String(status || "OPEN").trim().toUpperCase().replace(/\s+/g, "_");
  if (raw === "IN_PROGRESS") return "In Progress";
  if (raw === "ACCEPTED") return "Accepted";
  if (raw === "ASSIGNED") return "Awaiting technician";
  if (raw === "OPEN") return "Open";
  if (raw === "REJECTED") return "Rejected";
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

function isImageAttachment(mime, fileName) {
  if (mime && String(mime).startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|bmp)$/i.test(fileName || "");
}

function normalizeTicketStatus(status) {
  return String(status || "OPEN")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function buildAdminTicketSearchBlob(ticket) {
  const updates = Array.isArray(ticket?.updates) ? ticket.updates : [];
  const updateText = updates.map((u) => String(u?.message ?? "")).join(" ");
  return [
    ticket?.id,
    ticket?.title,
    ticket?.description,
    ticket?.createdByUsername,
    ticket?.createdByUserId,
    ticket?.assignedTechnicianUsername,
    ticket?.assignedTechnicianUserId,
    ticket?.categoryId,
    ticket?.subCategoryId,
    ticket?.technicianAssignmentRejectionNote,
    updateText,
  ]
    .map((s) => String(s ?? "").toLowerCase())
    .join(" \n ");
}

function adminTicketMatchesSearch(ticket, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  return buildAdminTicketSearchBlob(ticket).includes(q);
}

function ticketHasAssignee(ticket) {
  return Boolean(
    (ticket?.assignedTechnicianUserId && String(ticket.assignedTechnicianUserId).trim()) ||
      (ticket?.assignedTechnicianUsername && String(ticket.assignedTechnicianUsername).trim()),
  );
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
  "technicians",
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

  const [requesterPreviewById, setRequesterPreviewById] = useState({});
  const [technicianPreviewById, setTechnicianPreviewById] = useState({});

  const [filterQuery, setFilterQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("all");

  const requesterAttachmentKey = useMemo(() => {
    const list = Array.isArray(detailTicket?.attachments) ? detailTicket.attachments : [];
    return list.map((a) => a?.id).filter(Boolean).join("|");
  }, [detailTicket?.attachments]);

  const technicianAttachmentKey = useMemo(() => {
    const list = Array.isArray(detailTicket?.technicianAttachments)
      ? detailTicket.technicianAttachments
      : [];
    return list.map((a) => a?.id).filter(Boolean).join("|");
  }, [detailTicket?.technicianAttachments]);

  /** Oldest first for a readable timeline (same fields as student "Technician updates"). */
  const sortedTechnicianUpdates = useMemo(() => {
    const raw = Array.isArray(detailTicket?.updates) ? detailTicket.updates : [];
    return [...raw].sort((a, b) => {
      const ta = a.timestamp ? Date.parse(String(a.timestamp)) : 0;
      const tb = b.timestamp ? Date.parse(String(b.timestamp)) : 0;
      return ta - tb;
    });
  }, [detailTicket?.updates]);

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

  const sectionTickets = useMemo(() => {
    if (activeSection === "categories" || activeSection === "technicians") {
      return [];
    }
    const def = ADMIN_TICKET_SECTIONS.find((sec) => sec.id === activeSection);
    const want = def ? def.status : "OPEN";
    return tickets.filter((t) => {
      const s = normalizeTicketStatus(t?.status);
      if (activeSection === "assigned") {
        return s === "IN_PROGRESS" || s === "ASSIGNED" || s === "ACCEPTED";
      }
      if (activeSection === "open") {
        return s === "OPEN" || s === "REJECTED";
      }
      return s === want;
    });
  }, [tickets, activeSection]);

  const displayTickets = useMemo(() => {
    return sectionTickets.filter((t) => {
      if (filterPriority) {
        const parsed = parseTicketDescription(t.description);
        const p = String(parsed.priority || "Normal").trim();
        if (p !== filterPriority) return false;
      }
      if (filterAssignee === "assigned" && !ticketHasAssignee(t)) return false;
      if (filterAssignee === "unassigned" && ticketHasAssignee(t)) return false;
      if (!adminTicketMatchesSearch(t, filterQuery)) return false;
      return true;
    });
  }, [sectionTickets, filterPriority, filterAssignee, filterQuery]);

  const hasListFilters =
    Boolean(filterQuery.trim()) || Boolean(filterPriority) || filterAssignee !== "all";

  const clearListFilters = () => {
    setFilterQuery("");
    setFilterPriority("");
    setFilterAssignee("all");
  };

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

  useEffect(() => {
    if (!detailTicket?.id) {
      setRequesterPreviewById((prev) => {
        Object.values(prev).forEach((entry) => {
          if (entry?.url) URL.revokeObjectURL(entry.url);
        });
        return {};
      });
      return undefined;
    }
    const atts = Array.isArray(detailTicket.attachments) ? detailTicket.attachments : [];
    if (atts.length === 0) {
      setRequesterPreviewById((prev) => {
        Object.values(prev).forEach((entry) => {
          if (entry?.url) URL.revokeObjectURL(entry.url);
        });
        return {};
      });
      return undefined;
    }

    let cancelled = false;
    async function loadRequesterPreviews() {
      const next = {};
      for (const att of atts) {
        if (!att?.id) continue;
        try {
          const preview = await fetchAttachmentPreview(detailTicket.id, att.id, {
            fileNameHint: att.fileName,
          });
          if (!cancelled) {
            next[att.id] = { ...preview, fileName: att.fileName || "" };
          }
        } catch {
          /* skip failed preview */
        }
      }
      if (!cancelled) {
        setRequesterPreviewById((prev) => {
          Object.values(prev).forEach((entry) => {
            if (entry?.url) URL.revokeObjectURL(entry.url);
          });
          return next;
        });
      }
    }
    loadRequesterPreviews();
    return () => {
      cancelled = true;
    };
  }, [detailTicket?.id, requesterAttachmentKey]);

  useEffect(() => {
    if (!detailTicket?.id) {
      setTechnicianPreviewById((prev) => {
        Object.values(prev).forEach((entry) => {
          if (entry?.url) URL.revokeObjectURL(entry.url);
        });
        return {};
      });
      return undefined;
    }
    const atts = Array.isArray(detailTicket.technicianAttachments)
      ? detailTicket.technicianAttachments
      : [];
    if (atts.length === 0) {
      setTechnicianPreviewById((prev) => {
        Object.values(prev).forEach((entry) => {
          if (entry?.url) URL.revokeObjectURL(entry.url);
        });
        return {};
      });
      return undefined;
    }

    let cancelled = false;
    async function loadTechnicianPreviews() {
      const next = {};
      for (const att of atts) {
        if (!att?.id) continue;
        try {
          const preview = await fetchAttachmentPreview(detailTicket.id, att.id, {
            fileNameHint: att.fileName,
          });
          if (!cancelled) {
            next[att.id] = { ...preview, fileName: att.fileName || "" };
          }
        } catch {
          /* skip failed preview */
        }
      }
      if (!cancelled) {
        setTechnicianPreviewById((prev) => {
          Object.values(prev).forEach((entry) => {
            if (entry?.url) URL.revokeObjectURL(entry.url);
          });
          return next;
        });
      }
    }
    loadTechnicianPreviews();
    return () => {
      cancelled = true;
    };
  }, [detailTicket?.id, technicianAttachmentKey]);

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
    const assignStatus = normalizeTicketStatus(ticket.status);
    if (assignStatus === "RESOLVED" || assignStatus === "WITHDRAWN") return;
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

  const detailStatusNorm = detailTicket ? normalizeTicketStatus(detailTicket.status) : "";
  const detailAssignmentLocked =
    detailStatusNorm === "RESOLVED" || detailStatusNorm === "WITHDRAWN";
  const detailAssignmentLockedTitle =
    detailStatusNorm === "RESOLVED"
      ? "Resolved tickets cannot be reassigned."
      : detailStatusNorm === "WITHDRAWN"
        ? "Withdrawn tickets cannot be reassigned."
        : "";

  const emptySectionMessage =
    activeSection === "open"
      ? "No open tickets awaiting assignment."
      : activeSection === "assigned"
        ? "No tickets are currently assigned to a technician."
        : activeSection === "resolved"
          ? "No resolved tickets yet."
          : "No withdrawn tickets.";

  const showTicketList = activeSection !== "categories" && activeSection !== "technicians";

  return (
    <>
      <div className="admin-tickets-layout admin-tickets-layout--no-rail">
        <div className="admin-tickets-main admin-tickets-main--standalone">
          {showTicketList ? (
            <Card
              title="Manage Tickets"
              subtitle="Search by ticket ID, requester, technician, title, description, or updates. Filter by priority and assignment."
            >
              {error && <p className="alert alert-error">{error}</p>}

              {!error && tickets.length === 0 && (
                <p className="supporting-text">No tickets yet.</p>
              )}

              {!error && tickets.length > 0 && sectionTickets.length === 0 && (
                <p className="supporting-text">{emptySectionMessage}</p>
              )}

              {!error && tickets.length > 0 && sectionTickets.length > 0 ? (
                <>
                  <div
                    className="my-tickets-filters admin-ticket-list-filters"
                    aria-label="Search and filter tickets"
                  >
                    <div className="my-tickets-filters-search-row">
                      <label className="my-tickets-filters-search">
                        <span>Search</span>
                        <input
                          autoComplete="off"
                          type="search"
                          placeholder="Ticket ID, title, requester, technician, description, updates…"
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
                      <label className="my-tickets-filter-field">
                        <span>Assignment</span>
                        <select
                          value={filterAssignee}
                          onChange={(e) => setFilterAssignee(e.target.value)}
                        >
                          <option value="all">All</option>
                          <option value="assigned">Assigned to a technician</option>
                          <option value="unassigned">Not assigned</option>
                        </select>
                      </label>
                      {hasListFilters ? (
                        <Button type="button" variant="ghost" onClick={clearListFilters}>
                          Clear filters
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {displayTickets.length === 0 ? (
                    <p className="supporting-text my-tickets-filter-empty" role="status">
                      No tickets match your search or filters.{" "}
                      <button className="link-button" type="button" onClick={clearListFilters}>
                        Clear filters
                      </button>
                    </p>
                  ) : hasListFilters ? (
                    <p className="supporting-text admin-ticket-list-count" role="status">
                      Showing {displayTickets.length} of {sectionTickets.length} tickets in this queue.
                    </p>
                  ) : null}
                </>
              ) : null}

              <div className="list-stack">
                {displayTickets.map((ticket, index) => (
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
          ) : activeSection === "categories" ? (
            <AdminCategoriesPanel />
          ) : (
            <AdminTechniciansPanel />
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
                  {normalizeTicketStatus(detailTicket.status) === "OPEN" &&
                  detailTicket.technicianAssignmentRejectionNote &&
                  String(detailTicket.technicianAssignmentRejectionNote).trim() ? (
                    <div className="admin-ticket-detail-withdrawal-banner" role="status">
                      <span className="admin-ticket-detail-withdrawal-banner-label">
                        Last technician declined
                      </span>
                      <p className="admin-ticket-detail-withdrawal-banner-text">
                        {String(detailTicket.technicianAssignmentRejectionNote).trim()}
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
                          {detailAssignmentLocked ? (
                            <span
                              className="ticket-detail-assign-locked"
                              title={detailAssignmentLockedTitle || undefined}
                            >
                              Assignment closed
                            </span>
                          ) : (
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
                          )}
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
                      {sortedTechnicianUpdates.length > 0 ? (
                        <div className="ticket-detail-row ticket-detail-row--block">
                          <div className="ticket-detail-label">Technician updates</div>
                          <div className="ticket-detail-value">
                            <ul className="ticket-detail-updates-list">
                              {sortedTechnicianUpdates.map((u) => (
                                <li className="ticket-detail-update-item" key={u.id || u.message}>
                                  <div className="ticket-detail-update-meta">
                                    {[u.updatedBy, u.timestamp ? formatDateTime(u.timestamp) : null]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </div>
                                  <p className="ticket-detail-update-message">{u.message || "—"}</p>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : null}
                      {detailTicket.attachments && detailTicket.attachments.length > 0 ? (
                        <div className="ticket-detail-row ticket-detail-row--block">
                          <div className="ticket-detail-label">Requester attachments</div>
                          <div className="ticket-detail-value">
                            <ul className="ticket-detail-evidence-list">
                              {detailTicket.attachments.map((att) => {
                                const preview = requesterPreviewById[att.id];
                                const name = att.fileName || "Attachment";
                                const showImg = preview?.url && isImageAttachment(preview.mime, name);
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
                        </div>
                      ) : null}
                      {detailTicket.technicianAttachments && detailTicket.technicianAttachments.length > 0 ? (
                        <div className="ticket-detail-row ticket-detail-row--block">
                          <div className="ticket-detail-label">Technician evidence</div>
                          <div className="ticket-detail-value">
                            <ul className="ticket-detail-evidence-list">
                              {detailTicket.technicianAttachments.map((att) => {
                                const preview = technicianPreviewById[att.id];
                                const name = att.fileName || "Attachment";
                                const showImg = preview?.url && isImageAttachment(preview.mime, name);
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
                  No technicians available. Use <strong>Setup → Technicians</strong> on this page to add accounts.
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
