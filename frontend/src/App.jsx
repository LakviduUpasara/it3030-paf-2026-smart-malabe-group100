import { BrowserRouter, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import { useAuth } from "./hooks/useAuth";
import AppRoutes from "./routes/AppRoutes";

function AppLayout() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const isPublicMarketingRoute = !isAuthenticated && ["/", "/login", "/signup"].includes(location.pathname);

  return (
    <div className={isPublicMarketingRoute ? "app-shell app-shell-auth" : "app-shell"}>
      <div className="app-background" />
      <Navbar />
      <main className={isPublicMarketingRoute ? "page-shell page-shell-auth" : "page-shell"}>
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
