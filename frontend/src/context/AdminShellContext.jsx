import { createContext, useCallback, useContext, useMemo, useState } from "react";

const AdminShellContext = createContext(null);

export function AdminShellProvider({ children }) {
  const [activeWindow, setActiveWindowState] = useState("");

  const setActiveWindow = useCallback((label) => {
    setActiveWindowState(label ?? "");
  }, []);

  const value = useMemo(
    () => ({
      activeWindow,
      setActiveWindow,
    }),
    [activeWindow, setActiveWindow],
  );

  return <AdminShellContext.Provider value={value}>{children}</AdminShellContext.Provider>;
}

export function useAdminShell() {
  const ctx = useContext(AdminShellContext);
  if (!ctx) {
    return { activeWindow: "", setActiveWindow: () => {} };
  }
  return ctx;
}
