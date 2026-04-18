import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LMS_ROLES, resolveAdminConsoleRole } from "../utils/roleUtils";

/**
 * Resources catalogue, booking approvals, and incident desk — super admins and campus managers.
 */
function RequireCampusOperator({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const role = resolveAdminConsoleRole(user?.role);

  if (role !== LMS_ROLES.SUPER_ADMIN && role !== LMS_ROLES.MANAGER) {
    return <Navigate to="/admin" replace state={{ from: location }} />;
  }

  if (children !== undefined) {
    return children;
  }

  return <Outlet />;
}

export default RequireCampusOperator;
