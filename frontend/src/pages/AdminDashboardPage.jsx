import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminWorkspaceLayout from "../components/AdminWorkspaceLayout";
import Button from "../components/Button";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import { getPendingBookings } from "../services/bookingService";
import { getResources } from "../services/resourceService";
import { getManagedTickets } from "../services/ticketService";
import { toToken } from "../utils/formatters";

const initialSummary = {
  resources: [],
  bookings: [],
  tickets: [],
};

function resourceIsAvailable(resource) {
  const s = String(resource?.status ?? "").toUpperCase();
  return s === "ACTIVE" || s === "AVAILABLE" || resource.status === "Available";
}

function resourceIsMaintenance(resource) {
  const s = String(resource?.status ?? "").toUpperCase();
  return (
    s === "OUT_OF_SERVICE" ||
    s === "MAINTENANCE" ||
    resource.status === "Maintenance"
  );
}

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAdminSummary() {
      setLoading(true);
      setError("");

      try {
        const [resources, bookings, tickets] = await Promise.all([
          getResources(),
          getPendingBookings(),
          getManagedTickets(),
        ]);

        if (active) {
          setSummary({
            resources,
            bookings,
            tickets,
          });
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

    loadAdminSummary();

    return () => {
      active = false;
    };
  }, []);

  const availableResources = summary.resources.filter(resourceIsAvailable).length;
  const maintenanceResources = summary.resources.filter(resourceIsMaintenance).length;
  const resolvedTickets = summary.tickets.filter((ticket) => ticket.status === "Resolved").length;
  const urgentTickets = summary.tickets.filter(
    (ticket) => ["High", "Critical"].includes(ticket.priority) && ticket.status !== "Resolved",
  ).length;
  const pendingAttendees = summary.bookings.reduce(
    (total, booking) => total + Number(booking.attendees || 0),
    0,
  );
  const trackedLocations = new Set(summary.resources.map((resource) => resource.location)).size;

  const stats = [
    {
      label: "Tracked assets",
      value: summary.resources.length,
      detail: `${availableResources} ready for booking`,
      tone: "cool",
    },
    {
      label: "Pending approvals",
      value: summary.bookings.length,
      detail: `${pendingAttendees} attendees waiting for confirmation`,
      tone: "warm",
    },
    {
      label: "Open incidents",
      value: summary.tickets.length - resolvedTickets,
      detail: `${urgentTickets} require rapid admin attention`,
      tone: "critical",
    },
    {
      label: "Campus coverage",
      value: trackedLocations,
      detail: "Resource visibility across core locations",
      tone: "neutral",
    },
  ];

  return (
    <AdminWorkspaceLayout
      actions={
        <>
          <Button onClick={() => navigate("/admin/bookings")} variant="secondary">
            Review approvals
          </Button>
          <Button onClick={() => navigate("/admin/resources")} variant="primary">
            Open resources
          </Button>
        </>
      }
      rail={
        <>
          <Card className="admin-panel-card admin-panel-card-compact">
            <div className="admin-rail-header">
              <strong>Quick actions</strong>
              <span>Priority workflow</span>
            </div>
            <div className="admin-quick-actions">
              <button onClick={() => navigate("/admin/bookings")} type="button">
                Booking approvals
              </button>
              <button onClick={() => navigate("/admin/resources")} type="button">
                Asset portfolio
              </button>
              <button onClick={() => navigate("/admin/tickets")} type="button">
                Incident desk
              </button>
            </div>
          </Card>

          <Card className="admin-panel-card admin-panel-card-compact">
            <div className="admin-rail-header">
              <strong>Operations posture</strong>
              <span>Current overview</span>
            </div>
            <div className="admin-progress-list">
              <div>
                <div className="admin-progress-meta">
                  <span>Resources available</span>
                  <strong>
                    {summary.resources.length
                      ? Math.round((availableResources / summary.resources.length) * 100)
                      : 0}
                    %
                  </strong>
                </div>
                <div className="admin-progress-bar">
                  <span
                    style={{
                      width: `${summary.resources.length ? (availableResources / summary.resources.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="admin-progress-meta">
                  <span>Tickets resolved</span>
                  <strong>
                    {summary.tickets.length
                      ? Math.round((resolvedTickets / summary.tickets.length) * 100)
                      : 0}
                    %
                  </strong>
                </div>
                <div className="admin-progress-bar admin-progress-bar-success">
                  <span
                    style={{
                      width: `${summary.tickets.length ? (resolvedTickets / summary.tickets.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </>
      }
      stats={stats}
      subtitle="Monitor approvals, resource availability, and operational support from a premium enterprise-style control center."
      title="Campus Operations Command Center"
    >
      {error ? <p className="alert alert-error">{error}</p> : null}

      {loading ? (
        <Card className="admin-panel-card">
          <LoadingSpinner label="Loading admin dashboard..." />
        </Card>
      ) : (
        <div className="admin-dashboard-grid">
          <Card className="admin-panel-card admin-panel-card-highlight">
            <div className="admin-panel-header">
              <div>
                <p className="admin-panel-kicker">Live queues</p>
                <h3>Operational priorities</h3>
              </div>
              <span className="status-badge pending">{summary.bookings.length} approval items</span>
            </div>
            <div className="admin-feature-grid">
              <article className="admin-feature-card">
                <span className="admin-feature-label">Booking queue</span>
                <strong>{summary.bookings[0]?.facility || "No pending requests"}</strong>
                <p>
                  {summary.bookings[0]
                    ? `${summary.bookings[0].requestedBy} requesting ${summary.bookings[0].time}`
                    : "All booking requests are currently up to date."}
                </p>
              </article>
              <article className="admin-feature-card">
                <span className="admin-feature-label">Incident escalation</span>
                <strong>{summary.tickets[0]?.title || "No incidents in queue"}</strong>
                <p>
                  {summary.tickets[0]
                    ? `${summary.tickets[0].location} • ${summary.tickets[0].priority} priority`
                    : "There are no unresolved incidents at the moment."}
                </p>
              </article>
              <article className="admin-feature-card">
                <span className="admin-feature-label">Resource coverage</span>
                <strong>{availableResources} resources ready</strong>
                <p>
                  {maintenanceResources
                    ? `${maintenanceResources} asset(s) currently under maintenance review.`
                    : "No assets are blocked by maintenance right now."}
                </p>
              </article>
            </div>
          </Card>

          <div className="admin-split-panels">
            <Card className="admin-panel-card">
              <div className="admin-panel-header">
                <div>
                  <p className="admin-panel-kicker">Pending booking approvals</p>
                  <h3>Next decisions</h3>
                </div>
                <Button onClick={() => navigate("/admin/bookings")} variant="secondary">
                  Open queue
                </Button>
              </div>
              <div className="admin-activity-list">
                {summary.bookings.slice(0, 3).map((booking) => (
                  <article className="admin-activity-row" key={booking.id}>
                    <div>
                      <strong>{booking.facility}</strong>
                      <p>
                        {booking.requestedBy} • {booking.date} • {booking.time}
                      </p>
                    </div>
                    <span className={`status-badge ${toToken(booking.status)}`}>{booking.status}</span>
                  </article>
                ))}
                {!summary.bookings.length ? (
                  <p className="empty-state">No pending booking approvals right now.</p>
                ) : null}
              </div>
            </Card>

            <Card className="admin-panel-card">
              <div className="admin-panel-header">
                <div>
                  <p className="admin-panel-kicker">Incident management</p>
                  <h3>Active service desk items</h3>
                </div>
                <Button onClick={() => navigate("/admin/tickets")} variant="secondary">
                  View tickets
                </Button>
              </div>
              <div className="admin-activity-list">
                {summary.tickets.slice(0, 3).map((ticket) => (
                  <article className="admin-activity-row" key={ticket.id}>
                    <div>
                      <strong>{ticket.title}</strong>
                      <p>
                        {ticket.location} • {ticket.assignee}
                      </p>
                    </div>
                    <span className={`status-badge ${toToken(ticket.status)}`}>{ticket.status}</span>
                  </article>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </AdminWorkspaceLayout>
  );
}

export default AdminDashboardPage;
