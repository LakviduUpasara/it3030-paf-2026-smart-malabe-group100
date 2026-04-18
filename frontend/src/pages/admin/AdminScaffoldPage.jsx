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

      <section className="rounded-3xl border border-border bg-card p-6 shadow-shadow">
        <p className="text-sm text-text/72">
          This screen is not connected to live data yet. The cards below outline the intended scope and UX so future work
          matches the rest of the admin console.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-tint/40 p-5">
            <h2 className="text-base font-semibold text-heading">Scope</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text/72">
              {meta.scope.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-tint/40 p-5">
            <h2 className="text-base font-semibold text-heading">Workflows</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text/72">
              {meta.workflows.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-tint/40 p-5">
            <h2 className="text-base font-semibold text-heading">Highlights</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text/72">
              {meta.highlights.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

export default AdminScaffoldPage;
