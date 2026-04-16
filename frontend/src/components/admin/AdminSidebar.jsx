import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Bell,
  BookOpen,
  Building2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  GraduationCap,
  LayoutDashboard,
  Layers,
  PanelLeftClose,
  PanelLeft,
  Calendar,
  Users,
  UsersRound,
  Wrench,
} from "lucide-react";
import { ADMIN_ACADEMIC_NAV_ITEMS } from "../../utils/roleUtils";

const PRIMARY_LINKS = [
  { label: "Overview", path: "/admin", icon: LayoutDashboard, end: true },
  { label: "Resources", path: "/admin/resources", icon: Building2, end: false },
  { label: "User Approvals", path: "/admin/registrations", icon: Users, end: false },
  { label: "Booking Queue", path: "/admin/bookings", icon: ClipboardCheck, end: false },
  { label: "Ticket Desk", path: "/admin/tickets", icon: Wrench, end: false },
];

const ACADEMIC_ICONS = [BookOpen, Layers, Calendar, UsersRound, ClipboardList, Clock];

function AdminSidebar({ mobileOpen, onMobileClose }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [academicOpen, setAcademicOpen] = useState(true);
  const [flyout, setFlyout] = useState(null);
  const flyoutTimer = useRef(null);
  const academicTriggerRef = useRef(null);
  const [flyoutTop, setFlyoutTop] = useState(120);

  const isAcademicPath = location.pathname.startsWith("/admin/academic/");
  const academicSectionActive = isAcademicPath;

  useEffect(() => {
    if (isAcademicPath) {
      setAcademicOpen(true);
    }
  }, [isAcademicPath]);

  useEffect(() => {
    return () => {
      if (flyoutTimer.current) {
        clearTimeout(flyoutTimer.current);
      }
    };
  }, []);

  const openFlyout = (id) => {
    if (flyoutTimer.current) {
      clearTimeout(flyoutTimer.current);
    }
    setFlyout(id);
  };

  const scheduleCloseFlyout = () => {
    if (flyoutTimer.current) {
      clearTimeout(flyoutTimer.current);
    }
    flyoutTimer.current = setTimeout(() => setFlyout(null), 140);
  };

  useLayoutEffect(() => {
    if (flyout !== "academic" || !collapsed || !academicTriggerRef.current) {
      return;
    }
    const rect = academicTriggerRef.current.getBoundingClientRect();
    setFlyoutTop(rect.top);
  }, [flyout, collapsed, location.pathname]);

  const asideClass =
    "flex h-full flex-col border-r border-border bg-card transition-[width] duration-200 ease-out";

  const widthClass = collapsed ? "w-[272px] md:w-[72px]" : "w-[272px]";

  const shellClass = [
    "fixed inset-y-0 left-0 z-40 flex shrink-0 md:static md:z-0",
    mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
  ].join(" ");

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-heading/20 backdrop-blur-[1px] md:hidden"
          aria-label="Close navigation"
          onClick={onMobileClose}
        />
      ) : null}

      <div className={shellClass}>
        <aside className={`${asideClass} ${widthClass}`} aria-label="Administration">
          <div className="flex h-11 shrink-0 items-center justify-end border-b border-border px-2">
            <button
              type="button"
              className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-border bg-tint text-heading hover:bg-slate-200/40 md:inline-flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-pressed={collapsed}
              onClick={() => setCollapsed((c) => !c)}
            >
              {collapsed ? (
                <PanelLeft className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
              ) : (
                <PanelLeftClose className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
              )}
            </button>
          </div>

          <div
            className={`flex items-center gap-3 border-b border-border py-4 ${collapsed ? "justify-center px-2" : "px-4"}`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 font-heading text-sm font-semibold text-primary">
              SC
            </span>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate font-heading text-sm font-semibold text-heading">Smart Campus</p>
                <p className="text-xs text-text/60">Operations Hub</p>
              </div>
            ) : null}
          </div>

          <nav className="flex min-h-0 flex-1 flex-col px-2 py-3" aria-label="Admin sections">
            <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden pb-2">
            {PRIMARY_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                      collapsed ? "justify-center px-2" : "",
                      isActive
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-text/75 hover:bg-tint hover:text-heading",
                    ].join(" ")
                  }
                  end={item.end}
                  title={collapsed ? item.label : undefined}
                  to={item.path}
                  onClick={onMobileClose}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
                  {!collapsed ? <span className="truncate">{item.label}</span> : null}
                </NavLink>
              );
            })}

            <div
              className="relative"
              onMouseEnter={() => collapsed && openFlyout("academic")}
              onMouseLeave={collapsed ? scheduleCloseFlyout : undefined}
            >
              {collapsed ? (
                <button
                  ref={academicTriggerRef}
                  type="button"
                  className={[
                    "flex w-full items-center justify-center rounded-2xl px-2 py-2.5 text-sm font-medium transition-colors",
                    academicSectionActive
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-text/75 hover:bg-tint hover:text-heading",
                  ].join(" ")}
                  aria-expanded={flyout === "academic"}
                  aria-label="Academic section"
                  onClick={() => openFlyout("academic")}
                >
                  <GraduationCap className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                </button>
              ) : (
                <button
                  type="button"
                  className={[
                    "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                    academicSectionActive
                      ? "bg-primary/10 text-primary"
                      : "text-text/75 hover:bg-tint hover:text-heading",
                  ].join(" ")}
                  aria-expanded={academicOpen}
                  onClick={() => setAcademicOpen((o) => !o)}
                >
                  <GraduationCap className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
                  <span className="flex-1 truncate">Academic</span>
                </button>
              )}

              {collapsed && flyout === "academic" ? (
                <div
                  className="fixed z-50 max-h-[min(70vh,420px)] w-[256px] overflow-y-auto rounded-3xl border border-border bg-card py-3 shadow-shadow ring-1 ring-black/5 md:left-[72px]"
                  style={{ left: typeof window !== "undefined" && window.innerWidth < 768 ? 16 : 72 + 8, top: flyoutTop }}
                  onMouseEnter={() => openFlyout("academic")}
                  onMouseLeave={scheduleCloseFlyout}
                  role="menu"
                  aria-label="Academic navigation"
                >
                  <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-text/60">
                    Academic
                  </p>
                  <div className="flex flex-col gap-0.5 px-2">
                    {ADMIN_ACADEMIC_NAV_ITEMS.map((item, index) => {
                      const SubIcon = ACADEMIC_ICONS[index % ACADEMIC_ICONS.length];
                      return (
                        <NavLink
                          key={item.path}
                          className={({ isActive }) =>
                            [
                              "flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition-colors",
                              isActive
                                ? "bg-primary/10 font-semibold text-primary"
                                : "text-text/75 hover:bg-tint hover:text-heading",
                            ].join(" ")
                          }
                          role="menuitem"
                          to={item.path}
                          onClick={() => {
                            onMobileClose?.();
                            scheduleCloseFlyout();
                          }}
                        >
                          <SubIcon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
                          <span className="truncate">{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {!collapsed && academicOpen ? (
                <div className="mt-1 flex flex-col gap-0.5 pl-2">
                  {ADMIN_ACADEMIC_NAV_ITEMS.map((item, index) => {
                    const SubIcon = ACADEMIC_ICONS[index % ACADEMIC_ICONS.length];
                    return (
                      <NavLink
                        key={item.path}
                        className={({ isActive }) =>
                          [
                            "flex items-center gap-2 rounded-2xl py-2 pl-4 pr-2 text-sm transition-colors",
                            isActive
                              ? "bg-primary/10 font-semibold text-primary"
                              : "text-text/75 hover:bg-tint hover:text-heading",
                          ].join(" ")
                        }
                        to={item.path}
                        onClick={onMobileClose}
                      >
                        <SubIcon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              ) : null}
            </div>
            </div>

            <div className="shrink-0 border-t border-border/60 pt-2">
              <NavLink
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                    collapsed ? "justify-center px-2" : "",
                    isActive
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-text/75 hover:bg-tint hover:text-heading",
                  ].join(" ")
                }
                title={collapsed ? "Notifications" : undefined}
                to="/notifications"
                onClick={onMobileClose}
              >
                <Bell className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
                {!collapsed ? <span>Notifications</span> : null}
              </NavLink>
            </div>
          </nav>
        </aside>
      </div>
    </>
  );
}

export default AdminSidebar;
