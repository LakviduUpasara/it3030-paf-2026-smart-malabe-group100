import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  HiArrowTrendingUp,
  HiBars3,
  HiBellAlert,
  HiShieldCheck,
  HiSquares2X2,
  HiUsers,
  HiXMark,
} from "react-icons/hi2";
import { useAuth } from "../hooks/useAuth";

const PRIMARY_LINKS = [
  { label: "Overview", path: "/admin", icon: HiSquares2X2, end: true },
  { label: "User requests", path: "/admin/users/requests", icon: HiUsers, end: false },
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const todayLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <section className="admin-workspace-shell admin-shell" aria-label="Administration workspace">
      {sidebarOpen ? (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          aria-label="Close navigation"
          onClick={closeSidebar}
        />
      ) : null}

      <aside className={`admin-sidebar ${sidebarOpen ? "is-open" : ""}`.trim()}>
        <div className="admin-sidebar-top">
          <div className="admin-sidebar-brand">
            <div className="admin-sidebar-brandcopy">
              <strong>Admin console</strong>
              <span>Operations</span>
            </div>
            <button
              type="button"
              className="admin-sidebar-close"
              aria-label="Close menu"
              onClick={closeSidebar}
            >
              <HiXMark />
            </button>
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
          {PRIMARY_LINKS.map((item) => {
            const ItemIcon = item.icon;

            return (
              <NavLink
                key={item.path}
                className={({ isActive }) =>
                  `admin-sidebar-link ${isActive ? "is-active" : ""}`.trim()
                }
                end={item.end}
                to={item.path}
                onClick={closeSidebar}
              >
                <span className="admin-sidebar-link-icon" aria-hidden="true">
                  <ItemIcon />
                </span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          <NavLink
            className={({ isActive }) =>
              `admin-sidebar-link ${isActive ? "is-active" : ""}`.trim()
            }
            to="/notifications"
            onClick={closeSidebar}
          >
            <span className="admin-sidebar-link-icon" aria-hidden="true">
              <HiBellAlert />
            </span>
            <span>Notifications</span>
          </NavLink>
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
          <div className="admin-workspace-hero-row">
            <button
              type="button"
              className="admin-nav-mobile-toggle"
              aria-label="Open navigation menu"
              onClick={() => setSidebarOpen(true)}
            >
              <HiBars3 />
            </button>

            <div className="admin-workspace-copy">
              <span className="admin-workspace-kicker">{eyebrow}</span>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
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
