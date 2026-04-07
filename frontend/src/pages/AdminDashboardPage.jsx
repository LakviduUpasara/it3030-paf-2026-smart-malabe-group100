import { useEffect, useState } from "react";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import { getPendingBookings } from "../services/bookingService";
import { getResources } from "../services/resourceService";
import { getManagedTickets } from "../services/ticketService";

function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
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
            resources: resources.length,
            approvals: bookings.length,
            tickets: tickets.length,
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

  if (loading) {
    return <LoadingSpinner label="Loading admin dashboard..." />;
  }

  return (
    <div className="page-stack">
      {error ? <p className="alert alert-error">{error}</p> : null}
      <div className="grid grid-three">
        <Card className="stat-card">
          <p className="stat-label">Tracked Resources</p>
          <strong className="stat-value">{summary?.resources || 0}</strong>
        </Card>
        <Card className="stat-card">
          <p className="stat-label">Pending Approvals</p>
          <strong className="stat-value">{summary?.approvals || 0}</strong>
        </Card>
        <Card className="stat-card">
          <p className="stat-label">Open Tickets</p>
          <strong className="stat-value">{summary?.tickets || 0}</strong>
        </Card>
      </div>

      <Card title="Admin Overview" subtitle="Operational controls for campus management">
        <p className="supporting-text">
          Use the admin menu to manage assets, review booking requests, and coordinate
          ticket responses across the campus.
        </p>
      </Card>
    </div>
  );
}

export default AdminDashboardPage;

