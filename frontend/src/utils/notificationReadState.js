const STORAGE_PREFIX = "paf-notif-read";

/**
 * @param {string | undefined} userId
 * @returns {Set<string>}
 */
export function getReadSet(userId) {
  if (!userId) {
    return new Set();
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}:${userId}`);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveReadSet(userId, set) {
  if (!userId) {
    return;
  }
  try {
    localStorage.setItem(`${STORAGE_PREFIX}:${userId}`, JSON.stringify([...set]));
  } catch {
    /* ignore quota */
  }
}

/**
 * Merge ids into the read set for this user (e.g. after opening the notifications page).
 * @param {string | undefined} userId
 * @param {string[]} ids
 */
export function mergeReadIds(userId, ids) {
  if (!userId || !ids?.length) {
    return;
  }
  const set = getReadSet(userId);
  let changed = false;
  for (const id of ids) {
    if (id && !set.has(id)) {
      set.add(id);
      changed = true;
    }
  }
  if (changed) {
    saveReadSet(userId, set);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("paf-notifications-read"));
    }
  }
}
