import { LMS_ROLES } from "../config/adminNavConfig";

export { LMS_ROLES };

export const ROLES = Object.freeze({
  USER: "USER",
  ADMIN: "ADMIN",
  TECHNICIAN: "TECHNICIAN",
  MANAGER: "MANAGER",
  LECTURER: "LECTURER",
  LAB_ASSISTANT: "LAB_ASSISTANT",
  STUDENT: "STUDENT",
  LOST_ITEM_ADMIN: "LOST_ITEM_ADMIN",
});

/**
 * Maps API roles to LMS admin console roles. Legacy ADMIN → SUPER_ADMIN for full IA.
 */
export function resolveAdminConsoleRole(apiRole) {
  const r = normalizeRole(apiRole);
  if (r === ROLES.ADMIN || r === ROLES.LOST_ITEM_ADMIN) {
    return LMS_ROLES.SUPER_ADMIN;
  }
  if (r === ROLES.LECTURER || r === "TEACHER") {
    return LMS_ROLES.LECTURER;
  }
  if (r === ROLES.MANAGER) {
    return LMS_ROLES.MANAGER;
  }
  return r;
}

/** Handles string or legacy { name } shapes from APIs. */
export function normalizeRole(role) {
  if (role == null || role === "") {
    return null;
  }

  if (typeof role === "string") {
    return role.trim().toUpperCase();
  }

  if (typeof role === "object" && role !== null && typeof role.name === "string") {
    return role.name.trim().toUpperCase();
  }

  return String(role).trim().toUpperCase();
}

export const ADMIN_OPERATIONS_NAV_ITEMS = [
  {
    label: "Notifications",
    path: "/notifications",
    description: "Monitor alerts, updates, and campus-wide operational notices.",
  },
];

export function getDefaultRouteForRole(role) {
  const r = normalizeRole(role);

  if (r === ROLES.ADMIN || r === ROLES.LOST_ITEM_ADMIN) {
    return "/admin";
  }

  if (r === ROLES.LECTURER) {
    return "/admin";
  }

  if (r === ROLES.MANAGER) {
    return "/admin";
  }

  if (r === ROLES.TECHNICIAN) {
    return "/technician";
  }

  return "/dashboard";
}

export function isRoleAllowed(role, allowedRoles = []) {
  if (!allowedRoles.length) {
    return true;
  }

  const r = normalizeRole(role);
  return allowedRoles.some((allowed) => normalizeRole(allowed) === r);
}

export function getNavigationItems(role) {
  const commonItems = [{ label: "Dashboard", path: "/dashboard" }];

  if (role === ROLES.ADMIN) {
    return [
      ...commonItems,
      { label: "Admin Dashboard", path: "/admin" },
      { label: "User requests", path: "/admin/users/requests" },
      { label: "Notifications", path: "/notifications" },
    ];
  }

  if (role === ROLES.TECHNICIAN) {
    return [
      { label: "Desk", path: "/technician", end: true },
      { label: "My tickets", path: "/technician/tickets" },
      { label: "Accept", path: "/technician/accept", end: true },
      { label: "Resolved", path: "/technician/resolved" },
      { label: "Alerts", path: "/technician/notifications" },
    ];
  }

  return [
    ...commonItems,
    { label: "My Bookings", path: "/bookings" },
    { label: "Create Booking", path: "/bookings/new" },
    { label: "Check availability", path: "/bookings/availability" },
    { label: "My Tickets", path: "/tickets" },
    { label: "Notifications", path: "/notifications" },
  ];
}

export function getNavigationGroups(role) {
  if (role !== ROLES.ADMIN) {
    return [];
  }

  return [{ label: "Operations", items: ADMIN_OPERATIONS_NAV_ITEMS }];
}

export function getRoleDescription(role) {
  switch (role) {
    case ROLES.ADMIN:
      return "Oversees campus resources, approvals, and operational tickets.";
    case ROLES.TECHNICIAN:
      return "Handles assigned maintenance and incident work across the campus.";
    default:
      return "Books resources, tracks requests, and receives operational updates.";
  }
}

