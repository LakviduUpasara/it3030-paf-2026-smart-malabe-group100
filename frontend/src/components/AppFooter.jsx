import { Bell, Home, Info, LockKeyhole, Mail, Phone, UserPlus } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import brandLogo from "../assets/smart-campus-logo.svg";
import { useAuth } from "../hooks/useAuth";
import { getDefaultRouteForRole } from "../utils/roleUtils";

function AppFooter() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  const isAdminWorkspace = isAuthenticated && location.pathname.startsWith("/admin");
  const isTechnicianWorkspace = isAuthenticated && location.pathname.startsWith("/technician");

  const footerLinks = isAuthenticated
    ? [
        {
          label: "Home",
          to: isAdminWorkspace
            ? "/admin"
            : isTechnicianWorkspace
              ? "/technician"
              : getDefaultRouteForRole(user?.role),
          icon: Home,
        },
        {
          label: "Notifications",
          to: isAdminWorkspace
            ? "/admin/notifications"
            : isTechnicianWorkspace
              ? "/technician/notifications"
              : "/notifications",
          icon: Bell,
        },
        {
          label: "Security",
          to: "/settings/security",
          icon: LockKeyhole,
        },
      ]
    : [
        { label: "Home", sectionId: "home", icon: Home },
        { label: "About Us", sectionId: "about", icon: Info },
        { label: "Contact Us", sectionId: "contact", icon: Mail },
        { label: "Sign Up", to: "/signup", icon: UserPlus },
      ];

  const handleSectionNavigation = (sectionId) => {
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollToSection: sectionId } });
      return;
    }

    const section = document.getElementById(sectionId);

    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <footer className="app-footer" aria-label="Site footer">
      <div className="app-footer-shell">
        <div className="app-footer-brand">
          <Link className="app-footer-brand-link" to={isAuthenticated ? getDefaultRouteForRole(user?.role) : "/"}>
            <span className="app-footer-logo-shell" aria-hidden="true">
              <img className="app-footer-logo" src={brandLogo} alt="" />
            </span>
            <span className="app-footer-brand-copy">
              <strong>Smart Campus</strong>
              <small>Operations Hub</small>
            </span>
          </Link>

          <p>
            Unified booking, campus support, and operational communication in one
            streamlined platform.
          </p>
        </div>

        <div className="app-footer-group">
          <span className="app-footer-heading">Quick Links</span>
          <nav className="app-footer-links" aria-label="Footer navigation">
            {footerLinks.map((item) => {
              const ItemIcon = item.icon;

              if (item.sectionId) {
                return (
                  <button
                    key={item.label}
                    className="app-footer-link"
                    onClick={() => handleSectionNavigation(item.sectionId)}
                    type="button"
                  >
                    <ItemIcon aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                );
              }

              return (
                <Link key={item.label} className="app-footer-link" to={item.to}>
                  <ItemIcon aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="app-footer-group">
          <span className="app-footer-heading">Support</span>
          <div className="app-footer-support-list">
            <a className="app-footer-link" href="mailto:support@smartcampus.edu">
              <Mail aria-hidden="true" />
              <span>support@smartcampus.edu</span>
            </a>
            <a className="app-footer-link" href="tel:+94112345678">
              <Phone aria-hidden="true" />
              <span>+94 11 234 5678</span>
            </a>
          </div>
        </div>
      </div>

      <div className="app-footer-bottom">
        <p>© {year} Smart Campus Operations Hub. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default AppFooter;
