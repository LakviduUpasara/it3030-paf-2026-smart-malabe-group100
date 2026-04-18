import api, { createServiceError } from "./api";

export async function loadPortalData(key) {
  try {
    const { data } = await api.get(`/portal-data/${encodeURIComponent(key)}`);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to load portal data.");
  }
}

export async function savePortalData(key, body) {
  try {
    const { data } = await api.put(`/portal-data/${encodeURIComponent(key)}`, body ?? {});
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to save portal data.");
  }
}
