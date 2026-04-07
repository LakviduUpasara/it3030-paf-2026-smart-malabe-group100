import { useEffect, useState } from "react";
import { getNotifications } from "../services/notificationService";
import { formatDateTime } from "../utils/formatters";
import LoadingSpinner from "./LoadingSpinner";

function NotificationDropdown() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
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

  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <div className="notification-dropdown">
      <button
        className="notification-toggle"
        onClick={() => setIsOpen((previousState) => !previousState)}
        type="button"
      >
        Alerts
        {unreadCount ? <span className="notification-count">{unreadCount}</span> : null}
      </button>

      {isOpen ? (
        <div className="notification-menu">
          <div className="notification-menu-header">
            <strong>Recent Notifications</strong>
          </div>

          {loading ? <LoadingSpinner label="Loading alerts..." /> : null}
          {error ? <p className="alert alert-error">{error}</p> : null}

          {!loading && !error && notifications.length === 0 ? (
            <p className="empty-state">No new notifications.</p>
          ) : null}

          {!loading && !error
            ? notifications.slice(0, 4).map((notification) => (
                <article className="notification-item" key={notification.id}>
                  <div className="notification-title-row">
                    <strong>{notification.title}</strong>
                    {!notification.read ? <span className="dot-indicator" /> : null}
                  </div>
                  <p>{notification.message}</p>
                  <small>{formatDateTime(notification.createdAt)}</small>
                </article>
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
}

export default NotificationDropdown;

