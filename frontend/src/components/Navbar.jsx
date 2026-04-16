import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getDefaultRouteForRole, getNavigationItems } from "../utils/roleUtils";
import Button from "./Button";
import NotificationDropdown from "./NotificationDropdown";

function Navbar() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminWorkspace =
    isAuthenticated && user?.role === "ADMIN" && location.pathname.startsWith("/admin");

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navigationItems =
    isAuthenticated && !isAdminWorkspace ? getNavigationItems(user?.role) : [];

  return (
    <header className={`navbar ${isAdminWorkspace ? "navbar-enterprise" : ""}`.trim()}>
      <div className="navbar-brand">
        <button
          className="brand-button"
          onClick={() =>
            navigate(isAuthenticated ? getDefaultRouteForRole(user?.role) : "/login")
          }
          type="button"
        >
          <span className="brand-mark">SC</span>
          <span>
            <strong>Smart Campus</strong>
            <small>Operations Hub</small>
          </span>
        </button>
      </div>

      {isAdminWorkspace ? (
        <div className="navbar-workspace-chip">
          <span className="navbar-workspace-kicker">Enterprise Workspace</span>
          <strong>Admin Operations Center</strong>
        </div>
      ) : (
        <nav className="navbar-links">
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              to={item.path}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}

      <div className="navbar-actions">
        {isAuthenticated ? (
          <>
            <NotificationDropdown />
            <div className="user-pill">
              <span className="user-avatar">{user?.name?.charAt(0) || "U"}</span>
              <div>
                <strong>{user?.name}</strong>
                <small>{user?.role}</small>
              </div>
            </div>
            <Button onClick={handleLogout} variant="secondary">
              {isLoading ? "Signing out..." : "Logout"}
            </Button>
          </>
        ) : (
          <Button onClick={() => navigate("/login")} variant="secondary">
            Login
          </Button>
        )}
      </div>
    </header>
  );
}

export default Navbar;

