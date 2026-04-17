export const STORAGE_KEYS = Object.freeze({
  USER: "smart-campus-user",
  SESSION: "smart-campus-session",
  SESSION_PHASE: "smart-campus-session-phase",
  PENDING_APPROVAL: "smart-campus-pending-approval",
  TWO_FACTOR_CHALLENGE: "smart-campus-two-factor",
});

export function readStorageValue(key) {
  const rawValue = window.localStorage.getItem(key);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    return rawValue;
  }
}

export function writeStorageValue(key, value) {
  if (value === null || value === undefined) {
    window.localStorage.removeItem(key);
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function clearStorage(key) {
  window.localStorage.removeItem(key);
}
