import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import { getMyTickets } from "../../services/ticketService";
import { formatDateTime, toToken } from "../../utils/formatters";
import { isTechnicianAcceptanceRejected } from "../../utils/technicianTicketFlow";
import { normalizeTicketFromApi } from "../../utils/ticketNormalize";

function deskStatusLabel(status) {
  const s = String(status || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (s === "OPEN") return "Open";
  if (s === "REJECTED") return "Rejected";
  return status ? String(status).replace(/_/g, " ") : "—";
}

function TechnicianRejectQueuePage() {
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
        if (active) setError(e.message || "Failed to load tickets.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [loadTickets]);

  /** You declined these; they stay listed here for your history while status is Open for the desk. */
  const rejectedByYouOnly = useMemo(
    () => tickets.filter((t) => t && isTechnicianAcceptanceRejected(t)),
    [tickets],
  );

  if (loading) {
    return <LoadingSpinner label="Loading…" />;
  }

  return (
    <div className="technician-page">
      <Card
        className="technician-page-card"
        subtitle="Tickets you returned to the desk are Open again so they can be reassigned. Your declined list is below."
        title="Reject"
      >
        {error ? <p className="alert alert-error">{error}</p> : null}
        {!rejectedByYouOnly.length ? (
          <p className="supporting-text">
            No declined assignments yet. When you confirm a return on the Reject page, the ticket goes <strong>Open</strong>{" "}
            for the desk and shows here in your history. New assignments appear under <strong>Open tickets</strong>.
          </p>
        ) : (
          <div className="list-stack">
            {rejectedByYouOnly.map((ticket) => (
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
                  <p className="supporting-text">
                    {ticket.createdByUsername ? `Requester: ${ticket.createdByUsername}` : "Requester: —"}
                    {ticket.createdAt ? ` · ${formatDateTime(ticket.createdAt)}` : null}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <span
                    className={`status-badge shrink-0 ${toToken(ticket.status)}`}
                    title="Ticket is Open for the desk; you declined this assignment"
                  >
                    {deskStatusLabel(ticket.status)}
                  </span>
                  <Link
                    className="button button-secondary inline-flex min-h-[44px] items-center justify-center px-4"
                    to={`/technician/tickets/${ticket.id}`}
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default TechnicianRejectQueuePage;
