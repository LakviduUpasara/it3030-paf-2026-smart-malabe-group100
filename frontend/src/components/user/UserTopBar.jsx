import { LogOut, Menu } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import NotificationBell from "../notifications/NotificationBell";

function UserTopBar({ onMenuClick }) {
  const { user, logout } = useAuth();

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
        <NotificationBell />
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
