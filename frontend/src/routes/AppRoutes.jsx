import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AccessDeniedPage from "../pages/AccessDeniedPage";
import AcademicManagementPlaceholderPage from "../pages/AcademicManagementPlaceholderPage";
import AdminDashboardPage from "../pages/AdminDashboardPage";
import ApproveBookingsPage from "../pages/ApproveBookingsPage";
import ApprovalPendingPage from "../pages/ApprovalPendingPage";
import CreateBookingPage from "../pages/CreateBookingPage";
import DashboardPage from "../pages/DashboardPage";
import LoginPage from "../pages/LoginPage";
import ManageSignupRequestsPage from "../pages/ManageSignupRequestsPage";
import ManageResourcesPage from "../pages/ManageResourcesPage";
import ManageTicketsPage from "../pages/ManageTicketsPage";
import MyBookingsPage from "../pages/MyBookingsPage";
import MyTicketsPage from "../pages/MyTicketsPage";
import NotificationsPage from "../pages/NotificationsPage";
import NotFoundPage from "../pages/NotFoundPage";
import PublicLandingPage from "../pages/PublicLandingPage";
import SignupPage from "../pages/SignupPage";
import TechnicianDashboardPage from "../pages/TechnicianDashboardPage";
import AdminConsoleLayout from "../components/admin/AdminConsoleLayout";
import AdminRoute from "./AdminRoute";
import ProtectedRoute from "./ProtectedRoute";
import {
  ADMIN_ACADEMIC_NAV_ITEMS,
  getDefaultRouteForRole,
  ROLES,
} from "../utils/roleUtils";

function PublicHomeRoute() {
  const { isAuthenticated, pendingApproval, user } = useAuth();

  if (isAuthenticated) {
    return <Navigate replace to={getDefaultRouteForRole(user?.role)} />;
  }

  if (pendingApproval?.status === "PENDING") {
    return <Navigate replace to="/approval-pending" />;
  }

  return <PublicLandingPage />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route index element={<PublicHomeRoute />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/approval-pending" element={<ApprovalPendingPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute allowedRoles={[ROLES.USER]}>
            <MyBookingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings/new"
        element={
          <ProtectedRoute allowedRoles={[ROLES.USER]}>
            <CreateBookingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tickets"
        element={
          <ProtectedRoute allowedRoles={[ROLES.USER]}>
            <MyTicketsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/technician"
        element={
          <ProtectedRoute allowedRoles={[ROLES.TECHNICIAN]}>
            <TechnicianDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminConsoleLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="resources" element={<ManageResourcesPage />} />
        {ADMIN_ACADEMIC_NAV_ITEMS.map((item) => (
          <Route
            key={item.path}
            path={item.path.replace(/^\/admin\//, "")}
            element={
              <AcademicManagementPlaceholderPage
                title={item.label}
                description={item.description}
              />
            }
          />
        ))}
        <Route path="registrations" element={<ManageSignupRequestsPage />} />
        <Route path="bookings" element={<ApproveBookingsPage />} />
        <Route path="tickets" element={<ManageTicketsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;
