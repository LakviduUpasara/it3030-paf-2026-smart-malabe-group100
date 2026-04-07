import { useEffect, useState } from "react";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import { getAssignedTickets } from "../services/ticketService";
import { toToken } from "../utils/formatters";

function TechnicianDashboardPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAssignedTickets() {
      setLoading(true);
      setError("");

      try {
        const data = await getAssignedTickets();
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

    loadAssignedTickets();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading technician queue..." />;
  }

  return (
    <Card title="Technician Dashboard" subtitle="Assigned maintenance and incident queue">
      {error ? <p className="alert alert-error">{error}</p> : null}
      <div className="list-stack">
        {tickets.map((ticket) => (
          <article className="list-row" key={ticket.id}>
            <div>
              <strong>{ticket.title}</strong>
              <p className="supporting-text">{ticket.location}</p>
              <p className="supporting-text">Priority: {ticket.priority}</p>
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

export default TechnicianDashboardPage;

