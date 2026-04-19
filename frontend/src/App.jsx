import { BrowserRouter, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import { ThemeProvider } from "./context/ThemeContext";
import Navbar from "./components/Navbar";
import GoogleTwoFactorPromptModal from "./components/GoogleTwoFactorPromptModal";
import TwoFactorSetupReminder from "./components/TwoFactorSetupReminder";
import { useAuth } from "./hooks/useAuth";
import AppRoutes from "./routes/AppRoutes";

function GoogleTwoFactorPromptHost() {
  const { isAuthenticated, googleTwoFactorPrompt } = useAuth();
  const location = useLocation();
  if (!isAuthenticated || !googleTwoFactorPrompt) {
    return null;
  }
  if (location.pathname === "/login" || location.pathname === "/signup") {
    return null;
  }
  return <GoogleTwoFactorPromptModal />;
}

function AppLayout() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const isAdminWorkspace = isAuthenticated && location.pathname.startsWith("/admin");
  const isTechnicianWorkspace =
    isAuthenticated && location.pathname.startsWith("/technician");
  const isUserWorkspace =
    isAuthenticated &&
    (location.pathname === "/dashboard" ||
      location.pathname === "/bookings" ||
      location.pathname.startsWith("/bookings/") ||
      location.pathname === "/tickets" ||
      location.pathname === "/notifications" ||
      location.pathname === "/settings/security");
  const isPublicMarketingRoute =
    !isAuthenticated &&
    ["/", "/login", "/signup", "/approval-pending"].includes(location.pathname);
  const isTicketsWideLayout =
    isAuthenticated &&
    (location.pathname === "/tickets" ||
      location.pathname === "/technician" ||
      location.pathname === "/technician/resolved" ||
      location.pathname === "/admin/tickets");
  const isAdminTicketsPage = isAuthenticated && location.pathname === "/admin/tickets";

  const shellClass = ["app-shell", isPublicMarketingRoute ? "app-shell-auth" : ""]
    .filter(Boolean)
    .join(" ");

  if (isAdminWorkspace || isUserWorkspace || isTechnicianWorkspace) {
    return (
      <div className={shellClass}>
        <AppRoutes />
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <div className="app-background" />
      <Navbar />
      <TwoFactorSetupReminder />
      <main
        className={
          isPublicMarketingRoute
            ? "page-shell page-shell-auth"
            : isAdminTicketsPage
              ? "page-shell page-shell--tickets-wide page-shell--admin-tickets"
              : isTicketsWideLayout
                ? "page-shell page-shell--tickets-wide"
                : "page-shell"
        }
      >
        <AppRoutes />
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          <AppLayout />
          <GoogleTwoFactorPromptHost />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
