import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import TechnicianTicketModalWorkPanel, {
  focusTechnicianModalWorkNotes,
} from "../../components/technician/TechnicianTicketModalWorkPanel";
import TechnicianTicketReadonlySummary from "../../components/technician/TechnicianTicketReadonlySummary";
import { acceptTicketAssignment, getMyTickets, getTicketById } from "../../services/ticketService";
import {
  canOpenAcceptPage,
  canUseRejectFlow,
  isAcceptedTechnicianWork,
  isAwaitingTechnicianDecision,
} from "../../utils/technicianTicketFlow";
import { isActiveTicketStatus } from "../../utils/technicianTicketStatus";
import { toToken } from "../../utils/formatters";
import { parseTicketDescription } from "../../utils/ticketDescription";
import { normalizeTicketFromApi } from "../../utils/ticketNormalize";

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
      closeDetailModal();
      navigate(`/technician/tickets/${id}/work`);
    } catch (e) {
      setModalActionError(e.message || "Could not accept assignment.");
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

  const showModalAccept = Boolean(detailTicket && canOpenAcceptPage(detailTicket));
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
          <div
            className="technician-table-wrapper"
            role="region"
            aria-label="Active assigned tickets"
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
                {activeTickets.map((ticket) => {
                  const parsed = parseTicketDescription(ticket.description);
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
                            See details
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
                    onClick={handleModalReject}
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
    </div>
  );
}

export default TechnicianTicketsPage;
