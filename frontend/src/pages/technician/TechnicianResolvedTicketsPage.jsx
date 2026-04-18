import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import { getMyTickets } from "../../services/ticketService";
import { isResolvedTicketStatus } from "../../utils/technicianTicketStatus";
import { toToken } from "../../utils/formatters";

function formatTicketMeta(ticket) {
  const idShort = ticket?.id ? String(ticket.id).slice(0, 10) : "";
  const cat = [ticket?.categoryId, ticket?.subCategoryId].filter(Boolean).join(" · ");
  const reporter = ticket?.createdByUsername?.trim();
  const bits = [];
  if (idShort) bits.push(idShort);
  if (cat) bits.push(cat);
  return { line1: bits.join(" · ") || "—", reporter };
}

function TechnicianResolvedTicketsPage() {
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
        const data = res?.data;
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

  const resolvedTickets = useMemo(
    () => tickets.filter((t) => isResolvedTicketStatus(t?.status)),
    [tickets],
  );

  if (loading) {
    return <LoadingSpinner label="Loading resolved tickets..." />;
  }

  return (
    <Card subtitle="Tickets you marked resolved or closed" title="Resolved">
      {error ? <p className="alert alert-error">{error}</p> : null}
      {!resolvedTickets.length ? (
        <p className="supporting-text">
          No resolved tickets yet. When you mark work complete from a ticket, it appears here.
        </p>
      ) : (
        <div className="list-stack">
          {resolvedTickets.map((ticket) => {
            const meta = formatTicketMeta(ticket);
            return (
              <Link
                className="list-row block rounded-2xl border border-border bg-tint/60 p-4 transition hover:bg-tint"
                key={ticket.id}
                to={`/technician/tickets/${ticket.id}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <strong className="text-heading">{ticket.title}</strong>
                    <p className="supporting-text">{meta.line1}</p>
                    <p className="supporting-text">
                      {meta.reporter ? `Reporter: ${meta.reporter}` : "Reporter: —"}
                    </p>
                  </div>
                  <span className={`status-badge shrink-0 ${toToken(ticket.status)}`}>{ticket.status}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default TechnicianResolvedTicketsPage;
