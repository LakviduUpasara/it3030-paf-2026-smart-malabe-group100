import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import TechnicianTicketModalWorkPanel from "../../components/technician/TechnicianTicketModalWorkPanel";
import TechnicianTicketReadonlySummary from "../../components/technician/TechnicianTicketReadonlySummary";
import { getMyTickets, getTicketById } from "../../services/ticketService";
import { isResolvedTicketStatus } from "../../utils/technicianTicketStatus";
import { toToken } from "../../utils/formatters";
import { normalizeTicketFromApi } from "../../utils/ticketNormalize";
import { parseTicketDescription } from "../../utils/ticketDescription";

const STICKY_FILTER_SECTION_STYLE = {
  position: "sticky",
  top: "calc(var(--navbar-measured-height, 0px) + 12px)",
  zIndex: 5,
};

function formatStatusLabel(status) {
  const s = String(status || "")
    .trim()
    .toUpperCase();
  if (s === "RESOLVED") return "Resolved";
  if (s === "CLOSED") return "Closed";
  return String(status || "—")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function TechnicianResolvedTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeDetailTicketId, setActiveDetailTicketId] = useState(null);
  const [detailTicket, setDetailTicket] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [filterQuery, setFilterQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const loadTickets = useCallback(async () => {
    const res = await getMyTickets();
    const data = res?.data;
    const list = Array.isArray(data) ? data : [];
    setTickets(list.map(normalizeTicketFromApi));
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        await loadTickets();
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
  }, [loadTickets]);

  const closeDetailModal = useCallback(() => {
    setActiveDetailTicketId(null);
    setDetailTicket(null);
    setDetailError("");
    setDetailLoading(false);
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

  const handleDetailTicketUpdated = useCallback((normalized) => {
    if (!normalized?.id) return;
    const id = String(normalized.id);
    setDetailTicket(normalized);
    setTickets((prev) => prev.map((t) => (String(t.id) === id ? normalized : t)));
  }, []);

  const resolvedTickets = useMemo(
    () => tickets.filter((t) => isResolvedTicketStatus(t?.status)),
    [tickets],
  );
  const filteredResolvedTickets = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    return resolvedTickets.filter((ticket) => {
      const parsed = parseTicketDescription(ticket?.description);
      const priority = String(parsed.priority || "Normal").trim();
      const status = String(ticket?.status || "")
        .trim()
        .toUpperCase();
      const matchesPriority = !filterPriority || priority.toLowerCase() === filterPriority.toLowerCase();
      const matchesStatus = !filterStatus || status === filterStatus;
      if (!matchesPriority || !matchesStatus) return false;
      if (!q) return true;
      const haystack = [ticket?.id, ticket?.title, ticket?.description, priority, formatStatusLabel(ticket?.status)]
        .map((v) => String(v || "").toLowerCase())
        .join(" ");
      return haystack.includes(q);
    });
  }, [resolvedTickets, filterQuery, filterPriority, filterStatus]);
  const hasActiveFilters = filterQuery.trim() !== "" || filterPriority !== "" || filterStatus !== "";
  const clearFilters = useCallback(() => {
    setFilterQuery("");
    setFilterPriority("");
    setFilterStatus("");
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading resolved tickets..." />;
  }

  return (
    <div className="technician-page">
      {resolvedTickets.length ? (
        <Card
          className="technician-page-card"
          title="Search and filters"
          style={STICKY_FILTER_SECTION_STYLE}
        >
          <div className="technician-filters my-tickets-filters" aria-label="Search and filter resolved tickets">
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
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
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
        subtitle="Reopen a ticket if you need to add more work or corrections."
        title="Resolved"
      >
        {error ? <p className="alert alert-error">{error}</p> : null}
        {!resolvedTickets.length ? (
          <p className="supporting-text">
            No resolved tickets yet. When you mark work complete from a ticket, it appears here.
          </p>
        ) : (
          <>
            {!filteredResolvedTickets.length ? (
              <p className="supporting-text technician-filter-empty" role="status">
                No resolved tickets match your filters.
              </p>
            ) : (
              <div
                className="technician-table-wrapper"
                role="region"
                aria-label="Resolved tickets"
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
                    {filteredResolvedTickets.map((ticket) => {
                      const statusToken = toToken(ticket.status);
                      const parsed = parseTicketDescription(ticket.description);
                      return (
                        <tr key={ticket.id}>
                          <td>{ticket.id ?? "—"}</td>
                          <td>
                            <div className="technician-table-title">
                              <span className="technician-table-ticket-title">
                                {ticket.title?.trim() || "Untitled"}
                              </span>
                            </div>
                          </td>
                          <td>{parsed.priority?.trim() || "Normal"}</td>
                          <td>
                            <span
                              className={`status-badge ${statusToken}`}
                              title={formatStatusLabel(ticket.status)}
                            >
                              {formatStatusLabel(ticket.status)}
                            </span>
                          </td>
                          <td className="technician-table-actions-cell">
                            <div className="technician-table-actions">
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setActiveDetailTicketId(String(ticket.id))}
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
            aria-labelledby="technician-resolved-detail-title"
          >
            <div className="modal-header">
              <h3 id="technician-resolved-detail-title">Ticket details</h3>
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
              {detailLoading ? <LoadingSpinner label="Loading ticket..." /> : null}
              {detailError ? <p className="alert alert-error">{detailError}</p> : null}
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
            {!detailLoading && !detailError ? (
              <div className="modal-footer">
                <Button type="button" variant="secondary" onClick={closeDetailModal}>
                  Close
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default TechnicianResolvedTicketsPage;
