import { useEffect, useState } from "react";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import { getManagedTickets, resolveTicket } from "../services/ticketService";
import { toToken } from "../utils/formatters";

function ManageTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadTickets() {
      setLoading(true);
      setError("");

      try {
        const data = await getManagedTickets();
        if (active) {
          setTickets(data);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadTickets();

    return () => {
      active = false;
    };
  }, []);

  const handleResolve = async (ticketId) => {
    try {
      await resolveTicket(ticketId);
      setTickets((previousTickets) =>
        previousTickets.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, status: "Resolved" } : ticket,
        ),
      );
    } catch (resolveError) {
      setError(resolveError.message);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading managed tickets..." />;
  }

  return (
    <Card title="Manage Tickets" subtitle="Monitor and resolve operational incidents">
      {error ? <p className="alert alert-error">{error}</p> : null}
      <div className="list-stack">
        {tickets.map((ticket) => (
          <article className="list-row align-start" key={ticket.id}>
            <div>
              <strong>{ticket.title}</strong>
              <p className="supporting-text">
                {ticket.location} | {ticket.category}
              </p>
              <p className="supporting-text">Assigned to: {ticket.assignee}</p>
            </div>
            <div className="inline-actions">
              <span className={`status-badge ${toToken(ticket.status)}`}>
                {ticket.status}
              </span>
              {ticket.status !== "Resolved" ? (
                <Button onClick={() => handleResolve(ticket.id)}>Mark Resolved</Button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}

export default ManageTicketsPage;

