import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  HiOutlineChevronDown,
  HiOutlineHome,
  HiOutlineInformationCircle,
  HiOutlinePhone,
} from "react-icons/hi2";
import brandLogo from "../assets/smart-campus-logo.svg";
import { useAuth } from "../hooks/useAuth";
import {
  getDefaultRouteForRole,
  getNavigationGroups,
  getNavigationItems,
  normalizeRole,
  ROLES,
} from "../utils/roleUtils";
import Button from "./Button";
import NotificationDropdown from "./NotificationDropdown";

const publicNavigationItems = [
  { label: "Home", sectionId: "home", icon: HiOutlineHome },
  { label: "About Us", sectionId: "about", icon: HiOutlineInformationCircle },
  { label: "Contact Us", sectionId: "contact", icon: HiOutlinePhone },
];

function Navbar() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === "/login";
  const isSignupPage = location.pathname === "/signup";
  const isApprovalPendingPage = location.pathname === "/approval-pending";
  const isPublicPage =
    !isAuthenticated && ["/", "/login", "/signup", "/approval-pending"].includes(location.pathname);

  const role = normalizeRole(user?.role);
  const isAdminWorkspace =
    isAuthenticated && role === ROLES.ADMIN && location.pathname.startsWith("/admin");

  const [activePublicSection, setActivePublicSection] = useState(
    isLoginPage || isSignupPage || isApprovalPendingPage ? null : "home",
  );
  const [openGroup, setOpenGroup] = useState(null);
  const navigationMenuRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      return undefined;
    }

    if (isLoginPage || isSignupPage || isApprovalPendingPage) {
      setActivePublicSection(null);
      return undefined;
    }

    if (location.pathname !== "/") {
      setActivePublicSection(null);
      return undefined;
    }

    const sections = publicNavigationItems
      .map((item) => document.getElementById(item.sectionId))
      .filter(Boolean);

    if (!sections.length) {
      setActivePublicSection("home");
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries.length > 0) {
          setActivePublicSection(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.2, 0.35, 0.5, 0.7],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [isAuthenticated, isLoginPage, isSignupPage, isApprovalPendingPage, location.pathname]);

  useEffect(() => {
    setOpenGroup(null);
  }, [location.pathname]);

  useEffect(() => {
    if (!openGroup) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!navigationMenuRef.current?.contains(event.target)) {
        setOpenGroup(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [openGroup]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handlePublicNavigation = (sectionId) => {
    setActivePublicSection(sectionId);

    if (location.pathname !== "/") {
      navigate("/", { state: { scrollToSection: sectionId } });
      return;
    }

    const section = document.getElementById(sectionId);

    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const navigationItems =
    isAuthenticated && !isAdminWorkspace ? getNavigationItems(user?.role) : [];
  const navigationGroups =
    isAuthenticated && !isAdminWorkspace ? getNavigationGroups(user?.role) : [];

  const isGroupActive = (group) =>
    group.items.some(
      (item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`),
    );

  return (
    <header
      className={`navbar ${isPublicPage ? "navbar-auth-shell" : ""} ${isAdminWorkspace ? "navbar-enterprise" : ""}`.trim()}
    >
      <div className="navbar-brand">
        <button
          className="brand-button"
          onClick={() =>
            navigate(isAuthenticated ? getDefaultRouteForRole(user?.role) : "/")
          }
          type="button"
        >
          <span className="brand-logo-shell" aria-hidden="true">
            <img className="brand-logo" src={brandLogo} alt="" />
          </span>
          <span className="brand-copy">
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
      ) : null}

      {isAuthenticated && !isAdminWorkspace ? (
        <nav className="navbar-links navbar-links-app" ref={navigationMenuRef}>
          {navigationItems.map((item) => (
            <NavLink
              end={item.end === true}
              key={item.path}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              to={item.path}
            >
              {item.label}
            </NavLink>
          ))}
          {navigationGroups.map((group) => {
            const isOpen = openGroup === group.label;
            const active = isGroupActive(group);

            return (
              <div key={group.label} className={`nav-menu ${isOpen ? "open" : ""}`.trim()}>
                <button
                  type="button"
                  className={`nav-menu-button ${active ? "active" : ""}`.trim()}
                  aria-expanded={isOpen}
                  onClick={() =>
                    setOpenGroup((currentGroup) => (currentGroup === group.label ? null : group.label))
                  }
                >
                  <span>{group.label}</span>
                  <HiOutlineChevronDown className="nav-menu-caret" aria-hidden="true" />
                </button>

                {isOpen ? (
                  <div className="nav-menu-panel">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          `nav-menu-item ${isActive ? "active" : ""}`.trim()
                        }
                        onClick={() => setOpenGroup(null)}
                      >
                        <strong>{item.label}</strong>
                        <small>{item.description}</small>
                      </NavLink>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
      ) : null}

      {!isAuthenticated ? (
        <nav className="navbar-links navbar-links-public">
          {publicNavigationItems.map((item) => (
            <button
              key={item.sectionId}
              className={`nav-link nav-link-button nav-link-button-public ${
                activePublicSection === item.sectionId ? "active" : ""
              }`.trim()}
              onClick={() => handlePublicNavigation(item.sectionId)}
              type="button"
              aria-current={activePublicSection === item.sectionId ? "page" : undefined}
            >
              <item.icon className="nav-link-icon" aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      ) : null}

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
              onClick={() => navigate("/login")}
              variant="primary"
              aria-current={isLoginPage ? "page" : undefined}
            >
              Login
            </Button>
            <Button
              className="auth-nav-button auth-nav-button-transparent"
              onClick={() => navigate("/signup")}
              variant={isSignupPage ? "secondary" : "primary"}
              aria-current={isSignupPage ? "page" : undefined}
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
