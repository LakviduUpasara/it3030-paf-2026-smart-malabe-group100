import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { USER_NAV_SECTIONS, isUserNavItemActive } from "../../config/userNavConfig";

/**
 * UserSidebar — mirrors the admin sidebar visual language but keeps the user IA flat
 * (Workspace + Administration). Collapse/expand works the same as the admin shell.
 */
function UserSidebar({ mobileOpen, onMobileClose }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState(() =>
    Object.fromEntries(USER_NAV_SECTIONS.map((s) => [s.id, s.defaultOpen])),
  );

  const shellClass = [
    "fixed inset-y-0 left-0 z-40 flex shrink-0 md:static md:z-0",
    mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
  ].join(" ");

  const asideClass =
    "flex h-full flex-col border-r border-border bg-card transition-[width] duration-200 ease-out";

  const widthClass = collapsed ? "w-[272px] md:w-[72px]" : "w-[272px]";

  const toggleSection = (id) =>
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));

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
        <aside className={`${asideClass} ${widthClass}`} aria-label="User workspace">
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

          <nav className="flex min-h-0 flex-1 flex-col px-2 py-3" aria-label="User sections">
            <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden pb-2">
              {USER_NAV_SECTIONS.map((section) => {
                const SectionIcon = section.icon;
                const isOpen = openSections[section.id] !== false;
                const sectionActive = section.items.some((item) =>
                  isUserNavItemActive(location.pathname, item),
                );

                if (collapsed) {
                  return (
                    <div key={section.id} className="relative">
                      <button
                        type="button"
                        className={[
                          "flex w-full items-center justify-center rounded-2xl px-2 py-2.5 text-sm font-medium transition-colors",
                          sectionActive
                            ? "bg-primary/10 font-semibold text-primary"
                            : "text-text/75 hover:bg-tint hover:text-heading",
                        ].join(" ")}
                        aria-label={section.label}
                      >
                        <SectionIcon
                          className="h-[18px] w-[18px]"
                          strokeWidth={1.75}
                          aria-hidden
                        />
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
                        sectionActive
                          ? "bg-primary/10 text-primary"
                          : "text-text/75 hover:bg-tint hover:text-heading",
                      ].join(" ")}
                      aria-expanded={isOpen}
                      onClick={() => toggleSection(section.id)}
                    >
                      <SectionIcon
                        className="h-[18px] w-[18px] shrink-0"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                      <span className="flex-1 truncate">{section.label}</span>
                    </button>
                    {isOpen ? (
                      <div className="mt-1 flex flex-col gap-0.5 pl-2">
                        {section.items.map((item) => {
                          const active = isUserNavItemActive(location.pathname, item);
                          const ItemIcon = item.icon;
                          return (
                            <NavLink
                              key={item.id}
                              className={[
                                "flex items-center gap-2 rounded-2xl py-2 pl-3 pr-2 text-sm transition-colors",
                                active
                                  ? "bg-primary/10 font-semibold text-primary"
                                  : "text-text/75 hover:bg-tint hover:text-heading",
                              ].join(" ")}
                              end={Boolean(item.end)}
                              to={item.href}
                              aria-current={active ? "page" : undefined}
                              onClick={onMobileClose}
                            >
                              {ItemIcon ? (
                                <ItemIcon
                                  className="h-4 w-4 shrink-0"
                                  strokeWidth={1.75}
                                  aria-hidden
                                />
                              ) : null}
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
          </nav>
        </aside>
      </div>
    </>
  );
}

export default UserSidebar;
