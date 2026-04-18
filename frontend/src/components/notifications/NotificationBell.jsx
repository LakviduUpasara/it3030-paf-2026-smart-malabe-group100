import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, CircleAlert, ClipboardCheck, MailOpen } from "lucide-react";
import {
  getMyNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
} from "../../services/notificationApi";

/**
 * NotificationBell — reusable top-bar widget for the v1 Notification Module.
 *
 * Pulls the current user's notifications from `GET /api/v1/notifications` and the unread
 * counter from `GET /api/v1/notifications/unread-count`. Click a row to mark read and
 * navigate to the linked booking or ticket; use "Mark all as read" to clear in bulk.
 *
 * Browser notification permission is requested lazily (only once) so we fall back
 * cleanly to the in-app panel if the user denies it.
 */
function NotificationBell({ pollMs = 30_000 }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const lastSeenIdsRef = useRef(new Set());

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [listPage, count] = await Promise.all([
        getMyNotifications({ page: 0, size: 20 }),
        getUnreadCount(),
      ]);
      const rows = Array.isArray(listPage?.content) ? listPage.content : [];
      setItems(rows);
      setUnread(Number(count || 0));
      maybeShowBrowserPush(rows, lastSeenIdsRef);
    } catch (e) {
      setError(e.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    if (!pollMs) {
      return undefined;
    }
    const t = setInterval(refresh, pollMs);
    return () => clearInterval(t);
  }, [refresh, pollMs]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }
    if (window.Notification.permission === "default") {
      try {
        window.Notification.requestPermission();
      } catch {
        /* user may have denied, fall through silently */
      }
    }
  }, []);

  const handleOpen = async (n) => {
    setOpen(false);
    if (!n.read) {
      try {
        await markRead(n.id);
        setUnread((v) => Math.max(0, v - 1));
        setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      } catch {
        /* soft fail; navigation still proceeds */
      }
    }
    const target = linkFor(n);
    if (target) {
      navigate(target);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead();
      setUnread(0);
      setItems((list) => list.map((x) => ({ ...x, read: true })));
    } catch (e) {
      setError(e.message || "Unable to mark all as read.");
    }
  };

  const unreadBadge = useMemo(() => {
    if (unread <= 0) return null;
    return (
      <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
        {unread > 99 ? "99+" : unread}
      </span>
    );
  }, [unread]);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-heading hover:bg-tint"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        {unreadBadge}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-[360px] max-w-[92vw] rounded-2xl border border-border bg-card p-2 shadow-shadow ring-1 ring-black/5"
        >
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <p className="text-sm font-semibold text-heading">Notifications</p>
            <button
              type="button"
              onClick={handleMarkAll}
              className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-medium text-text/70 hover:bg-tint hover:text-heading disabled:opacity-60"
              disabled={loading || unread === 0}
            >
              <MailOpen className="h-3.5 w-3.5" aria-hidden /> Mark all as read
            </button>
          </div>

          {error ? (
            <div className="m-2 rounded-xl border border-red-200 bg-red-50 p-2 text-xs text-red-700" role="alert">
              {error}
            </div>
          ) : null}

          {loading && items.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-text/60">Loading…</p>
          ) : null}

          {!loading && items.length === 0 && !error ? (
            <p className="px-3 py-6 text-center text-xs text-text/60">You're all caught up.</p>
          ) : null}

          <ul className="max-h-[60vh] overflow-y-auto">
            {items.map((n) => {
              const Icon = iconFor(n);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleOpen(n)}
                    className={`flex w-full items-start gap-2 rounded-xl px-2 py-2 text-left text-sm hover:bg-tint ${
                      n.read ? "text-text/75" : "text-text"
                    }`}
                  >
                    <span
                      className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        n.read ? "bg-slate-100 text-slate-500" : "bg-primary/10 text-primary"
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate ${n.read ? "font-medium" : "font-semibold"}`}>
                        {n.title}
                      </span>
                      <span className="block truncate text-xs text-text/60">{n.message}</span>
                      <span className="block text-[10px] text-text/50">
                        {formatRelative(n.createdAt)}
                      </span>
                    </span>
                    {!n.read ? (
                      <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                    ) : (
                      <Check className="mt-1 h-3.5 w-3.5 text-text/40" aria-hidden />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function iconFor(n) {
  if (n.category === "BOOKING") return ClipboardCheck;
  if (n.category === "TICKET") return CircleAlert;
  return Bell;
}

function linkFor(n) {
  if (!n?.relatedEntityType || !n?.relatedEntityId) return null;
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

function formatRelative(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  return d.toLocaleString();
}

function maybeShowBrowserPush(rows, lastSeenRef) {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }
  if (window.Notification.permission !== "granted") {
    return;
  }
  const unread = rows.filter((r) => !r.read);
  const next = new Set(unread.map((r) => r.id));
  const known = lastSeenRef.current;
  const freshIds = [...next].filter((id) => !known.has(id));
  lastSeenRef.current = next;
  if (!known.size) {
    // do not flood on the very first poll; just seed.
    return;
  }
  for (const id of freshIds.slice(0, 3)) {
    const row = unread.find((r) => r.id === id);
    if (!row) continue;
    try {
      const note = new window.Notification(row.title || "Notification", {
        body: row.message || "",
        tag: row.id,
      });
      note.onclick = () => {
        window.focus();
        note.close();
      };
    } catch {
      /* browser/OS may refuse, fallback is the in-app panel */
    }
  }
}

export default NotificationBell;
