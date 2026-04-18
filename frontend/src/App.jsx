import { BrowserRouter, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
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
  const isPublicMarketingRoute =
    !isAuthenticated &&
    ["/", "/login", "/signup", "/approval-pending"].includes(location.pathname);
  const isTicketsWideLayout =
    isAuthenticated &&
    (location.pathname === "/tickets" ||
      location.pathname.startsWith("/technician") ||
      location.pathname === "/admin/tickets");
  const isAdminTicketsPage = isAuthenticated && location.pathname === "/admin/tickets";

  const shellClass = ["app-shell", isPublicMarketingRoute ? "app-shell-auth" : ""]
    .filter(Boolean)
    .join(" ");

  if (isAdminWorkspace) {
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
      <AuthProvider>
        <AppLayout />
        <GoogleTwoFactorPromptHost />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
