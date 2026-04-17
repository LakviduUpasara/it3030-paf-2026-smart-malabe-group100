import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LMS_ROLES, resolveAdminConsoleRole } from "../utils/roleUtils";

/**
 * Campus managers and super admins: register students, staff, and approve sign-up requests.
 * (Creating platform admins stays super-admin only — see RequireSuperAdmin.)
 */
function RequireUserRegistrar() {
  const { user } = useAuth();
  const location = useLocation();
  const role = resolveAdminConsoleRole(user?.role);

  if (role !== LMS_ROLES.SUPER_ADMIN && role !== LMS_ROLES.MANAGER) {
    return <Navigate replace state={{ from: location }} to="/admin" />;
  }

  return <Outlet />;
}

export default RequireUserRegistrar;
