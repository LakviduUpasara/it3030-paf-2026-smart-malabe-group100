import ProtectedRoute from "./ProtectedRoute";
import { ROLES } from "../utils/roleUtils";

function AdminRoute({ children }) {
  return <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>{children}</ProtectedRoute>;
}

export default AdminRoute;

