import ProtectedRoute from "./ProtectedRoute";
import { ROLES } from "../utils/roleUtils";

/** LMS admin shell: institution admins, lost-item admins, and lecturers (teaching areas). */
function AdminRoute({ children }) {
  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.LOST_ITEM_ADMIN, ROLES.LECTURER, ROLES.MANAGER]}>
      {children}
    </ProtectedRoute>
  );
}

export default AdminRoute;

