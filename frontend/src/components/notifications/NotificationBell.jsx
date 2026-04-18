import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, MailOpen } from "lucide-react";
import NotificationItem from "./NotificationItem";
import useNotifications from "../../hooks/useNotifications";

/**
 * Hover-first notification bell for the Smart Campus top bar.
 *
 * UX hybrid (per product brief):
 *  - hovering the bell opens the dropdown
 *  - clicking also opens (and toggles closed) — critical for touch users
 *  - clicking outside, pressing Escape, or scrolling away closes the dropdown
 *
 * The list rendered in the dropdown is fed by {@link useNotifications}, which pulls the
 * `GET /api/v1/notifications/recent` endpoint and the unread counter.
 */
function NotificationBell({ pollMs = 30_000, limit = 6 }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const closeTimerRef = useRef(null);

  const { items, unread, loading, error, markOneRead, markEveryoneRead } = useNotifications({
    limit,
    pollMs,
  });

  const cancelCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    cancelCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 160);
  };

  const handleEnter = () => {
    cancelCloseTimer();
    setOpen(true);
  };

  useEffect(() => () => cancelCloseTimer(), []);

  useEffect(() => {
    if (!open) return undefined;
    const handleDocClick = (event) => {
      if (!wrapperRef.current) return;
      if (wrapperRef.current.contains(event.target)) return;
      setOpen(false);
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleDocClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleDocClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleSelect = useCallback(
    async (n) => {
      setOpen(false);
      if (!n.read) {
        await markOneRead(n.id);
      }
      const target = linkFor(n);
      if (target) {
        navigate(target);
      }
    },
    [navigate, markOneRead],
  );

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-tint text-heading transition-colors hover:bg-slate-200/40"
        onClick={() => setOpen((v) => !v)}
        onFocus={handleEnter}
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-[380px] max-w-[92vw] rounded-2xl border border-border bg-card p-2 shadow-shadow ring-1 ring-black/5"
        >
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <div>
              <p className="text-sm font-semibold text-heading">Notifications</p>
              <p className="text-[11px] text-text/60">
                {unread > 0 ? `${unread} unread` : "All caught up"}
              </p>
            </div>
            <button
              type="button"
              onClick={markEveryoneRead}
              className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-medium text-text/70 hover:bg-tint hover:text-heading disabled:opacity-60"
              disabled={loading || unread === 0}
            >
              <MailOpen className="h-3.5 w-3.5" aria-hidden /> Mark all as read
            </button>
          </div>

          {error ? (
            <div
              className="m-2 rounded-xl border border-red-200 bg-red-50 p-2 text-xs text-red-700"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          {loading && items.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-text/60">Loading…</p>
          ) : null}

          {!loading && items.length === 0 && !error ? (
            <div className="px-3 py-6 text-center text-xs text-text/60">
              <Bell className="mx-auto mb-2 h-6 w-6 text-text/30" aria-hidden />
              <p>You have no notifications yet.</p>
              <p className="mt-0.5 text-[11px] text-text/50">
                Booking and ticket updates will appear here in real time.
              </p>
            </div>
          ) : null}

          <ul className="max-h-[60vh] overflow-y-auto">
            {items.map((n) => (
              <li key={n.id}>
                <NotificationItem notification={n} onOpen={handleSelect} dense />
              </li>
            ))}
          </ul>

          <div className="mt-1 flex justify-end px-2 pb-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/notifications");
              }}
              className="rounded-xl px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
            >
              View all
            </button>
          </div>
        </div>
      ) : null}
    </div>
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

export default NotificationBell;
