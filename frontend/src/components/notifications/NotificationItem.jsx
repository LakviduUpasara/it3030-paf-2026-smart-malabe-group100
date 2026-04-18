import {
  Bell,
  CalendarCheck,
  CalendarX,
  Check,
  CircleAlert,
  ClipboardCheck,
  MessageCircle,
  Wrench,
} from "lucide-react";

/**
 * Single notification row used by the bell dropdown and the notifications page.
 * Visual shape is the same in both surfaces so the design stays consistent.
 */
function NotificationItem({ notification, onOpen, dense = false }) {
  const n = notification ?? {};
  const Icon = iconFor(n);
  const handleClick = () => {
    if (typeof onOpen === "function") {
      onOpen(n);
    }
  };
  const padding = dense ? "px-2 py-2" : "px-3 py-2.5";
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex w-full items-start gap-2 rounded-xl text-left text-sm transition-colors hover:bg-tint ${padding} ${
        n.read ? "text-text/75" : "text-text"
      }`}
    >
      <span
        className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          n.read ? "bg-slate-100 text-slate-500" : tintFor(n)
        }`}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate ${n.read ? "font-medium" : "font-semibold"}`}>
          {n.title || "Notification"}
        </span>
        <span className="mt-0.5 block line-clamp-2 text-xs text-text/65">
          {n.message || ""}
        </span>
        <span className="mt-1 block text-[10px] uppercase tracking-wide text-text/50">
          {formatRelative(n.createdAt)}
          {n.actorNameSnapshot ? ` · ${n.actorNameSnapshot}` : ""}
        </span>
      </span>
      {n.read ? (
        <Check className="mt-1 h-3.5 w-3.5 text-text/40" aria-hidden />
      ) : (
        <span
          aria-hidden
          className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-primary"
        />
      )}
    </button>
  );
}

function iconFor(n) {
  switch (n.type) {
    case "BOOKING_APPROVED":
      return CalendarCheck;
    case "BOOKING_REJECTED":
      return CalendarX;
    case "BOOKING_CREATED":
      return ClipboardCheck;
    case "TICKET_ASSIGNED":
      return Wrench;
    case "TICKET_COMMENTED":
      return MessageCircle;
    case "TICKET_RESOLVED":
    case "TICKET_STATUS_CHANGED":
    case "TICKET_CREATED":
      return CircleAlert;
    default:
      return Bell;
  }
}

function tintFor(n) {
  switch (n.category) {
    case "BOOKING":
      return "bg-emerald-100 text-emerald-700";
    case "TICKET":
      return "bg-amber-100 text-amber-700";
    case "SYSTEM":
      return "bg-sky-100 text-sky-700";
    default:
      return "bg-primary/10 text-primary";
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

export default NotificationItem;
