import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import TechnicianTicketModalWorkPanel from "../../components/technician/TechnicianTicketModalWorkPanel";
import TechnicianTicketReadonlySummary from "../../components/technician/TechnicianTicketReadonlySummary";
import { getMyTickets, getTicketById, updateStatus } from "../../services/ticketService";
import {
  canUseRejectFlow,
  isAcceptedTechnicianWork,
  isAwaitingTechnicianDecision,
} from "../../utils/technicianTicketFlow";
import { isActiveTicketStatus } from "../../utils/technicianTicketStatus";
import { toToken } from "../../utils/formatters";
import { parseTicketDescription } from "../../utils/ticketDescription";
import { normalizeTicketFromApi } from "../../utils/ticketNormalize";

const STICKY_FILTER_SECTION_STYLE = {
  position: "sticky",
  top: "calc(var(--navbar-measured-height, 0px) + 12px)",
  zIndex: 5,
};

function formatInlineStatus(ticket) {
  if (!ticket) return "—";
  if (isAwaitingTechnicianDecision(ticket)) return "Awaiting your response";
  if (isAcceptedTechnicianWork(ticket)) {
    const sk = String(ticket.status || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_");
    return sk === "ACCEPTED" ? "Accepted" : "In progress";
  }
  const s = String(ticket.status || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (s === "ASSIGNED") return "Awaiting your response";
  if (s === "IN_PROGRESS") return "In progress";
  return ticket.status || "—";
}

function TechnicianTicketsPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeDetailTicketId, setActiveDetailTicketId] = useState(null);
  const [detailTicket, setDetailTicket] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [modalActionBusy, setModalActionBusy] = useState(false);
  const [modalActionError, setModalActionError] = useState("");
  const [filterQuery, setFilterQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const closeDetailModal = useCallback(() => {
    setActiveDetailTicketId(null);
    setDetailTicket(null);
    setDetailError("");
    setDetailLoading(false);
    setModalActionBusy(false);
    setModalActionError("");
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getMyTickets();
        const data = res?.data;
        if (active) {
          const list = Array.isArray(data) ? data : [];
          setTickets(list.map(normalizeTicketFromApi));
        }
      } catch (e) {
        if (active) {
          setError(e.message || "Failed to load tickets.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!activeDetailTicketId) {
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setDetailLoading(true);
      setDetailError("");
      setDetailTicket(null);
      try {
        const res = await getTicketById(activeDetailTicketId);
        const data = res?.data;
        if (!cancelled && data) {
          setDetailTicket(normalizeTicketFromApi(data));
        }
      } catch (e) {
        if (!cancelled) {
          setDetailError(e.message || "Failed to load ticket.");
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeDetailTicketId]);

  useEffect(() => {
    if (!activeDetailTicketId) {
      return undefined;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        closeDetailModal();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeDetailTicketId, closeDetailModal]);

  const activeTickets = useMemo(
    () =>
      tickets.filter(
        (t) =>
          isActiveTicketStatus(t?.status) &&
          isAcceptedTechnicianWork(t) &&
          !isAwaitingTechnicianDecision(t),
      ),
    [tickets],
  );
  const filteredActiveTickets = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    return activeTickets.filter((ticket) => {
      const parsed = parseTicketDescription(ticket?.description);
      const priority = String(parsed.priority || "Normal").trim();
      const statusLabel = formatInlineStatus(ticket);
      const statusKey = String(ticket?.status || "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "_");
      const matchesPriority = !filterPriority || priority.toLowerCase() === filterPriority.toLowerCase();
      const matchesStatus =
        !filterStatus ||
        (filterStatus === "ACCEPTED" ? statusKey === "ACCEPTED" : statusKey === "IN_PROGRESS");
      if (!matchesPriority || !matchesStatus) return false;
      if (!q) return true;
      const haystack = [ticket?.id, ticket?.title, ticket?.description, priority, statusLabel]
        .map((v) => String(v || "").toLowerCase())
        .join(" ");
      return haystack.includes(q);
    });
  }, [activeTickets, filterQuery, filterPriority, filterStatus]);
  const hasActiveFilters = filterQuery.trim() !== "" || filterPriority !== "" || filterStatus !== "";
  const clearFilters = useCallback(() => {
    setFilterQuery("");
    setFilterPriority("");
    setFilterStatus("");
  }, []);

  const handleModalResolved = useCallback(async () => {
    if (!detailTicket?.id) return;
    const confirmResolve = window.confirm("Are you really resolved this ticket?");
    if (!confirmResolve) return;
    const id = String(detailTicket.id);
    setModalActionError("");
    setModalActionBusy(true);
    try {
      const res = await updateStatus(id, "RESOLVED");
      const updated = normalizeTicketFromApi(res?.data);
      if (updated) {
        setDetailTicket(updated);
        setTickets((prev) => prev.map((t) => (String(t.id) === id ? updated : t)));
      }
      closeDetailModal();
      navigate("/technician/resolved");
    } catch (e) {
      setModalActionError(e.message || "Could not mark ticket resolved.");
    } finally {
      setModalActionBusy(false);
    }
  }, [detailTicket?.id, closeDetailModal, navigate]);

  const handleModalReject = useCallback(() => {
    if (!detailTicket?.id) return;
    const id = String(detailTicket.id);
    closeDetailModal();
    navigate(`/technician/tickets/${id}/reject`);
  }, [detailTicket?.id, closeDetailModal, navigate]);

  const showModalReject = Boolean(detailTicket && canUseRejectFlow(detailTicket));

  const handleDetailTicketUpdated = useCallback((normalized) => {
    if (!normalized?.id) return;
    const id = String(normalized.id);
    setDetailTicket(normalized);
    setTickets((prev) => prev.map((t) => (String(t.id) === id ? normalized : t)));
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading assigned tickets..." />;
  }

  return (
    <div className="technician-page">
      {activeTickets.length ? (
        <Card
          className="technician-page-card"
          title="Search and filters"
          style={STICKY_FILTER_SECTION_STYLE}
        >
          <div className="technician-filters my-tickets-filters" aria-label="Search and filter accepted tickets">
            <div className="my-tickets-filters-search-row">
              <label className="my-tickets-filters-search">
                <span>Search</span>
                <input
                  autoComplete="off"
                  type="search"
                  placeholder="Ticket ID, title, description"
                  value={filterQuery}
                  onChange={(event) => setFilterQuery(event.target.value)}
                />
              </label>
            </div>
            <div className="my-tickets-filters-controls">
              <label className="my-tickets-filter-field">
                <span>Priority</span>
                <select value={filterPriority} onChange={(event) => setFilterPriority(event.target.value)}>
                  <option value="">All priorities</option>
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </label>
              <label className="my-tickets-filter-field">
                <span>Status</span>
                <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
                  <option value="">All statuses</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="IN_PROGRESS">In progress</option>
                </select>
              </label>
              {hasActiveFilters ? (
                <Button type="button" variant="ghost" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : null}
            </div>
          </div>
        </Card>
      ) : null}
      <Card
        className="technician-page-card"
        subtitle="Tickets you have accepted — open a row for details, comments, evidence, and resolution."
        title="Assigned tickets"
      >
        {error ? <p className="alert alert-error">{error}</p> : null}
        {!activeTickets.length ? (
          <p className="supporting-text">
            {tickets.length
              ? "No active assigned work — new assignments awaiting your decision are under Open tickets."
              : "You have no assigned tickets. Check back after the desk assigns work."}
          </p>
        ) : (
          <>
            {!filteredActiveTickets.length ? (
              <p className="supporting-text technician-filter-empty" role="status">
                No accepted tickets match your filters.
              </p>
            ) : (
              <div
                className="technician-table-wrapper"
                role="region"
                aria-label="Active assigned tickets"
              >
                <table className="technician-table">
                  <thead>
                    <tr>
                      <th scope="col">Ticket ID</th>
                      <th scope="col">Ticket title</th>
                      <th scope="col">Priority</th>
                      <th scope="col">Status</th>
                      <th scope="col" className="technician-table-actions-header">
                        See more
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActiveTickets.map((ticket) => {
                      const parsed = parseTicketDescription(ticket.description);
                      const statusToken = toToken(ticket.status || "unknown");
                      return (
                        <tr key={ticket.id}>
                          <td>{ticket.id ?? "—"}</td>
                          <td>
                            <div className="technician-table-title">
                              <span className="technician-table-ticket-title">
                                {ticket.title?.trim() || "Untitled request"}
                              </span>
                            </div>
                          </td>
                          <td>{parsed.priority?.trim() || "Normal"}</td>
                          <td>
                            <span
                              className={`status-badge ${statusToken}`}
                              title={formatInlineStatus(ticket)}
                            >
                              {formatInlineStatus(ticket)}
                            </span>
                          </td>
                          <td className="technician-table-actions-cell">
                            <div className="technician-table-actions">
                              <Button
                                type="button"
                                variant="secondary"
                                className="technician-see-details-button"
                                onClick={() => {
                                  setActiveDetailTicketId(String(ticket.id));
                                }}
                              >
                                See more
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
          </>
        )}
      </Card>

      {activeDetailTicketId ? (
        <div className="modal-backdrop" onClick={closeDetailModal} role="presentation">
          <div
            className="modal-panel modal-panel--ticket-detail"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="technician-queue-detail-title"
          >
            <div className="modal-header">
              <h3 id="technician-queue-detail-title">Ticket details</h3>
              <button
                type="button"
                className="modal-close"
                onClick={closeDetailModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-content technician-modal-detail-body">
              {detailLoading ? (
                <LoadingSpinner label="Loading ticket..." />
              ) : null}
              {detailError ? <p className="alert alert-error">{detailError}</p> : null}
              {modalActionError ? <p className="alert alert-error">{modalActionError}</p> : null}
              {!detailLoading && detailTicket ? (
                <>
                  <TechnicianTicketReadonlySummary ticket={detailTicket} />
                  <TechnicianTicketModalWorkPanel
                    onTicketUpdated={handleDetailTicketUpdated}
                    ticket={detailTicket}
                  />
                </>
              ) : null}
            </div>
            {!detailLoading && detailTicket && !detailError ? (
              <div className="modal-footer">
                <Button type="button" disabled={modalActionBusy} onClick={handleModalResolved}>
                  Resolved
                </Button>
                {showModalReject ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={modalActionBusy}
                    onClick={handleModalReject}
                  >
                    Reject
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="secondary"
                  disabled={modalActionBusy}
                  onClick={closeDetailModal}
                >
                  Cancel
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default TechnicianTicketsPage;
