import { Moon, Sun } from "lucide-react";
import useTheme from "../hooks/useTheme";

/**
 * Compact theme-toggle button for the dashboard top bars.
 *
 * Matches the existing 44x44 rounded-2xl control footprint used by the
 * notification bell and mobile menu buttons so it drops into any top bar
 * without layout shifts. Icon swaps via the `lucide-react` set for a premium,
 * Linear/Stripe-style feel in both themes.
 */
function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={isDark}
      title={isDark ? "Light theme" : "Dark theme"}
      onClick={toggleTheme}
      className={[
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-tint text-heading transition-colors hover:bg-slate-200/40",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isDark ? (
        <Sun className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
      ) : (
        <Moon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
      )}
    </button>
  );
}

export default ThemeToggle;
