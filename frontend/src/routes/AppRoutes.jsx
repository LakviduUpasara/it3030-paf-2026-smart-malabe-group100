import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AccessDeniedPage from "../pages/AccessDeniedPage";
import AdminDashboardPage from "../pages/AdminDashboardPage";
import ApproveBookingsPage from "../pages/ApproveBookingsPage";
import CreateBookingPage from "../pages/CreateBookingPage";
import DashboardPage from "../pages/DashboardPage";
import LoginPage from "../pages/LoginPage";
import ManageResourcesPage from "../pages/ManageResourcesPage";
import ManageTicketsPage from "../pages/ManageTicketsPage";
import MyBookingsPage from "../pages/MyBookingsPage";
import MyTicketsPage from "../pages/MyTicketsPage";
import NotificationsPage from "../pages/NotificationsPage";
import NotFoundPage from "../pages/NotFoundPage";
import TechnicianDashboardPage from "../pages/TechnicianDashboardPage";
import AdminRoute from "./AdminRoute";
import ProtectedRoute from "./ProtectedRoute";
import { getDefaultRouteForRole, ROLES } from "../utils/roleUtils";

function RootRedirect() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate replace to="/login" />;
  }

  return <Navigate replace to={getDefaultRouteForRole(user?.role)} />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route index element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
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

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;
