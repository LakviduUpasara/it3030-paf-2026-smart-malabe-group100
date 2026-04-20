import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getDefaultRouteForRole, isRoleAllowed } from "../utils/roleUtils";

/**
 * Guards a route by authentication and optional role whitelist.
 *
 * When an authenticated user lands on a route they are NOT allowed to see we
 * send them back to their own role's home (e.g. a TECHNICIAN bouncing off an
 * admin route returns to {@code /technician}) instead of surfacing the shared
 * Access Denied page, which previously rendered the global Navbar with a
 * different shell. The dedicated {@code /access-denied} page is still available
 * as an explicit destination for callers that opt into it.
 */
function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, pendingApproval, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    if (pendingApproval?.status === "PENDING") {
      return <Navigate replace state={{ from: location }} to="/approval-pending" />;
    }

    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  if (!isRoleAllowed(user?.role, allowedRoles)) {
    const home = getDefaultRouteForRole(user?.role);
    const onHomeAlready = home && location.pathname === home;
    return <Navigate replace to={onHomeAlready ? "/access-denied" : home} />;
  }

  return children;
}

export default ProtectedRoute;

