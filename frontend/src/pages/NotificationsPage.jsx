import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import NotificationItem from "../components/notifications/NotificationItem";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  getMyNotifications,
  markAllRead,
  markRead,
} from "../services/notificationApi";

const FILTERS = [
  { id: "all", label: "All", unread: false, category: undefined },
  { id: "unread", label: "Unread", unread: true, category: undefined },
  { id: "booking", label: "Booking", unread: false, category: "BOOKING" },
  { id: "ticket", label: "Ticket", unread: false, category: "TICKET" },
  { id: "system", label: "System", unread: false, category: "SYSTEM" },
];

function NotificationsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const activeFilter = useMemo(
    () => FILTERS.find((f) => f.id === filter) ?? FILTERS[0],
    [filter],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMyNotifications({
        unread: activeFilter.unread,
        category: activeFilter.category,
        page: 0,
        size: 50,
      });
      const rows = Array.isArray(res?.content) ? res.content : [];
      setItems(rows);
    } catch (e) {
      setError(e?.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleOpen = async (n) => {
    if (!n.read) {
      try {
        await markRead(n.id);
        setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      } catch {
        /* follow through to navigation even if marking read fails */
      }
    }
    const link = linkFor(n);
    if (link) {
      navigate(link);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead();
      setItems((list) => list.map((x) => ({ ...x, read: true })));
    } catch (e) {
      setError(e?.message || "Unable to mark all as read.");
    }
  };

  return (
    <Card
      subtitle="Everything about your bookings, tickets, and broadcasts"
      title="Notifications"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter notifications">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                filter === f.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-text/70 hover:bg-tint"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button onClick={handleMarkAll} type="button" variant="secondary">
          Mark all as read
        </Button>
      </div>

      {error ? (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-4">
        {loading ? (
          <LoadingSpinner label="Loading notifications..." />
        ) : items.length === 0 ? (
          <p className="rounded-2xl border border-border bg-tint px-4 py-6 text-center text-sm text-text/60">
            No notifications to show for this filter.
          </p>
        ) : (
          <ul className="space-y-1">
            {items.map((n) => (
              <li key={n.id}>
                <NotificationItem notification={n} onOpen={handleOpen} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

function linkFor(n) {
  if (!n?.relatedEntityType || !n?.relatedEntityId) {
    return null;
  }
  switch (n.relatedEntityType) {
    case "BOOKING":
      return `/bookings/${encodeURIComponent(n.relatedEntityId)}`;
    case "TICKET":
    case "COMMENT":
      return `/tickets/${encodeURIComponent(n.relatedEntityId)}`;
    default:
      return null;
  }
}

export default NotificationsPage;
