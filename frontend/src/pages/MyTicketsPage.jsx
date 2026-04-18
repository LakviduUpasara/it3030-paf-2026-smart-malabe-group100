import { useEffect, useState } from "react";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import { getMyTickets } from "../services/ticketService";
import { toToken } from "../utils/formatters";

function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadTickets() {
      setLoading(true);
      setError("");

      try {
        const data = await getMyTickets();
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

  if (loading) {
    return <LoadingSpinner label="Loading your tickets..." />;
  }

  return (
    <Card title="My Tickets" subtitle="Track maintenance and incident requests">
      {error ? <p className="alert alert-error">{error}</p> : null}
      <div className="list-stack">
        {tickets.map((ticket) => (
          <article className="list-row" key={ticket.id}>
            <div>
              <strong>{ticket.title}</strong>
              <p className="supporting-text">
                {ticket.location} | {ticket.category}
              </p>
              <p className="supporting-text">
                Priority: {ticket.priority} | Assignee: {ticket.assignee}
              </p>
            </div>
            <span className={`status-badge ${toToken(ticket.status)}`}>
              {ticket.status}
            </span>
          </article>
        ))}
      </div>
    </Card>
  );
}

export default MyTicketsPage;

