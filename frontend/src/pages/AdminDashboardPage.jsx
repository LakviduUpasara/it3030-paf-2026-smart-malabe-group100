import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import { getPendingBookings } from "../services/bookingService";
import { getResources } from "../services/resourceService";
import { getManagedTickets } from "../services/ticketService";
import {
  ADMIN_ACADEMIC_NAV_ITEMS,
  ADMIN_OPERATIONS_NAV_ITEMS,
  ADMIN_RESOURCE_NAV_ITEMS,
} from "../utils/roleUtils";

function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const managementSections = [
    {
      title: "Resources",
      subtitle: "Facilities and shared asset controls",
      items: ADMIN_RESOURCE_NAV_ITEMS,
    },
    {
      title: "Academic Management",
      subtitle: "Core academic structure and scheduling entities",
      items: ADMIN_ACADEMIC_NAV_ITEMS,
    },
    {
      title: "Operations",
      subtitle: "Approvals, incidents, and campus-wide updates",
      items: ADMIN_OPERATIONS_NAV_ITEMS,
    },
  ];

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
          Use the grouped admin navigation to manage facilities, maintain academic
          master data, review booking requests, and coordinate ticket responses across
          the campus.
        </p>
      </Card>

      <div className="admin-section-grid">
        {managementSections.map((section) => (
          <Card
            key={section.title}
            className="admin-shortcut-card"
            title={section.title}
            subtitle={section.subtitle}
          >
            <div className="admin-shortcut-list">
              {section.items.map((item) => (
                <Link key={item.path} className="admin-shortcut-link" to={item.path}>
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </Link>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboardPage;

