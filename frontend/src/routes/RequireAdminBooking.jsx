import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { normalizeRole, ROLES } from "../utils/roleUtils";

/**
 * Booking approval APIs require platform ADMIN (Mongo {@code Role.ADMIN}). Managers use other campus tools.
 */
function RequireAdminBooking({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (normalizeRole(user?.role) !== ROLES.ADMIN) {
    return <Navigate to="/admin" replace state={{ from: location }} />;
  }

  if (children !== undefined) {
    return children;
  }

  return <Outlet />;
}

export default RequireAdminBooking;
