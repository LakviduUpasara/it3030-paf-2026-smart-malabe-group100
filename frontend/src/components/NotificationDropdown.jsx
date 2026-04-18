import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { getNotifications } from "../services/notificationService";
import { getTechnicianNotificationSummary } from "../services/technicianWorkspaceService";
import { formatFeedTime } from "../utils/formatters";
import { ROLES, normalizeRole } from "../utils/roleUtils";
import LoadingSpinner from "./LoadingSpinner";

function NotificationDropdown() {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [technicianUnread, setTechnicianUnread] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      if (!isAuthenticated) {
        return;
      }
      setLoading(true);
      setError("");

      try {
        const role = normalizeRole(user?.role);
        if (role === ROLES.TECHNICIAN) {
          const summary = await getTechnicianNotificationSummary();
          if (!active) {
            return;
          }
          const mapped = (summary.items || []).map((item) => ({
            id: item.id,
            title: item.title,
            message: item.message,
            read: item.read,
            createdAt: item.publishedAt,
          }));
          setNotifications(mapped);
          setTechnicianUnread(typeof summary.unreadCount === "number" ? summary.unreadCount : 0);
        } else {
          const data = await getNotifications();
          if (active) {
            setNotifications(Array.isArray(data) ? data : []);
            setTechnicianUnread(null);
          }
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
  }, [isAuthenticated, user?.role]);

  const unreadCount =
    technicianUnread != null ? technicianUnread : notifications.filter((item) => !item.read).length;

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
                  <small>{formatFeedTime(notification.createdAt)}</small>
                </article>
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
}

export default NotificationDropdown;
