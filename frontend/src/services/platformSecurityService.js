import api, { createServiceError } from "./api";

export async function getPlatformSecuritySettings() {
  try {
    const { data } = await api.get("/admin/platform-settings");
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to load platform security settings.");
  }
}

export async function updatePlatformSecuritySettings(payload) {
  try {
    const { data } = await api.put("/admin/platform-settings", payload);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to save platform security settings.");
  }
}
