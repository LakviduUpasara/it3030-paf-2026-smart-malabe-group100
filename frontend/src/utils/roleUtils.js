export const ROLES = Object.freeze({
  USER: "USER",
  ADMIN: "ADMIN",
  TECHNICIAN: "TECHNICIAN",
});

export function getDefaultRouteForRole(role) {
  if (role === ROLES.ADMIN) {
    return "/admin";
  }

  if (role === ROLES.TECHNICIAN) {
    return "/technician";
  }

  return "/dashboard";
}

export function isRoleAllowed(role, allowedRoles = []) {
  if (!allowedRoles.length) {
    return true;
  }

  return allowedRoles.includes(role);
}

export function getNavigationItems(role) {
  const commonItems = [{ label: "Dashboard", path: "/dashboard" }];

  if (role === ROLES.ADMIN) {
    return [
      ...commonItems,
      { label: "Admin Dashboard", path: "/admin" },
      { label: "User Approvals", path: "/admin/registrations" },
      { label: "Manage Resources", path: "/admin/resources" },
      { label: "Booking Approvals", path: "/admin/bookings" },
      { label: "Manage Tickets", path: "/admin/tickets" },
      { label: "Notifications", path: "/notifications" },
    ];
  }

  if (role === ROLES.TECHNICIAN) {
    return [
      ...commonItems,
      { label: "Technician Desk", path: "/technician" },
      { label: "Notifications", path: "/notifications" },
    ];
  }

  return [
    ...commonItems,
    { label: "My Bookings", path: "/bookings" },
    { label: "Create Booking", path: "/bookings/new" },
    { label: "My Tickets", path: "/tickets" },
    { label: "Notifications", path: "/notifications" },
  ];
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

