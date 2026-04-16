import { BrowserRouter, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import AppRoutes from "./routes/AppRoutes";

function AppLayout() {
  const location = useLocation();
  const isAdminWorkspace = location.pathname.startsWith("/admin");

  return (
    <div className="app-shell">
      <div className="app-background" />
      <Navbar />
      <main className={`page-shell ${isAdminWorkspace ? "page-shell-admin" : ""}`.trim()}>
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
