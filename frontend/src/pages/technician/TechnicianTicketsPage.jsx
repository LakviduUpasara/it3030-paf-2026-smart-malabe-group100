import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import { listTechnicianTickets } from "../../services/technicianWorkspaceService";
import { toToken } from "../../utils/formatters";

function TechnicianTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await listTechnicianTickets();
        if (active) {
          setTickets(Array.isArray(data) ? data : []);
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

  if (loading) {
    return <LoadingSpinner label="Loading assigned tickets..." />;
  }

  return (
    <Card subtitle="Everything currently routed to you" title="Assigned tickets">
      {error ? <p className="alert alert-error">{error}</p> : null}
      {!tickets.length ? (
        <p className="supporting-text">You have no assigned tickets. Check back after the desk assigns work.</p>
      ) : (
        <div className="list-stack">
          {tickets.map((ticket) => (
            <Link
              className="list-row block rounded-2xl border border-border bg-tint/60 p-4 transition hover:bg-tint"
              key={ticket.id}
              to={`/technician/tickets/${ticket.id}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <strong className="text-heading">{ticket.title}</strong>
                  <p className="supporting-text">
                    {ticket.reference ? `${ticket.reference} · ` : ""}
                    {ticket.location || "—"} {ticket.category ? `· ${ticket.category}` : ""}
                  </p>
                  <p className="supporting-text">
                    Priority {ticket.priority}
                    {ticket.reporterDisplayName ? ` · Reporter: ${ticket.reporterDisplayName}` : ""}
                  </p>
                </div>
                <span className={`status-badge shrink-0 ${toToken(ticket.status)}`}>{ticket.status}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

export default TechnicianTicketsPage;
