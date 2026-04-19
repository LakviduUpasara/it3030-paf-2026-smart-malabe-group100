import { createContext, useCallback, useEffect, useMemo, useState } from "react";

/**
 * Theme context for the dashboards (admin, user, technician consoles).
 *
 * Values:
 *   theme   -> "light" | "dark"          — the active theme
 *   mode    -> "light" | "dark" | "system" — what the user chose
 *   setMode -> (mode) => void            — persist a new choice
 *   toggleTheme -> () => void            — quick flip light <-> dark
 *
 * Notes:
 *   - The selected mode is persisted in localStorage under "paf.theme".
 *   - When mode is "system", the theme follows prefers-color-scheme and
 *     reacts live when the OS changes. Explicit "light" / "dark" choices
 *     win over system.
 *   - The chosen theme is exposed on <html data-theme="…"> so the CSS
 *     variables in index.css pick it up without any component changes.
 */
export const ThemeContext = createContext({
  theme: "light",
  mode: "system",
  setMode: () => {},
  toggleTheme: () => {},
});

const STORAGE_KEY = "paf.theme";
const VALID_MODES = new Set(["light", "dark", "system"]);

function readStoredMode() {
  if (typeof window === "undefined") {
    return "system";
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return VALID_MODES.has(raw) ? raw : "system";
  } catch {
    return "system";
  }
}

function resolveSystemTheme() {
  if (typeof window === "undefined" || !window.matchMedia) {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => readStoredMode());
  const [systemTheme, setSystemTheme] = useState(() => resolveSystemTheme());

  // Track OS changes while in "system" mode so the dashboards react live.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return undefined;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (event) => setSystemTheme(event.matches ? "dark" : "light");
    media.addEventListener?.("change", handler);
    return () => media.removeEventListener?.("change", handler);
  }, []);

  const theme = useMemo(() => (mode === "system" ? systemTheme : mode), [mode, systemTheme]);

  // Mirror the chosen theme onto <html data-theme="…"> so :root / [data-theme="dark"]
  // overrides in index.css activate without any component edits.
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setMode = useCallback((next) => {
    const resolved = VALID_MODES.has(next) ? next : "system";
    setModeState(resolved);
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, resolved);
    } catch {
      /* Private mode / storage disabled — the in-memory state still updates. */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(theme === "dark" ? "light" : "dark");
  }, [theme, setMode]);

  const value = useMemo(
    () => ({ theme, mode, setMode, toggleTheme }),
    [theme, mode, setMode, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
