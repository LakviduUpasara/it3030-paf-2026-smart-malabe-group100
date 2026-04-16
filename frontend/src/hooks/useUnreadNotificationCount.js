import { useCallback, useEffect, useState } from "react";
import { PORTAL_DATA_KEYS } from "../constants/portalDataKeys";
import { resolveNotificationsForUser } from "../models/notification-center";
import * as portalDataService from "../services/portalDataService";
import { getReadSet } from "../utils/notificationReadState";
import { useAuth } from "./useAuth";

export function useUnreadNotificationCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setCount(0);
      return;
    }
    try {
      const feedRaw = await portalDataService.loadPortalData(PORTAL_DATA_KEYS.notificationFeed).catch(() => []);
      const feed = Array.isArray(feedRaw) ? feedRaw : [];
      const viewer = { userId: user.id, appRole: user.role, role: user.role };
      const resolved = resolveNotificationsForUser(feed, viewer);
      const read = getReadSet(user.id);
      let unread = 0;
      for (const item of resolved) {
        if (item?.id && !read.has(item.id)) {
          unread += 1;
        }
      }
      if (user.role === "ADMIN") {
        const inboxRaw = await portalDataService
          .loadPortalData(PORTAL_DATA_KEYS.adminInboxNotifications)
          .catch(() => []);
        const inbox = Array.isArray(inboxRaw) ? inboxRaw : [];
        for (const row of inbox) {
          const id = row?.id != null ? `inbox-${row.id}` : null;
          if (id && !read.has(id)) {
            unread += 1;
          }
        }
      }
      setCount(unread);
    } catch {
      setCount(0);
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 60000);
    const onFocus = () => refresh();
    const onRead = () => refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener("paf-notifications-read", onRead);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("paf-notifications-read", onRead);
    };
  }, [refresh]);

  return count;
}
