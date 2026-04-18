import { BrowserRouter, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppFooter from "./components/AppFooter";
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
  const isPublicLandingRoute = !isAuthenticated && location.pathname === "/";
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

  const shellClass = [
    "app-shell",
    "app-shell-has-footer",
    isPublicMarketingRoute ? "app-shell-auth" : "",
    isPublicLandingRoute ? "app-shell-public-home" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (isAdminWorkspace) {
    return (
      <div className={shellClass}>
        <AppRoutes />
        <AppFooter />
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
            ? `page-shell page-shell-auth ${isPublicLandingRoute ? "page-shell-public-home" : ""}`.trim()
            : isAdminTicketsPage
              ? "page-shell page-shell--tickets-wide page-shell--admin-tickets"
              : isTicketsWideLayout
                ? "page-shell page-shell--tickets-wide"
                : "page-shell"
        }
      >
        <AppRoutes />
      </main>
      <AppFooter />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
        <GoogleTwoFactorPromptHost />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
