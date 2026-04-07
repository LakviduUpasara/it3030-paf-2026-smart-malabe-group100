import Card from "../components/Card";
import { useAuth } from "../hooks/useAuth";
import { getRoleDescription } from "../utils/roleUtils";

function DashboardPage() {
  const { user } = useAuth();

  const summaryByRole = {
    USER: [
      { title: "Upcoming Bookings", value: "03", note: "Confirmed reservations this week" },
      { title: "Active Tickets", value: "02", note: "Issues waiting for updates" },
      { title: "Unread Alerts", value: "02", note: "Operational notifications pending" },
    ],
    ADMIN: [
      { title: "Pending Approvals", value: "06", note: "Bookings needing review today" },
      { title: "Open Tickets", value: "14", note: "Incidents across the campus" },
      { title: "Tracked Resources", value: "48", note: "Rooms, labs, and movable assets" },
    ],
    TECHNICIAN: [
      { title: "Assigned Tickets", value: "05", note: "Incidents scheduled for action" },
      { title: "Urgent Jobs", value: "02", note: "Critical tasks in your queue" },
      { title: "Completed This Week", value: "11", note: "Resolved maintenance items" },
    ],
  };

  const summaryCards = summaryByRole[user?.role] || summaryByRole.USER;

  return (
    <div className="page-stack">
      <Card title={`Welcome back, ${user?.name}`} subtitle={user?.email}>
        <p className="supporting-text">{getRoleDescription(user?.role)}</p>
      </Card>

      <div className="grid grid-three">
        {summaryCards.map((item) => (
          <Card key={item.title} className="stat-card">
            <p className="stat-label">{item.title}</p>
            <strong className="stat-value">{item.value}</strong>
            <p className="supporting-text">{item.note}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default DashboardPage;

