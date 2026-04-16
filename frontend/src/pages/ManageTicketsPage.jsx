import { useEffect, useState } from "react";
import AdminWorkspaceLayout from "../components/AdminWorkspaceLayout";
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

  const resolvedTickets = tickets.filter((ticket) => ticket.status === "Resolved").length;
  const activeTickets = tickets.filter((ticket) => ticket.status !== "Resolved").length;
  const highPriorityTickets = tickets.filter((ticket) =>
    ["High", "Critical"].includes(ticket.priority),
  ).length;

  return (
    <AdminWorkspaceLayout
      rail={
        <Card className="admin-panel-card admin-panel-card-compact">
          <div className="admin-rail-header">
            <strong>Resolution focus</strong>
            <span>Current balance</span>
          </div>
          <div className="admin-breakdown-list">
            <div>
              <span>Resolved</span>
              <strong>{resolvedTickets}</strong>
            </div>
            <div>
              <span>Active incidents</span>
              <strong>{activeTickets}</strong>
            </div>
            <div>
              <span>High priority</span>
              <strong>{highPriorityTickets}</strong>
            </div>
          </div>
        </Card>
      }
      stats={[
        {
          label: "Open workload",
          value: activeTickets,
          detail: "Incidents still active in the service desk",
          tone: "critical",
        },
        {
          label: "Resolved",
          value: resolvedTickets,
          detail: "Completed operational responses",
          tone: "cool",
        },
        {
          label: "Priority incidents",
          value: highPriorityTickets,
          detail: "High and critical items under watch",
          tone: "warm",
        },
      ]}
      subtitle="Track and resolve operational incidents with a clearer enterprise queue and stronger action hierarchy."
      title="Incident & Ticket Desk"
    >
      {error ? <p className="alert alert-error">{error}</p> : null}

      {loading ? (
        <Card className="admin-panel-card">
          <LoadingSpinner label="Loading managed tickets..." />
        </Card>
      ) : (
        <Card className="admin-panel-card">
          <div className="admin-panel-header">
            <div>
              <p className="admin-panel-kicker">Service operations</p>
              <h3>Managed incident queue</h3>
            </div>
          </div>

          <div className="admin-queue-list">
            {tickets.map((ticket) => (
              <article className="admin-queue-card" key={ticket.id}>
                <div className="admin-queue-card-main">
                  <div className="admin-queue-card-head">
                    <div>
                      <strong>{ticket.title}</strong>
                      <p>
                        {ticket.location} • {ticket.category}
                      </p>
                    </div>
                    <span className={`status-badge ${toToken(ticket.status)}`}>{ticket.status}</span>
                  </div>

                  <div className="admin-queue-meta">
                    <span>{ticket.priority} priority</span>
                    <span>Assigned to {ticket.assignee}</span>
                    <span>{ticket.id}</span>
                  </div>
                </div>

                <div className="admin-queue-actions">
                  {ticket.status !== "Resolved" ? (
                    <Button onClick={() => handleResolve(ticket.id)} variant="primary">
                      Mark resolved
                    </Button>
                  ) : (
                    <span className="admin-resolved-pill">Completed</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </Card>
      )}
    </AdminWorkspaceLayout>
  );
}

export default ManageTicketsPage;
