import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import { getMyTickets } from "../../services/ticketService";
import { formatDateTime, toToken } from "../../utils/formatters";
import { isAwaitingTechnicianResponse } from "../../utils/technicianTicketFlow";

/**
 * Tickets awaiting your acceptance — open a row to review on the Accept page (then confirm).
 */
function TechnicianAcceptQueuePage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getMyTickets();
        if (!active) return;
        setTickets(Array.isArray(res?.data) ? res.data : []);
      } catch (e) {
        if (active) setError(e.message || "Failed to load tickets.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const pending = useMemo(
    () => tickets.filter((t) => t && isAwaitingTechnicianResponse(t.status)),
    [tickets],
  );

  if (loading) {
    return <LoadingSpinner label="Loading accept queue…" />;
  }

  return (
    <Card
      subtitle="Choose a ticket to open the Accept page — confirm there when you are ready to take the work."
      title="Accept"
    >
      {error ? <p className="alert alert-error">{error}</p> : null}
      {!pending.length ? (
        <p className="supporting-text">
          Nothing waiting for acceptance. New assignments appear here after the desk assigns a ticket to you.
        </p>
      ) : (
        <ul className="list-stack space-y-2">
          {pending.map((ticket) => (
            <li key={ticket.id}>
              <Link
                className="list-row block rounded-2xl border border-border bg-tint/60 p-4 transition hover:bg-tint"
                to={`/technician/tickets/${ticket.id}/accept`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <strong className="text-heading">{ticket.title?.trim() || "Untitled"}</strong>
                    <p className="supporting-text text-sm">
                      {ticket.createdByUsername ? `Requester: ${ticket.createdByUsername}` : null}
                      {ticket.createdAt ? ` · ${formatDateTime(ticket.createdAt)}` : null}
                    </p>
                  </div>
                  <span className={`status-badge shrink-0 ${toToken(ticket.status)}`}>Awaiting your response</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default TechnicianAcceptQueuePage;
