import { useEffect, useState } from "react";
import Card from "../components/Card";
import LoadingSpinner from "../components/LoadingSpinner";
import { getNotifications } from "../services/notificationService";
import { formatDateTime } from "../utils/formatters";

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      setLoading(true);
      setError("");

      try {
        const data = await getNotifications();
        if (active) {
          setNotifications(data);
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

    loadNotifications();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading notifications..." />;
  }

  return (
    <Card title="Notifications" subtitle="Approvals, reminders, and operational updates">
      {error ? <p className="alert alert-error">{error}</p> : null}
      <div className="list-stack">
        {notifications.map((notification) => (
          <article className="list-row align-start" key={notification.id}>
            <div>
              <strong>{notification.title}</strong>
              <p className="supporting-text">{notification.message}</p>
              <small className="supporting-text">
                {formatDateTime(notification.createdAt)}
              </small>
            </div>
            {!notification.read ? <span className="status-badge unread">Unread</span> : null}
          </article>
        ))}
      </div>
    </Card>
  );
}

export default NotificationsPage;
