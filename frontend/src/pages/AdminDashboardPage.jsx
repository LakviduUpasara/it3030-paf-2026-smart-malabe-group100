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
        // ✅ FIX: axios response handling
        const [resResources, resBookings, resTickets] = await Promise.all([
          getResources(),
          getPendingBookings(),
          getManagedTickets(),
        ]);

        const resources = resResources.data;
        const bookings = resBookings.data;
        const tickets = resTickets.data;

        if (active) {
          setSummary({
            resources: Array.isArray(resources) ? resources.length : 0,
            approvals: Array.isArray(bookings) ? bookings.length : 0,
            tickets: Array.isArray(tickets) ? tickets.length : 0,
          });
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Failed to load dashboard.");
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
      {error && <p className="alert alert-error">{error}</p>}

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

      <Card title="Admin Overview">
        <p className="supporting-text">
          Use the admin menu to manage assets, review booking requests, and
          coordinate ticket responses across the campus.
        </p>
      </Card>
    </div>
  );
}

export default AdminDashboardPage;