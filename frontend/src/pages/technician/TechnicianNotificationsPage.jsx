import { useEffect, useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
  getTechnicianNotificationSummary,
  markTechnicianNotificationsRead,
} from "../../services/technicianWorkspaceService";
import { formatFeedTime } from "../../utils/formatters";

function TechnicianNotificationsPage() {
  const [summary, setSummary] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getTechnicianNotificationSummary();
      setSummary(data);
      setSelected(new Set());
    } catch (e) {
      setError(e.message || "Failed to load alerts.");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const items = Array.isArray(summary?.items) ? summary.items : [];
  const unreadCount = typeof summary?.unreadCount === "number" ? summary.unreadCount : 0;

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllUnread = () => {
    const unreadIds = items.filter((i) => !i.read).map((i) => i.id);
    setSelected(new Set(unreadIds));
  };

  const handleMarkRead = async () => {
    const ids = [...selected];
    if (!ids.length) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      await markTechnicianNotificationsRead(ids);
      await load();
    } catch (e) {
      setError(e.message || "Could not update read state.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading alerts..." />;
  }

  return (
    <div className="page-stack">
      <Card
        subtitle="Campus notification feed scoped to technician audiences, with read receipts"
        title="Technician alerts"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy || !items.some((i) => !i.read)} onClick={selectAllUnread} type="button" variant="secondary">
              Select unread
            </Button>
            <Button disabled={busy || !selected.size} onClick={handleMarkRead} type="button" variant="primary">
              Mark selected read
            </Button>
          </div>
        }
      >
        {error ? <p className="alert alert-error">{error}</p> : null}
        <p className="supporting-text">
          Unread count (server): <strong>{unreadCount}</strong>
        </p>
      </Card>

      <Card title="Inbox">
        {!items.length ? (
          <p className="supporting-text">No notifications are visible for your role right now.</p>
        ) : (
          <ul className="list-stack">
            {items.map((item) => (
              <li
                className={`list-row flex flex-col gap-2 rounded-2xl border border-border p-4 sm:flex-row sm:items-start sm:justify-between ${
                  item.read ? "bg-tint/40" : "bg-tint/80"
                }`.trim()}
                key={item.id}
              >
                <div className="flex min-w-0 flex-1 gap-3">
                  <input
                    aria-label={`Select ${item.title || "notification"}`}
                    checked={selected.has(item.id)}
                    className="mt-1 h-4 w-4"
                    disabled={busy}
                    onChange={() => toggle(item.id)}
                    type="checkbox"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-heading">{item.title || "Notice"}</strong>
                      {!item.read ? <span className="dot-indicator" aria-label="Unread" /> : null}
                    </div>
                    <p className="supporting-text whitespace-pre-wrap">{item.message}</p>
                    <p className="mt-1 text-xs text-text/60">{formatFeedTime(item.publishedAt)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export default TechnicianNotificationsPage;
