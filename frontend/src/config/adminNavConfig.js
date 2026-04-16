import {
  BookOpen,
  Building2,
  ClipboardCheck,
  FolderTree,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  Megaphone,
  Settings,
  Users,
} from "lucide-react";

/** Console roles for LMS admin IA (API may still send ADMIN — see resolveAdminConsoleRole). */
export const LMS_ROLES = Object.freeze({
  SUPER_ADMIN: "SUPER_ADMIN",
  LECTURER: "LECTURER",
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
    allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.LECTURER],
    defaultOpen: true,
    items: [
      {
        id: "overview",
        label: "Overview",
        href: "/admin",
        end: true,
        matchHrefs: ["/admin"],
        allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.LECTURER],
      },
    ],
  },
  {
    id: "academics",
    label: "Academics",
    icon: GraduationCap,
    allowedRoles: [LMS_ROLES.SUPER_ADMIN],
    defaultOpen: true,
    items: [
      { id: "faculties", label: "Faculties", href: "/admin/academics/faculties", matchHrefs: ["/admin/faculty"], allowedRoles: [LMS_ROLES.SUPER_ADMIN] },
      { id: "degree-programs", label: "Degree Programs", href: "/admin/academics/degree-programs", allowedRoles: [LMS_ROLES.SUPER_ADMIN] },
      { id: "intakes", label: "Intakes / Batches", href: "/admin/academics/intakes", allowedRoles: [LMS_ROLES.SUPER_ADMIN] },
      { id: "academic-terms", label: "Academic Terms", href: "/admin/academics/academic-terms", allowedRoles: [LMS_ROLES.SUPER_ADMIN] },
      { id: "streams", label: "Streams", href: "/admin/academics/streams", allowedRoles: [LMS_ROLES.SUPER_ADMIN] },
      { id: "subgroups", label: "Subgroups", href: "/admin/academics/subgroups", allowedRoles: [LMS_ROLES.SUPER_ADMIN] },
      { id: "modules", label: "Modules", href: "/admin/academics/modules", matchHrefs: ["/admin/modules"], allowedRoles: [LMS_ROLES.SUPER_ADMIN] },
      { id: "module-offerings", label: "Module Offerings", href: "/admin/academics/module-offerings", allowedRoles: [LMS_ROLES.SUPER_ADMIN] },
    ],
  },
  {
    id: "users",
    label: "Users",
    icon: Users,
    allowedRoles: [LMS_ROLES.SUPER_ADMIN],
    defaultOpen: false,
    items: [
      { id: "students", label: "Students", href: "/admin/users/students", allowedRoles: [LMS_ROLES.SUPER_ADMIN] },
      { id: "lecturers", label: "Lecturers", href: "/admin/users/lecturers", allowedRoles: [LMS_ROLES.SUPER_ADMIN] },
      { id: "lab-assistants", label: "Lab Assistants", href: "/admin/users/lab-assistants", allowedRoles: [LMS_ROLES.SUPER_ADMIN] },
      { id: "admins", label: "Admins", href: "/admin/users/admins", allowedRoles: [LMS_ROLES.SUPER_ADMIN] },
      { id: "roles", label: "Roles & Permissions", href: "/admin/users/roles-permissions", allowedRoles: [LMS_ROLES.SUPER_ADMIN] },
      { id: "bulk-import", label: "Bulk Import", href: "/admin/users/bulk-import", allowedRoles: [LMS_ROLES.SUPER_ADMIN] },
    ],
  },
  {
    id: "teaching",
    label: "Teaching",
    icon: BookOpen,
    allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.LECTURER],
    defaultOpen: true,
    items: [
      { id: "teaching-assignments", label: "Teaching Assignments", href: "/admin/teaching/teaching-assignments", allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.LECTURER] },
      { id: "timetable", label: "Timetable", href: "/admin/teaching/timetable", allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.LECTURER] },
      { id: "locations", label: "Locations / Labs", href: "/admin/teaching/locations", allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.LECTURER] },
      { id: "subgroup-allocation", label: "Subgroup Allocation", href: "/admin/teaching/subgroup-allocation", allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.LECTURER] },
    ],
  },
  {
    id: "assessments",
    label: "Assessments",
    icon: ClipboardCheck,
    allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.LECTURER],
    defaultOpen: false,
    items: [
      { id: "assignments", label: "Assignments", href: "/admin/assessments/assignments", allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.LECTURER] },
      { id: "subgroup-deadlines", label: "Subgroup Deadlines", href: "/admin/assessments/subgroup-deadlines", allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.LECTURER] },
      { id: "submissions", label: "Submissions", href: "/admin/assessments/submissions", allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.LECTURER] },
      { id: "quizzes", label: "Quizzes", href: "/admin/quizzes", matchHrefs: ["/admin/assessments/quizzes"], allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.LECTURER] },
      { id: "grades", label: "Grades", href: "/admin/grades", matchHrefs: ["/admin/assessments/grades"], allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.LECTURER] },
    ],
  },
  {
    id: "resources-lms",
    label: "Resources",
    icon: FolderTree,
    allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.LECTURER],
    defaultOpen: false,
    items: [
      { id: "module-content", label: "Module Content", href: "/admin/resources/module-content", allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.LECTURER] },
      { id: "upload-materials", label: "Upload Materials", href: "/admin/resources/upload-materials", allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.LECTURER] },
      { id: "visibility", label: "Content Visibility", href: "/admin/resources/visibility-settings", allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.LECTURER] },
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
    id: "reports",
    label: "Reports",
    icon: LineChart,
    allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.LECTURER],
    defaultOpen: false,
    items: [
      { id: "student-analytics", label: "Student Analytics", href: "/admin/reports/student-analytics", allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.LECTURER] },
      { id: "submission-reports", label: "Submission Reports", href: "/admin/reports/submission-reports", allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.LECTURER] },
      { id: "lecturer-workload", label: "Lecturer Workload", href: "/admin/reports/lecturer-workload", allowedRoles: [LMS_ROLES.SUPER_ADMIN, LMS_ROLES.LECTURER] },
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
      { id: "audit-logs", label: "Audit Logs", href: "/admin/administration/audit-logs", allowedRoles: [LMS_ROLES.SUPER_ADMIN] },
      { id: "security", label: "Security Settings", href: "/admin/administration/security-settings", allowedRoles: [LMS_ROLES.SUPER_ADMIN] },
      { id: "backups", label: "Backup Management", href: "/admin/administration/backup-management", allowedRoles: [LMS_ROLES.SUPER_ADMIN] },
    ],
  },
  {
    id: "campus-ops",
    label: "Campus operations",
    icon: Building2,
    allowedRoles: [LMS_ROLES.SUPER_ADMIN],
    defaultOpen: false,
    items: [
      { id: "campus-resources", label: "Resource catalog", href: "/admin/campus/resources", allowedRoles: [LMS_ROLES.SUPER_ADMIN] },
      { id: "bookings", label: "Booking approvals", href: "/admin/bookings", allowedRoles: [LMS_ROLES.SUPER_ADMIN] },
      { id: "tickets", label: "Tickets", href: "/admin/tickets", allowedRoles: [LMS_ROLES.SUPER_ADMIN] },
      { id: "registrations", label: "User registrations", href: "/admin/registrations", allowedRoles: [LMS_ROLES.SUPER_ADMIN] },
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
