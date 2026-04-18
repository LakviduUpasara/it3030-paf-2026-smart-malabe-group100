import { useCallback, useEffect, useRef, useState } from "react";
import {
  getRecentNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
} from "../services/notificationApi";

/**
 * `useNotifications` — shared state for the bell icon used by both the user and admin top bars.
 *
 * Responsibilities:
 *  - fetch the unread count
 *  - fetch the latest N rows for the hover/click dropdown
 *  - poll in the background on a configurable interval
 *  - expose actions to mark one or all as read, plus a {@link refresh} helper
 *
 * Browser push permission is requested lazily; if it is denied, the hook still fills the dropdown
 * via the backend so the in-app bell keeps working.
 */
export function useNotifications({ limit = 6, pollMs = 30_000 } = {}) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const seenIdsRef = useRef(new Set());

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [recent, count] = await Promise.all([
        getRecentNotifications(limit),
        getUnreadCount(),
      ]);
      const rows = Array.isArray(recent) ? recent : [];
      setItems(rows);
      setUnread(Number(count || 0));
      maybeShowBrowserPush(rows, seenIdsRef);
    } catch (e) {
      setError(e?.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    refresh();
    if (!pollMs) {
      return undefined;
    }
    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, [refresh, pollMs]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }
    if (window.Notification.permission === "default") {
      try {
        window.Notification.requestPermission();
      } catch {
        /* denials are expected on some browsers, in-app panel still works */
      }
    }
  }, []);

  const markOneRead = useCallback(async (id) => {
    try {
      await markRead(id);
      setUnread((v) => Math.max(0, v - 1));
      setItems((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (e) {
      setError(e?.message || "Unable to mark notification as read.");
    }
  }, []);

  const markEveryoneRead = useCallback(async () => {
    try {
      await markAllRead();
      setUnread(0);
      setItems((list) => list.map((n) => ({ ...n, read: true })));
    } catch (e) {
      setError(e?.message || "Unable to mark all as read.");
    }
  }, []);

  return {
    items,
    unread,
    loading,
    error,
    refresh,
    markOneRead,
    markEveryoneRead,
    clearError: () => setError(""),
  };
}

function maybeShowBrowserPush(rows, seenIdsRef) {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }
  if (window.Notification.permission !== "granted") {
    return;
  }
  const unread = rows.filter((r) => !r.read);
  const next = new Set(unread.map((r) => r.id));
  const known = seenIdsRef.current;
  const freshIds = [...next].filter((id) => !known.has(id));
  seenIdsRef.current = next;
  if (!known.size) {
    // Seed set; do not flood on the very first poll.
    return;
  }
  for (const id of freshIds.slice(0, 3)) {
    const row = unread.find((r) => r.id === id);
    if (!row) continue;
    try {
      const note = new window.Notification(row.title || "Notification", {
        body: row.message || "",
        tag: row.id,
      });
      note.onclick = () => {
        window.focus();
        note.close();
      };
    } catch {
      /* fall back silently; the in-app panel stays in sync */
    }
  }
}

export default useNotifications;
