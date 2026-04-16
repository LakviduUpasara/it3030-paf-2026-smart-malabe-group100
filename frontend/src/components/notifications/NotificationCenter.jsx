import { formatDateTime } from "../../utils/formatters";

/**
 * Presentational list for in-app notification items (feed + legacy).
 * Data loading and audience filtering live in NotificationsPage / notification-center model.
 */
export default function NotificationCenter({ items = [], emptyLabel = "No notifications." }) {
  if (!items.length) {
    return <p className="supporting-text">{emptyLabel}</p>;
  }
  return (
    <div className="list-stack">
      {items.map((notification) => (
        <article className="list-row align-start" key={notification.id + (notification.source || "")}>
          <div>
            <strong>{notification.title}</strong>
            <p className="supporting-text">{notification.message}</p>
            <small className="supporting-text">
              {formatDateTime(notification.publishedAt || notification.time || notification.createdAt)}
            </small>
            {notification.targetLabel ? (
              <small className="ml-2 text-text/60">· {notification.targetLabel}</small>
            ) : null}
          </div>
          {notification.unread === true ? <span className="status-badge unread">Unread</span> : null}
        </article>
      ))}
    </div>
  );
}
