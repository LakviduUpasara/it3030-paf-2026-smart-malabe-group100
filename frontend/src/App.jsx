import { BrowserRouter, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
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

  return (
    <div className={shellClass}>
      <div className="app-background" />
      <Navbar />
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
