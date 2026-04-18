import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LMS_ROLES, resolveAdminConsoleRole } from "../utils/roleUtils";

/**
 * Blocks lecturers from super-admin-only areas. Use with `Outlet` (nested routes) or wrap a single element in `children`.
 */
function RequireSuperAdmin({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const role = resolveAdminConsoleRole(user?.role);

  if (role !== LMS_ROLES.SUPER_ADMIN) {
    return <Navigate to="/admin" replace state={{ from: location }} />;
  }

  if (children !== undefined) {
    return children;
  }

  return <Outlet />;
}

export default RequireSuperAdmin;
