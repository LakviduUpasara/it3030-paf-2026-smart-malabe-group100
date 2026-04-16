import { ADMIN_NAV_SECTIONS, findActiveNavItem } from "../config/adminNavConfig";

const LEGACY_FALLBACK = {
  "/admin": {
    primary: { label: "Dashboard", path: "/admin" },
    secondary: null,
    window: "Overview",
  },
};

/** Paths that resolve to known windows but may not be in main nav config (optional routes). */
const OPTIONAL_WINDOWS = {
  "/admin/notifications": { primary: { label: "Dashboard", path: "/admin" }, secondary: null, window: "Notifications" },
  "/admin/analytics": { primary: { label: "Dashboard", path: "/admin" }, secondary: null, window: "Analytics" },
  "/admin/moderation": { primary: { label: "Dashboard", path: "/admin" }, secondary: null, window: "Moderation" },
  "/admin/groups": { primary: { label: "Dashboard", path: "/admin" }, secondary: null, window: "Groups" },
  "/admin/groups/add-students": { primary: { label: "Dashboard", path: "/admin" }, secondary: null, window: "Add students" },
  "/admin/announcements": { primary: { label: "Communication", path: "/admin/communication/announcements" }, secondary: null, window: "Announcements" },
  "/admin/communication/messages": {
    primary: { label: "Communication", path: "/admin/communication/announcements" },
    secondary: null,
    window: "Messages",
  },
};

/**
 * @param {string} pathname
 * @param {{ activeWindow?: string }} [options]
 */
export function getAdminBreadcrumb(pathname, options = {}) {
  const { activeWindow = "" } = options;

  if (OPTIONAL_WINDOWS[pathname]) {
    const base = OPTIONAL_WINDOWS[pathname];
    return {
      ...base,
      window: activeWindow || base.window,
    };
  }

  const hit = findActiveNavItem(pathname, ADMIN_NAV_SECTIONS);
  if (hit) {
    const { section, item } = hit;
    const primary = {
      label: section.label,
      path: section.items[0]?.href || "/admin",
    };
    const secondary = {
      label: item.label,
      path: item.href,
    };
    const isDetail = pathname !== item.href && pathname.startsWith(`${item.href}/`);
    const defaultWindow = isDetail ? "Detail" : item.label;
    return {
      primary,
      secondary,
      window: activeWindow || defaultWindow,
    };
  }

  return (
    LEGACY_FALLBACK[pathname] || {
      primary: { label: "Dashboard", path: "/admin" },
      secondary: null,
      window: activeWindow || "Admin",
    }
  );
}
