import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import { getMyTickets } from "../../services/ticketService";
import { formatDateTime, toToken } from "../../utils/formatters";
import { isAwaitingTechnicianResponse } from "../../utils/technicianTicketFlow";

/**
 * Same pool as Accept — tickets awaiting your decision. Open a row to review on the Reject page (then confirm).
 */
function TechnicianRejectQueuePage() {
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
    return <LoadingSpinner label="Loading reject queue…" />;
  }

  return (
    <Card
      subtitle="Choose a ticket to open the Reject page — confirm there only when you are ready to return it to the queue."
      title="Reject"
    >
      {error ? <p className="alert alert-error">{error}</p> : null}
      {!pending.length ? (
        <p className="supporting-text">No tickets waiting for a reject decision.</p>
      ) : (
        <ul className="list-stack space-y-2">
          {pending.map((ticket) => (
            <li key={ticket.id}>
              <Link
                className="list-row block rounded-2xl border border-border bg-tint/60 p-4 transition hover:bg-tint"
                to={`/technician/tickets/${ticket.id}/reject`}
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

export default TechnicianRejectQueuePage;
