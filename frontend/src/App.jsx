import { BrowserRouter, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import AppRoutes from "./routes/AppRoutes";

function AppLayout() {
  const location = useLocation();
  const isAuthRoute = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <div className={isAuthRoute ? "app-shell app-shell-auth" : "app-shell"}>
      <div className="app-background" />
      <Navbar />
      <main className={isAuthRoute ? "page-shell page-shell-auth" : "page-shell"}>
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
