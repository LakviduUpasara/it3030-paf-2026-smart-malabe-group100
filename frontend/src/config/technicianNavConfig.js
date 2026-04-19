import {
  Bell,
  CheckCircle2,
  ClipboardList,
  Inbox,
  LifeBuoy,
  Settings,
  XCircle,
} from "lucide-react";

/**
 * Sidebar IA for the technician console.
 *
 * Tickets        -> queue pages (open / assigned / resolved / withdrawn).
 * Administration -> system settings + notifications inbox.
 *
 * 'Category setup' and 'Technicians' have been removed from the technician
 * navigation — those configuration surfaces are managed from the admin console.
 */
export const TECHNICIAN_NAV_SECTIONS = [
  {
    id: "tickets",
    label: "Tickets",
    icon: LifeBuoy,
    defaultOpen: true,
    items: [
      {
        id: "tickets-open",
        label: "Open tickets",
        href: "/technician/accept",
        icon: Inbox,
        end: true,
      },
      {
        id: "tickets-assigned",
        label: "Assigned tickets",
        href: "/technician/tickets",
        icon: ClipboardList,
        end: true,
      },
      {
        id: "tickets-resolved",
        label: "Resolved tickets",
        href: "/technician/resolved",
        icon: CheckCircle2,
        end: true,
      },
      {
        id: "tickets-withdrawn",
        label: "Withdrawn tickets",
        href: "/technician/withdrawn",
        icon: XCircle,
        end: true,
      },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    icon: Settings,
    defaultOpen: true,
    items: [
      {
        id: "system-settings",
        label: "System settings",
        href: "/settings/security",
        icon: Settings,
        end: true,
      },
      {
        id: "notifications",
        label: "Notifications",
        href: "/technician/notifications",
        icon: Bell,
        end: true,
      },
    ],
  },
];

export function isTechnicianNavItemActive(pathname, item) {
  const candidates = [item.href, ...(item.matchHrefs || [])].map(
    (u) => String(u || "").split("?")[0],
  );
  if (item.end) {
    return candidates.some((c) => pathname === c);
  }
  return candidates.some((c) => pathname === c || pathname.startsWith(`${c}/`));
}
