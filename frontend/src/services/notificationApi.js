import api from "./api";

/**
 * Frontend service for the v1 Notification Module.
 *
 * User endpoints (`/api/v1/notifications/*`):
 *   - getMyNotifications({ unread, page, size })
 *   - getUnreadCount()
 *   - markRead(id)
 *   - markAllRead()
 *   - deleteNotification(id)
 *
 * Admin endpoints (`/api/v1/admin/notifications/*`, `/api/v1/admin/notification-settings`):
 *   - sendAdminBroadcast(payload)
 *   - getAdminHistory({ page, size })
 *   - getNotificationSettings()
 *   - updateNotificationSettings(patch)
 *
 * All calls unwrap the standard `ApiResponse<T>` envelope and return the inner `data`.
 */

function unwrap(response) {
  const payload = response?.data;
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }
  return payload;
}

function toError(error, fallback) {
  const serverMsg = error?.response?.data?.message;
  const err = new Error(serverMsg || error?.message || fallback);
  err.status = error?.response?.status;
  err.cause = error;
  return err;
}

export async function getMyNotifications({ unread = false, page = 0, size = 20 } = {}) {
  try {
    const res = await api.get("/notifications", { params: { unread, page, size } });
    return unwrap(res);
  } catch (e) {
    throw toError(e, "Unable to load notifications.");
  }
}

export async function getUnreadCount() {
  try {
    const res = await api.get("/notifications/unread-count");
    const body = unwrap(res);
    return Number(body?.unreadCount ?? 0);
  } catch (e) {
    throw toError(e, "Unable to load unread count.");
  }
}

export async function markRead(id) {
  try {
    const res = await api.patch(`/notifications/${encodeURIComponent(id)}/read`);
    return unwrap(res);
  } catch (e) {
    throw toError(e, "Unable to mark notification as read.");
  }
}

export async function markAllRead() {
  try {
    const res = await api.patch("/notifications/read-all");
    return unwrap(res);
  } catch (e) {
    throw toError(e, "Unable to mark all notifications as read.");
  }
}

export async function deleteNotification(id) {
  try {
    await api.delete(`/notifications/${encodeURIComponent(id)}`);
  } catch (e) {
    throw toError(e, "Unable to delete notification.");
  }
}

// --- admin ----------------------------------------------------------------

/**
 * @param {{ title: string, message: string, audienceRoles: ("ADMIN"|"USER"|"TECHNICIAN")[],
 *           channel?: "WEB"|"EMAIL"|"BOTH", priority?: "LOW"|"NORMAL"|"HIGH" }} payload
 */
export async function sendAdminBroadcast(payload) {
  try {
    const res = await api.post("/admin/notifications", payload);
    return unwrap(res);
  } catch (e) {
    throw toError(e, "Unable to send notification.");
  }
}

export async function getAdminHistory({ page = 0, size = 50 } = {}) {
  try {
    const res = await api.get("/admin/notifications/history", { params: { page, size } });
    return unwrap(res);
  } catch (e) {
    throw toError(e, "Unable to load notification history.");
  }
}

export async function getNotificationSettings() {
  try {
    const res = await api.get("/admin/notification-settings");
    return unwrap(res);
  } catch (e) {
    throw toError(e, "Unable to load notification settings.");
  }
}

/** @param {Partial<{ webEnabled: boolean, emailEnabled: boolean, browserPushSupported: boolean, bookingCategoryEnabled: boolean, ticketCategoryEnabled: boolean, systemCategoryEnabled: boolean }>} patch */
export async function updateNotificationSettings(patch) {
  try {
    const res = await api.put("/admin/notification-settings", patch ?? {});
    return unwrap(res);
  } catch (e) {
    throw toError(e, "Unable to update notification settings.");
  }
}
