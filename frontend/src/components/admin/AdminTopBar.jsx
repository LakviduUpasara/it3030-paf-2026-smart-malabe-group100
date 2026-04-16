import { LogOut, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useAdminShell } from "../../context/AdminShellContext";
import { normalizeRole, resolveAdminConsoleRole } from "../../utils/roleUtils";
import { getAdminBreadcrumb } from "../../utils/adminBreadcrumbs";

function AdminTopBar({ onMenuClick }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { activeWindow } = useAdminShell();
  const crumb = getAdminBreadcrumb(location.pathname, { activeWindow });
  const roleLabel = resolveAdminConsoleRole(user?.role) || normalizeRole(user?.role) || "—";

  function renderCrumbLink(item, { isCurrent }) {
    if (!item) {
      return null;
    }

    if (isCurrent) {
      return (
        <span className="font-medium text-heading" aria-current="page">
          {item.label}
        </span>
      );
    }

    return (
      <Link className="font-medium text-heading hover:text-primary" to={item.path}>
        {item.label}
      </Link>
    );
  }

  const primaryCurrent = location.pathname === crumb.primary.path;
  const secondaryCurrent = crumb.secondary && location.pathname === crumb.secondary.path;

  return (
    <header className="z-20 flex h-[60px] shrink-0 items-center gap-3 border-b border-border bg-card px-4 md:px-6">
      <button
        type="button"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-tint text-heading hover:bg-slate-200/40 md:hidden"
        aria-label="Open navigation menu"
        onClick={onMenuClick}
      >
        <Menu className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
      </button>

      <nav
        className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1 gap-y-1 text-sm"
        aria-label="Breadcrumb"
      >
        {renderCrumbLink(crumb.primary, { isCurrent: primaryCurrent })}
        {crumb.secondary ? (
          <>
            <span className="px-0.5 text-text/40" aria-hidden>
              ›
            </span>
            {renderCrumbLink(crumb.secondary, { isCurrent: secondaryCurrent })}
          </>
        ) : null}
        <span className="px-1 text-text/35" aria-hidden>
          |
        </span>
        <span className="min-w-0 truncate text-text/72">{crumb.window}</span>
      </nav>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <span className="hidden rounded-full border border-border bg-tint px-2.5 py-1 text-xs font-semibold text-text sm:inline">
          {roleLabel}
        </span>
        <span className="hidden max-w-[140px] truncate font-medium text-heading sm:inline md:max-w-[200px]">
          {user?.name || "Admin"}
        </span>
        <button
          type="button"
          className="button button-secondary inline-flex items-center gap-2 px-3 py-2 sm:px-4"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

export default AdminTopBar;
