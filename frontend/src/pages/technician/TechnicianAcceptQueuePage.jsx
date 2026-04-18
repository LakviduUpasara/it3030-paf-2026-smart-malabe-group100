import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import TechnicianRejectAssignmentModal from "../../components/technician/TechnicianRejectAssignmentModal";
import TechnicianTicketModalWorkPanel, {
  focusTechnicianModalWorkNotes,
} from "../../components/technician/TechnicianTicketModalWorkPanel";
import TechnicianTicketReadonlySummary from "../../components/technician/TechnicianTicketReadonlySummary";
import {
  acceptTicketAssignment,
  getMyTickets,
  getTicketById,
  rejectTicketAssignment,
  updateStatus,
} from "../../services/ticketService";
import {
  canOpenAcceptPage,
  canUseRejectFlow,
  isAcceptedTechnicianWork,
  isAwaitingTechnicianDecision,
  labelForAcceptedTechnicianWork,
} from "../../utils/technicianTicketFlow";
import { formatDateTime, toToken } from "../../utils/formatters";
import { normalizeTicketFromApi } from "../../utils/ticketNormalize";
import { isResolvedTicketStatus } from "../../utils/technicianTicketStatus";

function TechnicianAcceptQueuePage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingResolveId, setPendingResolveId] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const [activeDetailTicketId, setActiveDetailTicketId] = useState(null);
  const [detailTicket, setDetailTicket] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [modalActionBusy, setModalActionBusy] = useState(false);
  const [modalActionError, setModalActionError] = useState("");
  const [rejectFlowOpen, setRejectFlowOpen] = useState(false);

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
    setRejectFlowOpen(false);
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
        if (rejectFlowOpen) {
          event.stopPropagation();
          if (!modalActionBusy) setRejectFlowOpen(false);
        } else {
          closeDetailModal();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeDetailTicketId, closeDetailModal, rejectFlowOpen, modalActionBusy]);

  /** Assignments you have already accepted (excludes “decision pending” — use My tickets to accept or decline). */
  const acceptedOnly = useMemo(
    () => tickets.filter((t) => t && isAcceptedTechnicianWork(t)),
    [tickets],
  );

  const handleMarkResolved = async (ticketId) => {
    setPendingResolveId(ticketId);
    setFeedback({ type: "", text: "" });
    try {
      await updateStatus(ticketId, "RESOLVED");
      await loadTickets();
      setFeedback({ type: "success", text: "Ticket marked as resolved." });
    } catch (e) {
      setFeedback({ type: "error", text: e.message || "Could not mark as resolved." });
    } finally {
      setPendingResolveId(null);
    }
  };

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

  const handleRejectComplete = useCallback(
    async (reasonText) => {
      if (!detailTicket?.id) return;
      const id = String(detailTicket.id);
      setModalActionError("");
      setModalActionBusy(true);
      try {
        const res = await rejectTicketAssignment(id, { reason: reasonText });
        const updated = normalizeTicketFromApi(res?.data);
        if (updated) {
          setDetailTicket(updated);
          setTickets((prev) => prev.map((t) => (String(t.id) === id ? updated : t)));
        }
        await loadTickets();
        setRejectFlowOpen(false);
        closeDetailModal();
        navigate("/technician/tickets");
      } catch (e) {
        setModalActionError(e.message || "Could not decline assignment.");
        throw e;
      } finally {
        setModalActionBusy(false);
      }
    },
    [detailTicket?.id, closeDetailModal, navigate, loadTickets],
  );

  const handleModalMarkResolved = useCallback(async () => {
    if (!detailTicket?.id) return;
    const id = String(detailTicket.id);
    setModalActionError("");
    setModalActionBusy(true);
    setFeedback({ type: "", text: "" });
    try {
      await updateStatus(id, "RESOLVED");
      await loadTickets();
      closeDetailModal();
      setFeedback({ type: "success", text: "Ticket marked as resolved." });
    } catch (e) {
      setModalActionError(e.message || "Could not mark as resolved.");
    } finally {
      setModalActionBusy(false);
    }
  }, [detailTicket?.id, closeDetailModal, loadTickets]);

  /** Accept only while assignment is still pending; accepted/in-progress tickets use Mark as resolved instead. */
  const showModalAccept = Boolean(
    detailTicket && canOpenAcceptPage(detailTicket) && isAwaitingTechnicianDecision(detailTicket),
  );
  const showModalMarkResolved = Boolean(
    detailTicket &&
      isAcceptedTechnicianWork(detailTicket) &&
      !isResolvedTicketStatus(detailTicket.status),
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
      <Card
        className="technician-page-card"
        subtitle="Tickets you have accepted — use See details for updates, evidence, and mark resolved."
        title="Accept"
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
        {!acceptedOnly.length ? (
          <p className="supporting-text">
            No accepted tickets yet. New assignments appear under <strong>My tickets</strong> until you accept them;
            after you accept, they show here.
          </p>
        ) : (
          <div
            className="technician-table-wrapper"
            role="region"
            aria-label="Accepted tickets"
          >
            <table className="technician-table">
              <thead>
                <tr>
                  <th scope="col">Ticket</th>
                  <th scope="col">Requester</th>
                  <th scope="col">Created</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="technician-table-actions-header">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {acceptedOnly.map((ticket) => {
                  const busy = pendingResolveId === ticket.id;
                  const statusToken = toToken(ticket.status);
                  return (
                    <tr key={ticket.id}>
                      <td>
                        <div className="technician-table-title">
                          <span className="technician-table-ticket-title">
                            {ticket.title?.trim() || "Untitled"}
                          </span>
                          <span className="technician-table-ticket-id">ID: {ticket.id ?? "—"}</span>
                        </div>
                      </td>
                      <td>{ticket.createdByUsername?.trim() || "—"}</td>
                      <td>{ticket.createdAt ? formatDateTime(ticket.createdAt) : "—"}</td>
                      <td>
                        <span
                          className={`status-badge ${statusToken}`}
                          title={labelForAcceptedTechnicianWork(ticket)}
                        >
                          {labelForAcceptedTechnicianWork(ticket)}
                        </span>
                      </td>
                      <td className="technician-table-actions-cell">
                        <div className="technician-table-actions">
                          <Button
                            type="button"
                            variant="secondary"
                            className="technician-see-details-button"
                            onClick={() => setActiveDetailTicketId(String(ticket.id))}
                          >
                            See details
                          </Button>
                          <Button type="button" disabled={busy} onClick={() => handleMarkResolved(ticket.id)}>
                            {busy ? "Saving…" : "Mark as resolved"}
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
                  <TechnicianTicketModalWorkPanel
                    onTicketUpdated={handleDetailTicketUpdated}
                    ticket={detailTicket}
                  />
                </>
              ) : null}
            </div>
            {!detailLoading && detailTicket && !detailError ? (
              <div className="modal-footer">
                {showModalMarkResolved ? (
                  <Button type="button" disabled={modalActionBusy} onClick={handleModalMarkResolved}>
                    {modalActionBusy ? "Saving…" : "Mark as resolved"}
                  </Button>
                ) : null}
                {showModalAccept ? (
                  <Button type="button" disabled={modalActionBusy} onClick={handleModalAccept}>
                    Accept
                  </Button>
                ) : null}
                {showModalReject ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={modalActionBusy}
                    onClick={() => setRejectFlowOpen(true)}
                  >
                    Reject
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="secondary"
                  disabled={modalActionBusy}
                  onClick={() => focusTechnicianModalWorkNotes()}
                >
                  Add comment
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <TechnicianRejectAssignmentModal
        busy={modalActionBusy}
        inProgressPhase={Boolean(detailTicket && isAcceptedTechnicianWork(detailTicket))}
        onClose={() => {
          if (!modalActionBusy) setRejectFlowOpen(false);
        }}
        onComplete={handleRejectComplete}
        open={Boolean(rejectFlowOpen && detailTicket && activeDetailTicketId)}
        ticketTitle={detailTicket?.title}
      />
    </div>
  );
}

export default TechnicianAcceptQueuePage;
