import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import "./assets/styles.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="layout">
          <header className="topbar">
            <h1>Smart Campus Operations Hub</h1>
            <nav className="topnav">
              <NavLink to="/">Home</NavLink>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/dashboard">Dashboard</NavLink>
            </nav>
          </header>

          <main className="page-shell">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

