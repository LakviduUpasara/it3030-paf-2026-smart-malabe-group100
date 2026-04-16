import { NavLink } from "react-router-dom";
import {
  HiArrowTrendingUp,
  HiBellAlert,
  HiBuildingOffice2,
  HiClipboardDocumentCheck,
  HiShieldCheck,
  HiSquares2X2,
  HiWrenchScrewdriver,
} from "react-icons/hi2";
import { useAuth } from "../hooks/useAuth";

const ADMIN_NAV_ITEMS = [
  { label: "Overview", path: "/admin", icon: HiSquares2X2 },
  { label: "Resources", path: "/admin/resources", icon: HiBuildingOffice2 },
  { label: "Booking Queue", path: "/admin/bookings", icon: HiClipboardDocumentCheck },
  { label: "Ticket Desk", path: "/admin/tickets", icon: HiWrenchScrewdriver },
  { label: "Notifications", path: "/notifications", icon: HiBellAlert },
];

function AdminWorkspaceLayout({
  eyebrow = "Admin Workspace",
  title,
  subtitle,
  actions,
  stats = [],
  rail,
  children,
}) {
  const { user } = useAuth();
  const todayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <section className="admin-workspace-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-top">
          <div className="admin-sidebar-brand">
            <span className="admin-sidebar-brandmark">SC</span>
            <div className="admin-sidebar-brandcopy">
              <strong>Smart Campus</strong>
              <span>Operations Hub</span>
            </div>
          </div>

          <div className="admin-sidebar-status">
            <span className="admin-sidebar-status-icon" aria-hidden="true">
              <HiShieldCheck />
            </span>
            <div>
              <strong>Enterprise Control</strong>
              <span>Premium admin workspace</span>
            </div>
          </div>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Admin workspace">
          {ADMIN_NAV_ITEMS.map((item) => {
            const ItemIcon = item.icon;

            return (
              <NavLink
                key={item.path}
                className={({ isActive }) =>
                  `admin-sidebar-link ${isActive ? "is-active" : ""}`.trim()
                }
                end={item.path === "/admin"}
                to={item.path}
              >
                <span className="admin-sidebar-link-icon" aria-hidden="true">
                  <ItemIcon />
                </span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <span className="admin-sidebar-avatar">{user?.name?.charAt(0) || "A"}</span>
            <div>
              <strong>{user?.name || "Campus Administrator"}</strong>
              <span>{user?.email || "admin@smartcampus.edu"}</span>
            </div>
          </div>

          <div className="admin-sidebar-footnote">
            <span className="admin-sidebar-footnote-icon" aria-hidden="true">
              <HiArrowTrendingUp />
            </span>
            <p>Monitor approvals, assets, and incidents from one controlled workspace.</p>
          </div>
        </div>
      </aside>

      <div className="admin-workspace-main">
        <header className="admin-workspace-hero">
          <div className="admin-workspace-copy">
            <span className="admin-workspace-kicker">{eyebrow}</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <div className="admin-workspace-actions">
            <div className="admin-workspace-date">
              <span>Today</span>
              <strong>{todayLabel}</strong>
            </div>
            {actions ? <div className="admin-workspace-actiongroup">{actions}</div> : null}
          </div>

          {stats.length ? (
            <div className="admin-kpi-grid">
              {stats.map((stat) => (
                <article
                  className={`admin-kpi-card ${stat.tone ? `admin-kpi-card-${stat.tone}` : ""}`.trim()}
                  key={stat.label}
                >
                  <span className="admin-kpi-label">{stat.label}</span>
                  <strong className="admin-kpi-value">{stat.value}</strong>
                  {stat.detail ? <p className="admin-kpi-detail">{stat.detail}</p> : null}
                </article>
              ))}
            </div>
          ) : null}
        </header>

        <div className={`admin-workspace-content ${rail ? "has-rail" : ""}`.trim()}>
          <div className="admin-workspace-primary">{children}</div>
          {rail ? <aside className="admin-workspace-rail">{rail}</aside> : null}
        </div>
      </div>
    </section>
  );
}

export default AdminWorkspaceLayout;
