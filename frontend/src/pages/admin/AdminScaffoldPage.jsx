import { useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import AdminPageHeader from "../../components/admin/AdminPageHeader";

const DEFAULT_META = {
  title: "Admin",
  description: "This area is scaffolded until the API and forms are connected.",
  scope: [
    "Define domain entities, validation rules, and filters aligned with the academic hierarchy.",
    "Wire list endpoints with pagination, search, sort, and role checks.",
  ],
  workflows: [
    "Modal-based create/edit, delete confirmation, and optimistic or refetch patterns.",
    "Cascade dropdowns: faculty → degree → intake → term → stream → subgroup.",
  ],
  highlights: [
    "Accessible tables, deferred search, and toast feedback for saves and errors.",
  ],
};

/** Path prefix → scaffold copy */
const META_BY_PREFIX = [
  { prefix: "/admin/academics", title: "Academics", description: "Configure faculties, programs, intakes, terms, streams, subgroups, modules, and offerings." },
  { prefix: "/admin/users", title: "Users", description: "Manage students, staff, admins, roles, and bulk import." },
  { prefix: "/admin/teaching", title: "Teaching", description: "Assignments to offerings, timetable, locations, and subgroup placement." },
  { prefix: "/admin/assessments", title: "Assessments", description: "Assignments, deadlines, submissions, and grading workflows." },
  { prefix: "/admin/resources", title: "Learning resources", description: "Module content, uploads, and visibility." },
  { prefix: "/admin/communication", title: "Communication", description: "Announcements and targeted notifications." },
  { prefix: "/admin/reports", title: "Reports", description: "Analytics and operational reports." },
  { prefix: "/admin/administration", title: "Administration", description: "System settings, audit, security, and backups." },
];

function resolveMeta(pathname) {
  for (const row of META_BY_PREFIX) {
    if (pathname === row.prefix || pathname.startsWith(`${row.prefix}/`)) {
      return { ...DEFAULT_META, title: row.title, description: row.description };
    }
  }
  return DEFAULT_META;
}

function AdminScaffoldPage() {
  const location = useLocation();
  const params = useParams();

  const meta = useMemo(() => resolveMeta(location.pathname), [location.pathname]);

  const titleSuffix = useMemo(() => {
    if (params.studentId) {
      return ` — Student ${params.studentId}`;
    }
    if (params.staffId) {
      return ` — Staff ${params.staffId}`;
    }
    return "";
  }, [params.studentId, params.staffId]);

  return (
    <>
      <AdminPageHeader
        description={meta.description}
        title={`${meta.title}${titleSuffix}`}
      />

      <div className="inline-flex items-center rounded-full border border-border bg-tint px-2.5 py-1 text-xs font-semibold text-text/80">
        Scaffold · Backend pending
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-shadow">
          <h2 className="text-base font-semibold text-heading">Scope</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-text/72">
            {meta.scope.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
        <section className="rounded-3xl border border-border bg-card p-6 shadow-shadow">
          <h2 className="text-base font-semibold text-heading">Workflows</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-text/72">
            {meta.workflows.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
        <section className="rounded-3xl border border-border bg-card p-6 shadow-shadow">
          <h2 className="text-base font-semibold text-heading">Highlights</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-text/72">
            {meta.highlights.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

export default AdminScaffoldPage;
