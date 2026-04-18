import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import { toToken } from "../../utils/formatters";
import {
  getTechnicianNotificationSummary,
  listTechnicianTickets,
} from "../../services/technicianWorkspaceService";

function TechnicianHomePage() {
  const [tickets, setTickets] = useState([]);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [ticketData, alertSummary] = await Promise.all([
          listTechnicianTickets(),
          getTechnicianNotificationSummary(),
        ]);
        if (!active) {
          return;
        }
        setTickets(Array.isArray(ticketData) ? ticketData : []);
        setUnreadAlerts(typeof alertSummary?.unreadCount === "number" ? alertSummary.unreadCount : 0);
      } catch (e) {
        if (active) {
          setError(e.message || "Failed to load desk.");
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

  const stats = useMemo(() => {
    const openish = tickets.filter((t) => t.status !== "RESOLVED" && t.status !== "CLOSED").length;
    const urgent = tickets.filter((t) => t.priority === "HIGH" || t.priority === "CRITICAL").length;
    const done = tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length;
    return { openish, urgent, done };
  }, [tickets]);

  if (loading) {
    return <LoadingSpinner label="Loading technician desk..." />;
  }

  return (
    <div className="page-stack">
      <Card
        subtitle="Smart Campus Operations Hub — your assigned workload"
        title="Technician desk"
        actions={
          <Link className="button button-secondary" to="/technician/tickets">
            View all tickets
          </Link>
        }
      >
        {error ? <p className="alert alert-error">{error}</p> : null}
        <p className="supporting-text">
          Track incidents assigned to you, post progress updates, and stay on top of operational alerts.
        </p>
      </Card>

      <div className="grid grid-three">
        <Card className="stat-card">
          <p className="stat-label">Active assignments</p>
          <strong className="stat-value">{stats.openish}</strong>
          <p className="supporting-text">Not resolved or closed</p>
        </Card>
        <Card className="stat-card">
          <p className="stat-label">High / critical</p>
          <strong className="stat-value">{stats.urgent}</strong>
          <p className="supporting-text">Needs priority attention</p>
        </Card>
        <Card className="stat-card">
          <p className="stat-label">Unread alerts</p>
          <strong className="stat-value">{unreadAlerts}</strong>
          <p className="supporting-text">
            <Link className="text-heading underline-offset-2 hover:underline" to="/technician/notifications">
              Open alerts inbox
            </Link>
          </p>
        </Card>
      </div>

      <Card subtitle="Latest items in your queue" title="Assigned tickets">
        {!tickets.length ? (
          <p className="supporting-text">No tickets are assigned to you yet.</p>
        ) : (
          <div className="list-stack">
            {tickets.slice(0, 5).map((ticket) => (
              <Link
                className="list-row block rounded-2xl border border-transparent transition hover:border-border hover:bg-tint/60"
                key={ticket.id}
                to={`/technician/tickets/${ticket.id}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <strong className="text-heading">{ticket.title}</strong>
                    <p className="supporting-text">
                      {ticket.reference ? `${ticket.reference} · ` : ""}
                      {ticket.location || "—"}
                    </p>
                  </div>
                  <span className={`status-badge ${toToken(ticket.status)}`}>{ticket.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
        {tickets.length > 5 ? (
          <p className="mt-4 text-sm text-text/70">
            Showing 5 of {tickets.length}.{" "}
            <Link className="font-semibold text-heading underline-offset-2 hover:underline" to="/technician/tickets">
              See full queue
            </Link>
          </p>
        ) : null}
      </Card>
    </div>
  );
}

export default TechnicianHomePage;
