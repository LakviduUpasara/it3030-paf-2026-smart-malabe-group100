import {
  Building2,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  Settings,
  Users,
} from "lucide-react";

/** Console roles for LMS admin IA (API may still send ADMIN — see resolveAdminConsoleRole). */
export const LMS_ROLES = Object.freeze({
  SUPER_ADMIN: "SUPER_ADMIN",
  LECTURER: "LECTURER",
  MANAGER: "MANAGER",
});

/**
 * Section: collapsible group. Item: leaf link.
 * allowedRoles: LMS_ROLES values; SUPER_ADMIN always implied for campus ops legacy if listed.
 * matchHrefs: extra paths that should highlight this item (legacy / alias).
 */
export const ADMIN_NAV_SECTIONS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.LECTURER, LMS_ROLES.MANAGER],
    defaultOpen: true,
    items: [
      {
        id: "overview",
        label: "Overview",
        href: "/admin",
        end: true,
        matchHrefs: ["/admin"],
        allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.LECTURER, LMS_ROLES.MANAGER],
      },
    ],
  },
  {
    id: "academic-catalogue",
    label: "Academic catalogue",
    icon: GraduationCap,
    allowedRoles: [LMS_ROLES.SUPER_ADMIN],
    defaultOpen: false,
    items: [
      {
        id: "academics-faculties",
        label: "Faculties",
        href: "/admin/academics/faculties",
        allowedRoles: [LMS_ROLES.SUPER_ADMIN],
      },
      {
        id: "academics-programs",
        label: "Degree programs",
        href: "/admin/academics/degree-programs",
        allowedRoles: [LMS_ROLES.SUPER_ADMIN],
      },
      {
        id: "academics-modules",
        label: "Module catalog",
        href: "/admin/academics/modules",
        allowedRoles: [LMS_ROLES.SUPER_ADMIN],
      },
      {
        id: "academics-intakes",
        label: "Intakes",
        href: "/admin/academics/intakes",
        allowedRoles: [LMS_ROLES.SUPER_ADMIN],
      },
      {
        id: "academics-subgroups",
        label: "Subgroups",
        href: "/admin/academics/subgroups",
        allowedRoles: [LMS_ROLES.SUPER_ADMIN],
      },
      {
        id: "academics-offerings",
        label: "Module offerings",
        href: "/admin/academics/module-offerings",
        allowedRoles: [LMS_ROLES.SUPER_ADMIN],
      },
    ],
  },
  {
    id: "facilities-operations",
    label: "Resources & operations",
    icon: Building2,
    allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.MANAGER],
    defaultOpen: true,
    items: [
      {
        id: "resources-catalogue",
        label: "Resources catalogue",
        href: "/admin/resources/facilities",
        matchHrefs: ["/admin/resources/facilities", "/admin/campus/resources"],
        allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.MANAGER],
      },
      {
        id: "booking-management",
        label: "Booking management",
        href: "/admin/bookings",
        matchHrefs: ["/admin/bookings"],
        allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.MANAGER],
      },
    ],
  },
  {
    id: "tickets",
    label: "Tickets",
    icon: LifeBuoy,
    allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.MANAGER],
    defaultOpen: true,
    items: [
      {
        id: "tickets-open",
        label: "Open tickets",
        href: "/admin/tickets",
        section: "open",
        allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.MANAGER],
      },
      {
        id: "tickets-rejected-assignments",
        label: "Rejected assignments",
        href: "/admin/tickets?section=rejected-assignments",
        section: "rejected-assignments",
        allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.MANAGER],
      },
      {
        id: "tickets-assigned",
        label: "Assigned tickets",
        href: "/admin/tickets?section=assigned",
        section: "assigned",
        allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.MANAGER],
      },
      {
        id: "tickets-resolved",
        label: "Resolved tickets",
        href: "/admin/tickets?section=resolved",
        section: "resolved",
        allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.MANAGER],
      },
      {
        id: "tickets-withdrawn",
        label: "Withdrawn tickets",
        href: "/admin/tickets?section=withdrawn",
        section: "withdrawn",
        allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.MANAGER],
      },
      {
        id: "tickets-categories",
        label: "Category setup",
        href: "/admin/tickets?section=categories",
        section: "categories",
        allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.MANAGER],
      },
      {
        id: "tickets-technicians",
        label: "Technicians",
        href: "/admin/tickets?section=technicians",
        section: "technicians",
        allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.MANAGER],
      },
    ],
  },
  {
    id: "users",
    label: "Users",
    icon: Users,
    allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.MANAGER],
    defaultOpen: false,
    items: [
      {
        id: "user-requests",
        label: "User requests",
        href: "/admin/users/requests",
        matchHrefs: ["/admin/registrations"],
        allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.MANAGER],
      },
      { id: "admins", label: "Admins", href: "/admin/users/admins", allowedRoles: [LMS_ROLES.SUPER_ADMIN] },
    ],
  },
  {
    id: "communication",
    label: "Communication",
    icon: Megaphone,
    allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.LECTURER],
    defaultOpen: false,
    items: [
      { id: "announcements", label: "Announcements", href: "/admin/communication/announcements", allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.LECTURER] },
      { id: "targeted", label: "Targeted Notifications", href: "/admin/communication/targeted-notifications", allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.LECTURER] },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    icon: Settings,
    allowedRoles: [LMS_ROLES.SUPER_ADMIN],
    defaultOpen: false,
    items: [
      { id: "system-settings", label: "System Settings", href: "/admin/administration/system-settings", matchHrefs: ["/admin/settings"], allowedRoles: [LMS_ROLES.SUPER_ADMIN] },
      {
        id: "platform-security",
        label: "Platform security policy",
        href: "/admin/administration/security-settings",
        allowedRoles: [LMS_ROLES.SUPER_ADMIN],
      },
    ],
  },
];

/** Optional / legacy paths — same shell, not listed in main nav */
export const ADMIN_OPTIONAL_PATHS = [
  "/admin/notifications",
  "/admin/analytics",
  "/admin/moderation",
  "/admin/groups",
  "/admin/groups/add-students",
  "/admin/announcements",
  "/admin/communication/messages",
  "/admin/campus/resources",
  "/admin/resources/facilities",
  "/admin/campus/availability",
  "/admin/bookings",
  "/admin/tickets",
];

export function filterNavSectionsForRole(consoleRole, sections = ADMIN_NAV_SECTIONS) {
  return sections
    .map((section) => {
      if (!section.allowedRoles.includes(consoleRole)) {
        return null;
      }
      const items = section.items.filter((item) => item.allowedRoles.includes(consoleRole));
      if (items.length === 0) {
        return null;
      }
      return { ...section, items };
    })
    .filter(Boolean);
}

/**
 * Whether pathname (and optional URL search) matches an item.
 * Supports optional item.section for query-driven sub-pages
 * (e.g., /admin/tickets?section=resolved).
 */
export function isNavItemActive(pathname, item, search = "") {
  const stripQuery = (value) => String(value || "").split("?")[0];
  const hrefPath = stripQuery(item.href);
  const candidates = [hrefPath, ...(item.matchHrefs || []).map(stripQuery)];

  const pathMatches = item.end
    ? candidates.some((c) => pathname === c)
    : candidates.some((c) => pathname === c || pathname.startsWith(`${c}/`));

  if (!pathMatches) {
    return false;
  }

  if (item.section) {
    const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    const current = params.get("section");
    if (item.section === "open") {
      return current == null || current === "" || current === "open";
    }
    return current === item.section;
  }

  return true;
}

export function findActiveNavItem(pathname, sections = ADMIN_NAV_SECTIONS, search = "") {
  for (const section of sections) {
    for (const item of section.items) {
      if (isNavItemActive(pathname, item, search)) {
        return { section, item };
      }
    }
  }
  return null;
}
