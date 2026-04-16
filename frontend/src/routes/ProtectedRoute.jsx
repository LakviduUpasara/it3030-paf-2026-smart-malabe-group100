import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { isRoleAllowed } from "../utils/roleUtils";

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
    return <Navigate replace to="/access-denied" />;
  }

  return children;
}

export default ProtectedRoute;

