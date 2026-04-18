import { NavLink, Outlet } from "react-router-dom";

function TechnicianWorkspaceLayout() {
  return (
    <div className="page-stack">
      <nav
        className="flex flex-wrap gap-2 rounded-3xl border border-border bg-tint/80 p-3 shadow-shadow"
        aria-label="Technician workspace"
      >
        <NavLink
          end
          className={({ isActive }) => `nav-link rounded-2xl px-3 py-2 ${isActive ? "active" : ""}`.trim()}
          to="/technician"
        >
          Desk
        </NavLink>
        <NavLink
          className={({ isActive }) => `nav-link rounded-2xl px-3 py-2 ${isActive ? "active" : ""}`.trim()}
          to="/technician/tickets"
        >
          My tickets
        </NavLink>
        <NavLink
          end
          className={({ isActive }) => `nav-link rounded-2xl px-3 py-2 ${isActive ? "active" : ""}`.trim()}
          to="/technician/accept"
        >
          Accept
        </NavLink>
        <NavLink
          className={({ isActive }) => `nav-link rounded-2xl px-3 py-2 ${isActive ? "active" : ""}`.trim()}
          to="/technician/resolved"
        >
          Resolved
        </NavLink>
        <NavLink
          className={({ isActive }) => `nav-link rounded-2xl px-3 py-2 ${isActive ? "active" : ""}`.trim()}
          to="/technician/notifications"
        >
          Alerts
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}

export default TechnicianWorkspaceLayout;
