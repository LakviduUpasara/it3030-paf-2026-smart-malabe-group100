import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

/**
 * Hook for reading/writing the active dashboard theme.
 *
 * Returns `{ theme, mode, setMode, toggleTheme }` from `ThemeProvider`.
 * Safe to call outside the provider — the default context keeps a working
 * light theme so the app still renders if the provider is ever missing.
 */
export function useTheme() {
  return useContext(ThemeContext);
}

export default useTheme;
