import { Bell, LogOut, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useUnreadNotificationCount } from "../../hooks/useUnreadNotificationCount";

function UserTopBar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const unreadCount = useUnreadNotificationCount();

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

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-heading">
          {user?.name ? `Welcome, ${user.name}` : "Workspace"}
        </p>
        <p className="truncate text-xs text-text/60">Smart Campus Operations Hub</p>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Link
          className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-tint text-heading transition-colors hover:bg-slate-200/40"
          to="/notifications"
          aria-label={
            unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
          }
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </Link>
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

export default UserTopBar;
