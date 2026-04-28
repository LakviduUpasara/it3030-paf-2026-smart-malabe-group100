import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import TechnicianTicketModalWorkPanel from "../../components/technician/TechnicianTicketModalWorkPanel";
import TechnicianTicketReadonlySummary from "../../components/technician/TechnicianTicketReadonlySummary";
import { acceptTicketAssignment, getMyTickets, getTicketById } from "../../services/ticketService";
import {
  canOpenAcceptPage,
  canUseRejectFlow,
  isAwaitingTechnicianDecision,
  labelForAwaitingTechnicianDecision,
} from "../../utils/technicianTicketFlow";
import { formatDateTime, toToken } from "../../utils/formatters";
import { normalizeTicketFromApi } from "../../utils/ticketNormalize";
import { isActiveTicketStatus } from "../../utils/technicianTicketStatus";

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
      navigate("/technician/tickets");
    } catch (e) {
      setModalActionError(e.message || "Could not accept assignment.");
    } finally {
      setModalActionBusy(false);
    }
  }, [detailTicket?.id, closeDetailModal, navigate, loadTickets]);

  const handleModalReject = useCallback(() => {
    if (!detailTicket?.id) return;
    const id = String(detailTicket.id);
    closeDetailModal();
    navigate(`/technician/tickets/${id}/reject`);
  }, [detailTicket?.id, closeDetailModal, navigate]);

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
          <div className="list-stack">
            {pendingDecision.map((ticket) => (
              <div
                className="list-row flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border bg-tint/60 p-4"
                key={ticket.id}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-heading font-semibold">{ticket.title?.trim() || "Untitled"}</p>
                  <p className="supporting-text">
                    {ticket.createdByUsername ? `Requester: ${ticket.createdByUsername}` : "Requester: —"}
                    {ticket.createdAt ? ` · ${formatDateTime(ticket.createdAt)}` : null}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <span
                    className={`status-badge shrink-0 ${toToken(ticket.status)}`}
                    title={labelForAwaitingTechnicianDecision(ticket)}
                  >
                    {labelForAwaitingTechnicianDecision(ticket)}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setActiveDetailTicketId(String(ticket.id))}
                  >
                    See details
                  </Button>
                  <Link
                    className="button button-secondary inline-flex min-h-[44px] items-center justify-center px-4"
                    to={`/technician/tickets/${ticket.id}/reject`}
                  >
                    Reject
                  </Link>
                </div>
              </div>
            ))}
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
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default TechnicianAcceptQueuePage;
