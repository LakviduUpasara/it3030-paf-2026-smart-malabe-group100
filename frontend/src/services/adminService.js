import api, { createServiceError } from "./api";

export async function getTechnicians() {
  try {
    return await api.get("/admin/technicians");
  } catch (error) {
    throw createServiceError(error, "Unable to load technicians.");
  }
}
