import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Bell, PanelLeft, PanelLeftClose } from "lucide-react";
import {
  ADMIN_NAV_SECTIONS,
  filterNavSectionsForRole,
  isNavItemActive,
} from "../../config/adminNavConfig";
import { useAuth } from "../../hooks/useAuth";
import { resolveAdminConsoleRole } from "../../utils/roleUtils";

function AdminSidebar({ mobileOpen, onMobileClose }) {
  const location = useLocation();
  const { user } = useAuth();
  const consoleRole = resolveAdminConsoleRole(user?.role);

  const sections = useMemo(
    () => filterNavSectionsForRole(consoleRole, ADMIN_NAV_SECTIONS),
    [consoleRole],
  );

  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState(() =>
    Object.fromEntries(ADMIN_NAV_SECTIONS.map((s) => [s.id, s.defaultOpen])),
  );
  const [flyout, setFlyout] = useState(null);
  const flyoutTimer = useRef(null);
  const flyoutAnchorRefs = useRef({});

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

  const [flyoutTop, setFlyoutTop] = useState(120);

  useLayoutEffect(() => {
    if (!collapsed || !flyout) {
      return;
    }
    const el = flyoutAnchorRefs.current[flyout];
    if (!el) {
      return;
    }
    const rect = el.getBoundingClientRect();
    setFlyoutTop(rect.top);
  }, [collapsed, flyout, location.pathname]);

  const toggleSection = (id) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const shellClass = [
    "fixed inset-y-0 left-0 z-40 flex shrink-0 md:static md:z-0",
    mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
  ].join(" ");

  const asideClass =
    "flex h-full flex-col border-r border-border bg-card transition-[width] duration-200 ease-out";

  const widthClass = collapsed ? "w-[272px] md:w-[72px]" : "w-[272px]";

  const activeFlyoutSection = sections.find((s) => s.id === flyout);

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

          <nav className="flex min-h-0 flex-1 flex-col px-2 py-3" aria-label="Admin sections">
            <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden pb-2">
              {sections.map((section) => {
                const SectionIcon = section.icon;
                const isOpen = openSections[section.id] !== false;
                const sectionActive = section.items.some((item) => isNavItemActive(location.pathname, item));

                if (collapsed) {
                  return (
                    <div
                      key={section.id}
                      className="relative"
                      onMouseEnter={() => openFlyout(section.id)}
                      onMouseLeave={scheduleCloseFlyout}
                    >
                      <button
                        ref={(el) => {
                          flyoutAnchorRefs.current[section.id] = el;
                        }}
                        type="button"
                        className={[
                          "flex w-full items-center justify-center rounded-2xl px-2 py-2.5 text-sm font-medium transition-colors",
                          sectionActive
                            ? "bg-primary/10 font-semibold text-primary"
                            : "text-text/75 hover:bg-tint hover:text-heading",
                        ].join(" ")}
                        aria-expanded={flyout === section.id}
                        aria-label={section.label}
                        onClick={() => openFlyout(section.id)}
                      >
                        <SectionIcon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                      </button>
                    </div>
                  );
                }

                return (
                  <div key={section.id} className="rounded-2xl">
                    <button
                      type="button"
                      className={[
                        "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                        sectionActive ? "bg-primary/10 text-primary" : "text-text/75 hover:bg-tint hover:text-heading",
                      ].join(" ")}
                      aria-expanded={isOpen}
                      onClick={() => toggleSection(section.id)}
                    >
                      <SectionIcon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
                      <span className="flex-1 truncate">{section.label}</span>
                    </button>
                    {isOpen ? (
                      <div className="mt-1 flex flex-col gap-0.5 pl-2">
                        {section.items.map((item) => {
                          const active = isNavItemActive(location.pathname, item);
                          return (
                            <NavLink
                              key={item.id}
                              className={[
                                "flex items-center rounded-2xl py-2 pl-4 pr-2 text-sm transition-colors",
                                active
                                  ? "bg-primary/10 font-semibold text-primary"
                                  : "text-text/75 hover:bg-tint hover:text-heading",
                              ].join(" ")}
                              end={Boolean(item.end)}
                              to={item.href}
                              aria-current={active ? "page" : undefined}
                              onClick={onMobileClose}
                            >
                              <span className="truncate">{item.label}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {collapsed && flyout && activeFlyoutSection ? (
              <div
                className="fixed z-50 max-h-[min(70vh,480px)] w-[256px] overflow-y-auto rounded-3xl border border-border bg-card py-3 shadow-shadow ring-1 ring-black/5"
                style={{
                  left: typeof window !== "undefined" && window.innerWidth < 768 ? 16 : 72 + 8,
                  top: flyoutTop,
                }}
                onMouseEnter={() => openFlyout(flyout)}
                onMouseLeave={scheduleCloseFlyout}
                role="menu"
                aria-label={activeFlyoutSection.label}
              >
                <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-text/60">
                  {activeFlyoutSection.label}
                </p>
                <div className="flex flex-col gap-0.5 px-2">
                  {activeFlyoutSection.items.map((item) => {
                    const active = isNavItemActive(location.pathname, item);
                    return (
                      <NavLink
                        key={item.id}
                        className={[
                          "rounded-2xl px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-primary/10 font-semibold text-primary"
                            : "text-text/75 hover:bg-tint hover:text-heading",
                        ].join(" ")}
                        end={Boolean(item.end)}
                        role="menuitem"
                        to={item.href}
                        onClick={() => {
                          onMobileClose?.();
                          scheduleCloseFlyout();
                        }}
                      >
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ) : null}

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
                to="/admin/notifications"
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
