export const ROLES = Object.freeze({
  USER: "USER",
  ADMIN: "ADMIN",
  TECHNICIAN: "TECHNICIAN",
});

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

export const ADMIN_RESOURCE_NAV_ITEMS = [
  {
    label: "Manage Resources",
    path: "/admin/resources",
    description: "Maintain lecture halls, labs, meeting rooms, and shared equipment.",
  },
];

export const ADMIN_ACADEMIC_NAV_ITEMS = [
  {
    label: "Degree Programs",
    path: "/admin/academic/programs",
    description: "Manage programme codes, faculties, departments, and active status.",
  },
  {
    label: "Academic Modules",
    path: "/admin/academic/modules",
    description: "Maintain module master data, credit values, and department ownership.",
  },
  {
    label: "Semesters",
    path: "/admin/academic/semesters",
    description: "Define semester schedules and academic periods for each programme.",
  },
  {
    label: "Student Groups",
    path: "/admin/academic/student-groups",
    description: "Track batches, group sizes, and semester-linked cohort structures.",
  },
  {
    label: "Module Offerings",
    path: "/admin/academic/module-offerings",
    description: "Attach modules to semesters, coordinators, and academic year labels.",
  },
  {
    label: "Academic Sessions",
    path: "/admin/academic/sessions",
    description: "Schedule teaching sessions across offerings, groups, and campus resources.",
  },
];

export const ADMIN_OPERATIONS_NAV_ITEMS = [
  {
    label: "Booking Approvals",
    path: "/admin/bookings",
    description: "Review and approve pending resource booking requests.",
  },
  {
    label: "Manage Tickets",
    path: "/admin/tickets",
    description: "Coordinate maintenance requests and operational issues.",
  },
  {
    label: "Notifications",
    path: "/notifications",
    description: "Monitor alerts, updates, and campus-wide operational notices.",
  },
];

export function getDefaultRouteForRole(role) {
  const r = normalizeRole(role);

  if (r === ROLES.ADMIN) {
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

export function getNavigationGroups(role) {
  if (role !== ROLES.ADMIN) {
    return [];
  }

  return [
    { label: "Resources", items: ADMIN_RESOURCE_NAV_ITEMS },
    { label: "Academic Management", items: ADMIN_ACADEMIC_NAV_ITEMS },
    { label: "Operations", items: ADMIN_OPERATIONS_NAV_ITEMS },
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

