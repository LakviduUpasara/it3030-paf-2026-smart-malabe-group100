import api, { createServiceError } from "./api";

export async function getNotifications() {
  try {
    const { data } = await api.get("/notifications");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    throw createServiceError(error, "Unable to load notifications.");
  }
}
