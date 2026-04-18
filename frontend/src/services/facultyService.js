import api, { createServiceError } from "./api";

export async function listFaculties() {
  try {
    const { data } = await api.get("/faculties");
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to load faculties.");
  }
}

export async function createFaculty(payload) {
  try {
    const { data } = await api.post("/faculties", payload);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to create faculty.");
  }
}

export async function updateFaculty(code, payload) {
  try {
    const { data } = await api.put(`/faculties/${encodeURIComponent(code)}`, payload);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to update faculty.");
  }
}

export async function deleteFaculty(code) {
  try {
    await api.delete(`/faculties/${encodeURIComponent(code)}`);
  } catch (e) {
    throw createServiceError(e, "Unable to delete faculty.");
  }
}
