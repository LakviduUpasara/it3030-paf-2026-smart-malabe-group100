import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getDefaultRouteForRole, getNavigationItems } from "../utils/roleUtils";
import Button from "./Button";
import NotificationDropdown from "./NotificationDropdown";

const publicNavigationItems = [
  { label: "Home", sectionId: "home" },
  { label: "About Us", sectionId: "about" },
  { label: "Contact Us", sectionId: "contact" },
];

function Navbar({ onOpenLoginModal }) {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isSignupPage = location.pathname === "/signup";
  const isPublicPage = !isAuthenticated && (location.pathname === "/" || isSignupPage);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handlePublicNavigation = (sectionId) => {
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollToSection: sectionId } });
      return;
    }

    const section = document.getElementById(sectionId);

    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const navigationItems = isAuthenticated ? getNavigationItems(user?.role) : [];

  return (
    <header className={`navbar ${isPublicPage ? "navbar-auth-shell" : ""}`.trim()}>
      <div className="navbar-brand">
        <button
          className="brand-button"
          onClick={() =>
            navigate(isAuthenticated ? getDefaultRouteForRole(user?.role) : "/")
          }
          type="button"
        >
          <span className="brand-mark">SC</span>
          <span className="brand-copy">
            <strong>Smart Campus</strong>
            <small>Operations Hub</small>
          </span>
        </button>
      </div>

      {isAuthenticated ? (
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
      ) : (
        <nav className="navbar-links navbar-links-public">
          {publicNavigationItems.map((item) => (
            <button
              key={item.sectionId}
              className="nav-link nav-link-button"
              onClick={() => handlePublicNavigation(item.sectionId)}
              type="button"
            >
              {item.label}
            </button>
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
          <div className="navbar-auth-actions">
            <Button
              className="auth-nav-button"
              onClick={() => onOpenLoginModal?.()}
              variant="secondary"
            >
              Login
            </Button>
            <Button
              className="auth-nav-button"
              onClick={() => navigate("/signup")}
              variant={isSignupPage ? "secondary" : "primary"}
            >
              Sign Up
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
