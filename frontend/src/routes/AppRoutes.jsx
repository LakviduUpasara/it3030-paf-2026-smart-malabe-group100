import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AccessDeniedPage from "../pages/AccessDeniedPage";
import AdminDashboardPage from "../pages/AdminDashboardPage";
import AdminScaffoldPage from "../pages/admin/AdminScaffoldPage";
import SystemSettingsPage from "../pages/SystemSettingsPage";
import CatalogModulesAdminPage from "../pages/admin/CatalogModulesAdminPage";
import DegreeProgramsAdminPage from "../pages/admin/DegreeProgramsAdminPage";
import FacultiesAdminPage from "../pages/admin/FacultiesAdminPage";
import AdminsAdminPage from "../pages/admin/AdminsAdminPage";
import StaffRegistrationPage from "../pages/admin/StaffRegistrationPage";
import StudentsAdminPage from "../pages/admin/StudentsAdminPage";
import IntakesAdminPage from "../pages/admin/IntakesAdminPage";
import SubgroupsAdminPage from "../pages/admin/SubgroupsAdminPage";
import ModuleOfferingsAdminPage from "../pages/admin/ModuleOfferingsAdminPage";
import ApproveBookingsPage from "../pages/ApproveBookingsPage";
import ApprovalPendingPage from "../pages/ApprovalPendingPage";
import CreateBookingPage from "../pages/CreateBookingPage";
import ResourceAvailabilityPage from "../pages/ResourceAvailabilityPage";
import DashboardPage from "../pages/DashboardPage";
import LoginPage from "../pages/LoginPage";
import ManageSignupRequestsPage from "../pages/ManageSignupRequestsPage";
import ManageResourcesPage from "../pages/ManageResourcesPage";
import ManageTicketsPage from "../pages/ManageTicketsPage";
import MyBookingsPage from "../pages/MyBookingsPage";
import MyTicketsPage from "../pages/MyTicketsPage";
import NotificationsPage from "../pages/NotificationsPage";
import AdminNotificationsPage from "../pages/admin/AdminNotificationsPage";
import NotFoundPage from "../pages/NotFoundPage";
import PublicLandingPage from "../pages/PublicLandingPage";
import SignupPage from "../pages/SignupPage";
import TechnicianWorkspaceLayout from "../components/technician/TechnicianWorkspaceLayout";
import TechnicianHomePage from "../pages/technician/TechnicianHomePage";
import TechnicianNotificationsPage from "../pages/technician/TechnicianNotificationsPage";
import TechnicianTicketDetailPage from "../pages/technician/TechnicianTicketDetailPage";
import TechnicianTicketWorkspacePage from "../pages/technician/TechnicianTicketWorkspacePage";
import TechnicianAcceptQueuePage from "../pages/technician/TechnicianAcceptQueuePage";
import TechnicianRejectQueuePage from "../pages/technician/TechnicianRejectQueuePage";
import TechnicianTicketAcceptPage from "../pages/technician/TechnicianTicketAcceptPage";
import TechnicianTicketRejectPage from "../pages/technician/TechnicianTicketRejectPage";
import TechnicianResolvedTicketsPage from "../pages/technician/TechnicianResolvedTicketsPage";
import TechnicianTicketsPage from "../pages/technician/TechnicianTicketsPage";
import TechnicianCategorySetupPage from "../pages/technician/TechnicianCategorySetupPage";
import TechnicianTeamPage from "../pages/technician/TechnicianTeamPage";
import TechnicianWithdrawnTicketsPage from "../pages/technician/TechnicianWithdrawnTicketsPage";
import AdminConsoleLayout from "../components/admin/AdminConsoleLayout";
import UserConsoleLayout from "../components/user/UserConsoleLayout";
import AdminRoute from "./AdminRoute";
import RequireSuperAdmin from "./RequireSuperAdmin";
import RequireAdminBooking from "./RequireAdminBooking";
import RequireCampusOperator from "./RequireCampusOperator";
import RequireUserRegistrar from "./RequireUserRegistrar";
import ProtectedRoute from "./ProtectedRoute";
import { getDefaultRouteForRole, ROLES } from "../utils/roleUtils";

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

      {/* End-user console (sidebar + topbar shell). Role-specific gating stays on each leaf. */}
      <Route
        element={
          <ProtectedRoute>
            <UserConsoleLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
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
          path="/bookings/availability"
          element={
            <ProtectedRoute
              allowedRoles={[ROLES.USER, ROLES.ADMIN, ROLES.MANAGER, ROLES.LECTURER]}
            >
              <ResourceAvailabilityPage />
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
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings/security" element={<SystemSettingsPage />} />
      </Route>
      <Route
        path="/technician"
        element={
          <ProtectedRoute allowedRoles={[ROLES.TECHNICIAN]}>
            <TechnicianWorkspaceLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<TechnicianHomePage />} />
        <Route path="tickets" element={<TechnicianTicketsPage />} />
        <Route path="accept" element={<TechnicianAcceptQueuePage />} />
        <Route path="reject" element={<TechnicianRejectQueuePage />} />
        <Route path="resolved" element={<TechnicianResolvedTicketsPage />} />
        <Route path="tickets/:ticketId/accept" element={<TechnicianTicketAcceptPage />} />
        <Route path="tickets/:ticketId/reject" element={<TechnicianTicketRejectPage />} />
        <Route path="tickets/:ticketId/work" element={<TechnicianTicketWorkspacePage />} />
        <Route path="tickets/:ticketId" element={<TechnicianTicketDetailPage />} />
        <Route path="categories" element={<TechnicianCategorySetupPage />} />
        <Route path="team" element={<TechnicianTeamPage />} />
        <Route path="withdrawn" element={<TechnicianWithdrawnTicketsPage />} />
        <Route path="notifications" element={<TechnicianNotificationsPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminConsoleLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />

        {/* LMS resources — specific paths before bare redirect */}
        <Route path="resources/module-content" element={<AdminScaffoldPage />} />
        <Route path="resources/upload-materials" element={<AdminScaffoldPage />} />
        <Route path="resources/visibility-settings" element={<AdminScaffoldPage />} />
        <Route path="resources" element={<Navigate to="/admin/resources/module-content" replace />} />

        {/* Teaching (super admin + lecturer) */}
        <Route path="teaching/teaching-assignments" element={<AdminScaffoldPage />} />
        <Route path="teaching/timetable" element={<AdminScaffoldPage />} />
        <Route path="teaching/locations" element={<AdminScaffoldPage />} />
        <Route path="teaching/subgroup-allocation" element={<AdminScaffoldPage />} />

        {/* Assessments */}
        <Route path="assessments/assignments" element={<AdminScaffoldPage />} />
        <Route path="assessments/subgroup-deadlines" element={<AdminScaffoldPage />} />
        <Route path="assessments/submissions" element={<AdminScaffoldPage />} />
        <Route path="assessments/quizzes" element={<Navigate to="/admin/quizzes" replace />} />
        <Route path="assessments/grades" element={<Navigate to="/admin/grades" replace />} />

        <Route path="quizzes" element={<AdminScaffoldPage />} />
        <Route path="grades" element={<AdminScaffoldPage />} />

        {/* Communication & reports (super admin + lecturer) */}
        <Route path="communication/announcements" element={<AdminNotificationsPage />} />
        <Route path="communication/targeted-notifications" element={<AdminNotificationsPage />} />
        <Route path="communication/messages" element={<AdminScaffoldPage />} />

        <Route path="reports/student-analytics" element={<AdminScaffoldPage />} />
        <Route path="reports/submission-reports" element={<AdminScaffoldPage />} />
        <Route path="reports/lecturer-workload" element={<AdminScaffoldPage />} />

        {/* Optional in-shell routes */}
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="analytics" element={<AdminScaffoldPage />} />
        <Route path="moderation" element={<AdminScaffoldPage />} />
        <Route path="groups/add-students" element={<AdminScaffoldPage />} />
        <Route path="groups" element={<AdminScaffoldPage />} />
        <Route path="announcements" element={<Navigate to="/admin/communication/announcements" replace />} />

        {/* Path aliases */}
        <Route path="faculty" element={<Navigate to="/admin/academics/faculties" replace />} />
        <Route path="modules" element={<Navigate to="/admin/academics/modules" replace />} />
        <Route path="settings" element={<Navigate to="/admin/administration/system-settings" replace />} />

        {/* Legacy academic URLs → new IA */}
        <Route path="academic/programs" element={<Navigate to="/admin/academics/degree-programs" replace />} />
        <Route path="academic/modules" element={<Navigate to="/admin/academics/modules" replace />} />
        <Route path="academic/semesters" element={<Navigate to="/admin/academics/academic-terms" replace />} />
        <Route path="academic/student-groups" element={<Navigate to="/admin/academics/subgroups" replace />} />
        <Route path="academic/module-offerings" element={<Navigate to="/admin/academics/module-offerings" replace />} />
        <Route path="academic/sessions" element={<Navigate to="/admin/teaching/timetable" replace />} />

        <Route element={<RequireUserRegistrar />}>
          {/* Users — super admin + campus manager */}
          <Route path="users/students/:studentId" element={<AdminScaffoldPage />} />
          <Route path="users/students" element={<StudentsAdminPage />} />
          <Route path="users/lecturers/:staffId" element={<AdminScaffoldPage />} />
          <Route path="users/lecturers" element={<StaffRegistrationPage variant="lecturer" />} />
          <Route path="users/lab-assistants/:staffId" element={<AdminScaffoldPage />} />
          <Route path="users/lab-assistants" element={<StaffRegistrationPage variant="labAssistant" />} />
          <Route path="users/bulk-import" element={<Navigate to="/admin/users/students" replace />} />
          <Route path="users/requests" element={<ManageSignupRequestsPage />} />
          <Route path="registrations" element={<Navigate to="/admin/users/requests" replace />} />
        </Route>

        <Route element={<RequireSuperAdmin />}>
          {/* Academics */}
          <Route path="academics/faculties" element={<FacultiesAdminPage />} />
          <Route path="academics/degree-programs" element={<DegreeProgramsAdminPage />} />
          <Route path="academics/intakes" element={<IntakesAdminPage />} />
          <Route path="academics/academic-terms" element={<Navigate to="/admin/academics/faculties" replace />} />
          <Route path="academics/streams" element={<Navigate to="/admin/academics/faculties" replace />} />
          <Route path="academics/subgroups" element={<SubgroupsAdminPage />} />
          <Route path="academics/modules" element={<CatalogModulesAdminPage />} />
          <Route path="academics/module-offerings" element={<ModuleOfferingsAdminPage />} />

          {/* Users — platform admins only */}
          <Route path="users/admins" element={<AdminsAdminPage />} />
          <Route path="users/roles-permissions" element={<AdminScaffoldPage />} />

          {/* Administration */}
          <Route path="administration/system-settings" element={<SystemSettingsPage />} />
          <Route path="administration/audit-logs" element={<AdminScaffoldPage />} />
          <Route path="administration/security-settings" element={<AdminScaffoldPage />} />
          <Route path="administration/backup-management" element={<AdminScaffoldPage />} />
        </Route>

        <Route element={<RequireCampusOperator />}>
          {/* Hiruni-style facilities path + legacy alias (Module A / bookings branch) */}
          <Route path="resources/facilities" element={<ManageResourcesPage />} />
          <Route path="campus/resources" element={<Navigate to="/admin/resources/facilities" replace />} />
          <Route path="campus/availability" element={<ResourceAvailabilityPage />} />
          <Route element={<RequireAdminBooking />}>
            <Route path="bookings" element={<ApproveBookingsPage />} />
          </Route>
          <Route path="tickets" element={<ManageTicketsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;
