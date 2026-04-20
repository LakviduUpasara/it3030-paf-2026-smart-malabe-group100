import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import TechnicianTicketModalWorkPanel from "../../components/technician/TechnicianTicketModalWorkPanel";
import TechnicianTicketReadonlySummary from "../../components/technician/TechnicianTicketReadonlySummary";
import {
  acceptTicketAssignment,
  getMyTickets,
  getTicketById,
  rejectTicketAssignment,
} from "../../services/ticketService";
import {
  canOpenAcceptPage,
  canUseRejectFlow,
  isAwaitingTechnicianDecision,
  labelForAwaitingTechnicianDecision,
} from "../../utils/technicianTicketFlow";
import { formatDateTime, toToken } from "../../utils/formatters";
import { normalizeTicketFromApi } from "../../utils/ticketNormalize";
import { isActiveTicketStatus } from "../../utils/technicianTicketStatus";
import { parseTicketDescription } from "../../utils/ticketDescription";

const REJECT_REASON_MIN = 3;
const REJECT_REASON_MAX = 500;
const REJECT_REASON_OTHER = "__OTHER__";
const STICKY_FILTER_SECTION_STYLE = {
  position: "sticky",
  top: "calc(var(--navbar-measured-height, 0px) + 12px)",
  zIndex: 5,
};
const REJECT_REASON_OPTIONS = [
  { value: "Outside my area of responsibility", label: "Outside my area of responsibility" },
  { value: "Need a specialist for this issue", label: "Need a specialist for this issue" },
  { value: "Insufficient information to proceed", label: "Insufficient information to proceed" },
  { value: REJECT_REASON_OTHER, label: "Other (type reason)" },
];

function TechnicianAcceptQueuePage() {
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
  const [rejectFlowStep, setRejectFlowStep] = useState("idle");
  const [rejectReasonPreset, setRejectReasonPreset] = useState("");
  const [rejectReasonOther, setRejectReasonOther] = useState("");
  const [filterQuery, setFilterQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  const loadTickets = useCallback(async () => {
    const res = await getMyTickets();
    const data = res?.data;
    const list = Array.isArray(data) ? data : [];
    setTickets(list.map(normalizeTicketFromApi));
  }, []);

  const closeDetailModal = useCallback(() => {
    setActiveDetailTicketId(null);
    setDetailTicket(null);
    setDetailError("");
    setDetailLoading(false);
    setModalActionBusy(false);
    setModalActionError("");
    setRejectFlowStep("idle");
    setRejectReasonPreset("");
    setRejectReasonOther("");
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        await loadTickets();
      } catch (e) {
        if (active) setError(e.message || "Failed to load tickets.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [loadTickets]);

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

  /** Assignments awaiting accept or decline (not yet accepted for work). */
  const pendingDecision = useMemo(
    () =>
      tickets.filter((t) => t && isAwaitingTechnicianDecision(t) && isActiveTicketStatus(t.status)),
    [tickets],
  );
  const filteredPendingDecision = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    return pendingDecision.filter((ticket) => {
      const parsed = parseTicketDescription(ticket?.description);
      const priority = String(parsed.priority || "Normal").trim();
      const matchesPriority = !filterPriority || priority.toLowerCase() === filterPriority.toLowerCase();
      if (!matchesPriority) return false;
      if (!q) return true;
      const haystack = [
        ticket?.id,
        ticket?.title,
        ticket?.createdByUsername,
        ticket?.description,
        priority,
      ]
        .map((v) => String(v || "").toLowerCase())
        .join(" ");
      return haystack.includes(q);
    });
  }, [pendingDecision, filterQuery, filterPriority]);
  const hasActiveFilters = filterQuery.trim() !== "" || filterPriority !== "";
  const clearFilters = useCallback(() => {
    setFilterQuery("");
    setFilterPriority("");
  }, []);

  const handleModalAccept = useCallback(async () => {
    if (!detailTicket?.id) return;
    const id = String(detailTicket.id);
    setModalActionError("");
    setModalActionBusy(true);
    try {
      const res = await acceptTicketAssignment(id);
      const updated = normalizeTicketFromApi(res?.data);
      if (updated) {
        setDetailTicket(updated);
        setTickets((prev) => prev.map((t) => (String(t.id) === id ? updated : t)));
      }
      await loadTickets();
      closeDetailModal();
      navigate("/technician/accept");
    } catch (e) {
      setModalActionError(e.message || "Could not accept assignment.");
    } finally {
      setModalActionBusy(false);
    }
  }, [detailTicket?.id, closeDetailModal, navigate, loadTickets]);

  const handleModalReject = useCallback(() => {
    if (!detailTicket?.id || modalActionBusy) return;
    setModalActionError("");
    setRejectFlowStep("confirm");
  }, [detailTicket?.id, modalActionBusy]);

  const handleConfirmReject = useCallback(() => {
    if (modalActionBusy) return;
    setModalActionError("");
    setRejectFlowStep("reason");
  }, [modalActionBusy]);

  const handleCancelRejectFlow = useCallback(() => {
    if (modalActionBusy) return;
    setModalActionError("");
    setRejectFlowStep("idle");
    setRejectReasonPreset("");
    setRejectReasonOther("");
  }, [modalActionBusy]);

  const handleSubmitReject = useCallback(async () => {
    if (!detailTicket?.id) return;
    const id = String(detailTicket.id);
    const selected = rejectReasonPreset.trim();
    const typedOther = rejectReasonOther.trim();
    const finalReason = selected === REJECT_REASON_OTHER ? typedOther : selected;
    const trimmed = finalReason.trim();
    if (trimmed.length < REJECT_REASON_MIN) {
      setModalActionError(`A reason is required (at least ${REJECT_REASON_MIN} characters).`);
      return;
    }
    setModalActionError("");
    setModalActionBusy(true);
    try {
      await rejectTicketAssignment(id, { reason: trimmed });
      await loadTickets();
      closeDetailModal();
      navigate("/technician/tickets");
    } catch (e) {
      setModalActionError(e.message || "Could not reject assignment.");
    } finally {
      setModalActionBusy(false);
    }
  }, [detailTicket?.id, rejectReasonPreset, rejectReasonOther, loadTickets, closeDetailModal, navigate]);

  /** Accept only while assignment is still pending. */
  const showModalAccept = Boolean(
    detailTicket && canOpenAcceptPage(detailTicket) && isAwaitingTechnicianDecision(detailTicket),
  );
  const showModalReject = Boolean(detailTicket && canUseRejectFlow(detailTicket));

  const handleDetailTicketUpdated = useCallback((normalized) => {
    if (!normalized?.id) return;
    const id = String(normalized.id);
    setDetailTicket(normalized);
    setTickets((prev) => prev.map((t) => (String(t.id) === id ? normalized : t)));
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading…" />;
  }

  return (
    <div className="technician-page">
      {pendingDecision.length ? (
        <Card
          className="technician-page-card"
          title="Search and filters"
          style={STICKY_FILTER_SECTION_STYLE}
        >
          <div className="technician-filters my-tickets-filters" aria-label="Search and filter open tickets">
            <div className="my-tickets-filters-search-row">
              <label className="my-tickets-filters-search">
                <span>Search</span>
                <input
                  autoComplete="off"
                  type="search"
                  placeholder="Ticket ID, title, requester, description"
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
        subtitle="The desk has assigned these tickets to you — accept to move them to Assigned tickets, or reject with a required reason."
        title="Open tickets"
      >
        {error ? <p className="alert alert-error">{error}</p> : null}
        {!pendingDecision.length ? (
          <p className="supporting-text">
            No assignments awaiting your decision. When the desk assigns work to you, it appears here until you accept
            or reject.
          </p>
        ) : (
          <>
            {!filteredPendingDecision.length ? (
              <p className="supporting-text technician-filter-empty" role="status">
                No open tickets match your filters.
              </p>
            ) : (
              <div
                className="technician-table-wrapper"
                role="region"
                aria-label="Assigned tickets"
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
                    {filteredPendingDecision.map((ticket) => {
                      const parsed = parseTicketDescription(ticket.description);
                      return (
                        <tr key={ticket.id}>
                          <td>{ticket.id ?? "—"}</td>
                          <td>
                            <div className="technician-table-title">
                              <span className="technician-table-ticket-title">
                                {ticket.title?.trim() || "Untitled"}
                              </span>
                              <span className="technician-table-ticket-id">
                                {ticket.createdByUsername ? `Requester: ${ticket.createdByUsername}` : "Requester: —"}
                                {ticket.createdAt ? ` · ${formatDateTime(ticket.createdAt)}` : ""}
                              </span>
                            </div>
                          </td>
                          <td>{parsed.priority?.trim() || "Normal"}</td>
                          <td>
                            <span
                              className={`status-badge ${toToken(ticket.status)}`}
                              title={labelForAwaitingTechnicianDecision(ticket)}
                            >
                              {labelForAwaitingTechnicianDecision(ticket)}
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
            aria-labelledby="technician-accept-queue-detail-title"
          >
            <div className="modal-header">
              <h3 id="technician-accept-queue-detail-title">Ticket details</h3>
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
              {modalActionError ? <p className="alert alert-error">{modalActionError}</p> : null}
              {!detailLoading && detailTicket ? (
                <>
                  <TechnicianTicketReadonlySummary ticket={detailTicket} />
                  {rejectFlowStep === "confirm" ? (
                    <p className="supporting-text mt-3">
                      Are you sure you want to reject this assignment? The ticket will return to{" "}
                      <strong>Open</strong> for admin reassignment.
                    </p>
                  ) : null}
                  {rejectFlowStep === "reason" ? (
                    <label className="field mt-3">
                      <span>
                        Reason for rejecting this assignment <span className="required-mark">*</span>
                      </span>
                      <select
                        aria-required="true"
                        className="w-full rounded-xl border border-border bg-surface p-3 text-sm"
                        onChange={(event) => {
                          setRejectReasonPreset(event.target.value);
                          setModalActionError("");
                        }}
                        required
                        value={rejectReasonPreset}
                      >
                        <option value="" disabled>
                          Select a reason
                        </option>
                        {REJECT_REASON_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {rejectReasonPreset === REJECT_REASON_OTHER ? (
                        <textarea
                          aria-required="true"
                          aria-invalid={
                            rejectReasonOther.trim().length > 0 &&
                            rejectReasonOther.trim().length < REJECT_REASON_MIN
                              ? "true"
                              : "false"
                          }
                          className="mt-2 min-h-[100px] w-full rounded-xl border border-border bg-surface p-3 text-sm"
                          maxLength={REJECT_REASON_MAX}
                          minLength={REJECT_REASON_MIN}
                          onChange={(event) => {
                            setRejectReasonOther(event.target.value);
                            setModalActionError("");
                          }}
                          placeholder="Type your reason"
                          required
                          value={rejectReasonOther}
                        />
                      ) : null}
                      <small className="supporting-text">
                        Minimum {REJECT_REASON_MIN} characters, max {REJECT_REASON_MAX}.
                      </small>
                    </label>
                  ) : null}
                  {!isAwaitingTechnicianDecision(detailTicket) ? (
                    <TechnicianTicketModalWorkPanel
                      onTicketUpdated={handleDetailTicketUpdated}
                      ticket={detailTicket}
                    />
                  ) : (
                    <p className="supporting-text mt-3">
                      Accept this assignment to add comments, evidence, and progress updates.
                    </p>
                  )}
                </>
              ) : null}
            </div>
            {!detailLoading && detailTicket && !detailError ? (
              <div className="modal-footer">
                {showModalAccept && rejectFlowStep === "idle" ? (
                  <Button type="button" disabled={modalActionBusy} onClick={handleModalAccept}>
                    Accept
                  </Button>
                ) : null}
                {showModalReject && rejectFlowStep === "idle" ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={modalActionBusy}
                    onClick={handleModalReject}
                  >
                    Reject
                  </Button>
                ) : null}
                {showModalReject && rejectFlowStep === "confirm" ? (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={modalActionBusy}
                      onClick={handleCancelRejectFlow}
                    >
                      Cancel
                    </Button>
                    <Button type="button" disabled={modalActionBusy} onClick={handleConfirmReject}>
                      Yes, continue
                    </Button>
                  </>
                ) : null}
                {showModalReject && rejectFlowStep === "reason" ? (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={modalActionBusy}
                      onClick={handleCancelRejectFlow}
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      disabled={
                        modalActionBusy ||
                        !rejectReasonPreset ||
                        (rejectReasonPreset === REJECT_REASON_OTHER &&
                          rejectReasonOther.trim().length < REJECT_REASON_MIN)
                      }
                      onClick={handleSubmitReject}
                    >
                      Confirm reject
                    </Button>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default TechnicianAcceptQueuePage;
