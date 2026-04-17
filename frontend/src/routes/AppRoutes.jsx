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

function renderAcademicPlaceholderRoute(item) {
  return (
    <Route
      key={item.path}
      path={item.path}
      element={
        <AdminRoute>
          <AcademicManagementPlaceholderPage
            title={item.label}
            description={item.description}
          />
        </AdminRoute>
      }
    />
  );
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
        path="/technician/resolved"
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
            <AdminDashboardPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/resources"
        element={
          <AdminRoute>
            <ManageResourcesPage />
          </AdminRoute>
        }
      />
      {ADMIN_ACADEMIC_NAV_ITEMS.map(renderAcademicPlaceholderRoute)}
      <Route
        path="/admin/registrations"
        element={
          <AdminRoute>
            <ManageSignupRequestsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/bookings"
        element={
          <AdminRoute>
            <ApproveBookingsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/tickets"
        element={
          <AdminRoute>
            <ManageTicketsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <AdminRoute>
            <Navigate replace to="/admin/tickets?section=categories" />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/technicians"
        element={
          <AdminRoute>
            <Navigate replace to="/admin/tickets?section=technicians" />
          </AdminRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;
