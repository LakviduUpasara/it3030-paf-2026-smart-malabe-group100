import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAdminShell } from "../../context/AdminShellContext";

/** Clears breadcrumb "window" override when the path changes (modals should set it again). */
function AdminRouteReset() {
  const { pathname } = useLocation();
  const { setActiveWindow } = useAdminShell();

  useEffect(() => {
    setActiveWindow("");
  }, [pathname, setActiveWindow]);

  return null;
}

export default AdminRouteReset;
