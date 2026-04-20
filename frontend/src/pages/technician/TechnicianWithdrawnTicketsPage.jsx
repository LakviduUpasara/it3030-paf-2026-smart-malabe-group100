import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import { getMyTickets } from "../../services/ticketService";
import { formatDateTime, toToken } from "../../utils/formatters";
import { formatWithdrawalReasonForDisplay } from "../../utils/withdrawalReason";
import { normalizeTicketFromApi } from "../../utils/ticketNormalize";

/**
 * Tickets that had been assigned to this technician but the user later withdrew.
 * Withdrawn tickets are read-only — they stay here as audit history so the
 * technician can confirm the request is cancelled.
 */
function formatTicketMeta(ticket) {
  const idShort = ticket?.id ? String(ticket.id).slice(0, 10) : "";
  const cat = [ticket?.categoryId, ticket?.subCategoryId].filter(Boolean).join(" · ");
  const bits = [];
  if (idShort) bits.push(idShort);
  if (cat) bits.push(cat);
  return bits.join(" · ") || "—";
}

function isWithdrawnStatus(status) {
  return String(status || "").trim().toUpperCase() === "WITHDRAWN";
}

function TechnicianWithdrawnTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          setError(e.message || "Failed to load withdrawn tickets.");
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

  const withdrawnTickets = useMemo(
    () => tickets.filter((t) => isWithdrawnStatus(t?.status)),
    [tickets],
  );

  if (loading) {
    return <LoadingSpinner label="Loading withdrawn tickets..." />;
  }

  return (
    <div className="technician-page">
      <Card
        className="technician-page-card"
        subtitle="Tickets previously assigned to you that the user withdrew. These are audit history; no action is required."
        title="Withdrawn tickets"
      >
        {error ? <p className="alert alert-error">{error}</p> : null}
        {!withdrawnTickets.length ? (
          <p className="supporting-text">
            No withdrawn tickets. When a user withdraws a ticket that was assigned to you it will appear here and
            automatically leave Assigned tickets.
          </p>
        ) : (
          <div className="list-stack">
            {withdrawnTickets.map((ticket) => {
              const meta = formatTicketMeta(ticket);
              const reasonLabel = formatWithdrawalReasonForDisplay(ticket);
              return (
                <div
                  className="list-row flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border bg-tint/60 p-4"
                  key={ticket.id}
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      className="text-heading font-semibold hover:underline"
                      to={`/technician/tickets/${ticket.id}`}
                    >
                      {ticket.title?.trim() || "Untitled"}
                    </Link>
                    <p className="supporting-text">{meta}</p>
                    <p className="supporting-text">
                      {ticket.createdByUsername ? `Requester: ${ticket.createdByUsername}` : "Requester: —"}
                      {ticket.updatedAt ? ` · Withdrawn ${formatDateTime(ticket.updatedAt)}` : null}
                    </p>
                    {reasonLabel ? (
                      <p className="supporting-text mt-1">
                        <strong>Reason:</strong> {reasonLabel}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <span
                      className={`status-badge shrink-0 ${toToken(ticket.status)}`}
                      title="Withdrawn by requester"
                    >
                      Withdrawn
                    </span>
                    <Link
                      className="button button-secondary inline-flex min-h-[44px] items-center justify-center px-4"
                      to={`/technician/tickets/${ticket.id}`}
                    >
                      View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

export default TechnicianWithdrawnTicketsPage;
