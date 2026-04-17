import { BrowserRouter, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import TwoFactorSetupReminder from "./components/TwoFactorSetupReminder";
import { useAuth } from "./hooks/useAuth";
import AppRoutes from "./routes/AppRoutes";

function AppLayout() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const isAdminWorkspace = isAuthenticated && location.pathname.startsWith("/admin");
  const isPublicMarketingRoute =
    !isAuthenticated &&
    ["/", "/login", "/signup", "/approval-pending"].includes(location.pathname);

  const shellClass = ["app-shell", isPublicMarketingRoute ? "app-shell-auth" : ""]
    .filter(Boolean)
    .join(" ");

  const mainClass = [
    "page-shell",
    isPublicMarketingRoute ? "page-shell-auth" : "",
    isAdminWorkspace ? "page-shell-admin" : "",
  ]
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
      <main className={mainClass}>
        <AppRoutes />
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
