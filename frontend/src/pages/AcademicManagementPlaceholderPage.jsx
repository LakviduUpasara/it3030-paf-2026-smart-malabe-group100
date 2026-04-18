import { Link } from "react-router-dom";
import Card from "../components/Card";
import AdminPageHeader from "../components/admin/AdminPageHeader";

function AcademicManagementPlaceholderPage({ title, description }) {
  return (
    <>
      <AdminPageHeader
        description={description}
        title={title}
      />

      <Card
        subtitle="Navigation and routing are ready; dedicated CRUD will connect to the backend next."
        title="Placeholder"
      >
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-border bg-tint p-4">
            <p className="text-sm font-semibold text-heading">Backend ready</p>
            <p className="mt-1 text-sm text-text/72">
              The corresponding academic API exists in the Spring Boot backend, so this screen can be wired to
              real data without changing routes.
            </p>
          </article>
          <article className="rounded-2xl border border-border bg-tint p-4">
            <p className="text-sm font-semibold text-heading">Frontend pending</p>
            <p className="mt-1 text-sm text-text/72">
              This section is a stub so admin navigation stays aligned with the expanded system scope.
            </p>
          </article>
        </div>

        <p className="mt-6">
          <Link className="text-sm font-medium text-primary hover:text-primary-hover" to="/admin">
            Return to admin overview
          </Link>
        </p>
      </Card>
    </>
  );
}

export default AcademicManagementPlaceholderPage;
