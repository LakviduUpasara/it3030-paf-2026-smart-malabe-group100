import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AdminShellProvider } from "../../context/AdminShellContext";
import AdminRouteReset from "./AdminRouteReset";
import AdminSidebar from "./AdminSidebar";
import AdminTopBar from "./AdminTopBar";

function AdminConsoleLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <AdminShellProvider>
    <div id="admin-root" className="min-h-screen">
      <AdminRouteReset />
      <div className="flex h-screen w-full min-h-0 flex-row overflow-hidden bg-bg font-sans text-text antialiased">
        <AdminSidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <AdminTopBar onMenuClick={() => setMobileNavOpen(true)} />
          <main className="min-h-0 flex-1 overflow-y-auto bg-bg pt-5 pb-10">
            <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10">
              <div className="space-y-6 lg:space-y-8">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
    </AdminShellProvider>
  );
}

export default AdminConsoleLayout;
