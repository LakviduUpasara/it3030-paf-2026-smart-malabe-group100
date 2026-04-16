/**
 * Breadcrumb metadata for the admin shell top bar.
 * primary: main section link; secondary: optional subsection; window: current view label (not a link).
 */
const ROUTES = {
  "/admin": {
    primary: { label: "Dashboard", path: "/admin" },
    secondary: null,
    window: "Overview",
  },
  "/admin/resources": {
    primary: { label: "Resources", path: "/admin/resources" },
    secondary: null,
    window: "Manage resources",
  },
  "/admin/registrations": {
    primary: { label: "Access", path: "/admin/registrations" },
    secondary: null,
    window: "User approvals",
  },
  "/admin/bookings": {
    primary: { label: "Bookings", path: "/admin/bookings" },
    secondary: null,
    window: "Approval queue",
  },
  "/admin/tickets": {
    primary: { label: "Operations", path: "/admin/tickets" },
    secondary: null,
    window: "Ticket desk",
  },
};

function academicWindowLabel(pathname) {
  const labels = {
    "/admin/academic/programs": "Degree programs",
    "/admin/academic/modules": "Academic modules",
    "/admin/academic/semesters": "Semesters",
    "/admin/academic/student-groups": "Student groups",
    "/admin/academic/module-offerings": "Module offerings",
    "/admin/academic/sessions": "Academic sessions",
  };
  return labels[pathname] || "Academic";
}

export function getAdminBreadcrumb(pathname) {
  if (pathname.startsWith("/admin/academic/")) {
    return {
      primary: { label: "Dashboard", path: "/admin" },
      secondary: { label: "Academic", path: "/admin/academic/programs" },
      window: academicWindowLabel(pathname),
    };
  }

  return ROUTES[pathname] || ROUTES["/admin"];
}
