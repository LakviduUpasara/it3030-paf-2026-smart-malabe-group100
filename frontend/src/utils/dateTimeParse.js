/**
 * Parses Spring/Jackson LocalDateTime JSON (ISO string or [y,m,d,h,m,s,nano] array).
 * @param {unknown} value
 * @returns {Date | null}
 */
export function parseBackendDateTime(value) {
  if (value == null) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : null;
  }
  if (typeof value === "string") {
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? new Date(ms) : null;
  }
  if (Array.isArray(value) && value.length >= 3) {
    const [y, month, day, hour = 0, minute = 0, second = 0, nano = 0] = value;
    return new Date(y, month - 1, day, hour, minute, second, Math.floor(nano / 1e6));
  }
  return null;
}

/** @param {number} ms */
export function formatCountdownMs(ms) {
  if (!Number.isFinite(ms) || ms <= 0) {
    return "0:00";
  }
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
