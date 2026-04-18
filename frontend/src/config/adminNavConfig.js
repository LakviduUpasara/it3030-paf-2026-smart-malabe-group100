import {
  LayoutDashboard,
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

/** Whether pathname matches item (including matchHrefs and prefix for detail routes). */
export function isNavItemActive(pathname, item) {
  if (item.end) {
    const candidates = [item.href, ...(item.matchHrefs || [])];
    return candidates.some((c) => pathname === c);
  }
  const candidates = [item.href, ...(item.matchHrefs || [])];
  for (const c of candidates) {
    if (pathname === c) {
      return true;
    }
    if (pathname.startsWith(`${c}/`)) {
      return true;
    }
  }
  return false;
}

export function findActiveNavItem(pathname, sections = ADMIN_NAV_SECTIONS) {
  for (const section of sections) {
    for (const item of section.items) {
      if (isNavItemActive(pathname, item)) {
        return { section, item };
      }
    }
  }
  return null;
}
