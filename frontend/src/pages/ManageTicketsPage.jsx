import { useEffect, useState } from "react";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import TicketCard from "../components/TicketCard";
import { getTickets } from "../services/ticketService";

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
        const data = await getTickets();
        if (active) {
          setTickets(Array.isArray(data) ? data : []);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Failed to load tickets.");
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
    return <LoadingSpinner label="Loading tickets..." />;
  }

  return (
    <Card title="Manage Tickets" subtitle="View all incident tickets">
      {error ? <p className="alert alert-error">{error}</p> : null}

      {!error && tickets.length === 0 ? (
        <p className="supporting-text">No tickets yet.</p>
      ) : null}

      <div className="list-stack">
        {tickets.map((ticket, index) => (
          <TicketCard key={ticket.id != null ? ticket.id : `ticket-${index}`} ticket={ticket} />
        ))}
      </div>
    </Card>
  );
}

export default ManageTicketsPage;
