import { Link } from "react-router-dom";
import Card from "../components/Card";

function AcademicManagementPlaceholderPage({ title, description }) {
  return (
    <div className="page-stack academic-placeholder-page">
      <Card
        title={title}
        subtitle="Navigation and routing are ready, but the dedicated CRUD screen is still a placeholder."
      >
        <p className="supporting-text">{description}</p>

        <div className="admin-shortcut-list academic-placeholder-details">
          <article className="admin-shortcut-link academic-placeholder-card">
            <strong>Backend Ready</strong>
            <span>
              The corresponding academic API has already been added in the Spring Boot
              backend, so this page can later be connected to real data without changing
              the route structure.
            </span>
          </article>
          <article className="admin-shortcut-link academic-placeholder-card">
            <strong>Frontend Pending</strong>
            <span>
              This section currently exists as a route stub to keep admin navigation in
              sync with the expanded system scope.
            </span>
          </article>
        </div>

        <Link className="text-link" to="/admin">
          Return to admin overview
        </Link>
      </Card>
    </div>
  );
}

export default AcademicManagementPlaceholderPage;
