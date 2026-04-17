import api, { createServiceError } from "./api";

export async function getTechnicians() {
  try {
    return await api.get("/admin/technicians");
  } catch (error) {
    throw createServiceError(error, "Unable to load technicians.");
  }
}

export async function createTechnician(payload) {
  try {
    return await api.post("/admin/technicians", payload);
  } catch (error) {
    throw createServiceError(error, "Unable to create technician.");
  }
}

export async function updateTechnician(id, payload) {
  try {
    return await api.put(`/admin/technicians/${encodeURIComponent(String(id))}`, payload);
  } catch (error) {
    throw createServiceError(error, "Unable to update technician.");
  }
}

export async function deleteTechnician(id) {
  try {
    return await api.delete(`/admin/technicians/${encodeURIComponent(String(id))}`);
  } catch (error) {
    throw createServiceError(error, "Unable to delete technician.");
  }
}
