import {
  Bell,
  CalendarPlus,
  ClipboardList,
  LayoutDashboard,
  LifeBuoy,
  Search,
  Settings,
} from "lucide-react";

/**
 * Navigation config for the end-user console (mirrors adminNavConfig pattern).
 * Sections render as collapsible groups in the sidebar; each item is a leaf link.
 */
export const USER_NAV_SECTIONS = [
  {
    id: "workspace",
    label: "Workspace",
    icon: LayoutDashboard,
    defaultOpen: true,
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        end: true,
        matchHrefs: ["/dashboard"],
      },
      {
        id: "my-bookings",
        label: "My bookings",
        href: "/bookings",
        icon: ClipboardList,
        end: true,
      },
      {
        id: "create-booking",
        label: "Create booking",
        href: "/bookings/new",
        icon: CalendarPlus,
        end: true,
      },
      {
        id: "check-availability",
        label: "Check availability",
        href: "/bookings/availability",
        icon: Search,
        end: true,
      },
      {
        id: "my-tickets",
        label: "My tickets",
        href: "/tickets",
        icon: LifeBuoy,
        end: true,
      },
      {
        id: "notifications",
        label: "Notifications",
        href: "/notifications",
        icon: Bell,
        end: true,
      },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    icon: Settings,
    defaultOpen: false,
    items: [
      {
        id: "system-settings",
        label: "System settings",
        href: "/settings/security",
        icon: Settings,
        end: true,
      },
    ],
  },
];

export function isUserNavItemActive(pathname, item) {
  const candidates = [item.href, ...(item.matchHrefs || [])].map((u) => u.split("?")[0]);
  if (item.end) {
    return candidates.some((c) => pathname === c);
  }
  return candidates.some((c) => pathname === c || pathname.startsWith(`${c}/`));
}
