import { Link } from "react-router-dom";
import Card from "../components/Card";
import { useAuth } from "../hooks/useAuth";
import { getDefaultRouteForRole } from "../utils/roleUtils";

function AccessDeniedPage() {
  const { user } = useAuth();
  const home = getDefaultRouteForRole(user?.role) || "/dashboard";

  return (
    <Card title="Access Denied" subtitle="You do not have permission to view this page.">
      <p className="supporting-text">
        The requested area is restricted to a different user role. Return to your
        dashboard or sign in with the correct access level.
      </p>
      <Link className="text-link" to={home}>
        Back to dashboard
      </Link>
    </Card>
  );
}

export default AccessDeniedPage;

