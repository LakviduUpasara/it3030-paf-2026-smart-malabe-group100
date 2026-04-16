import api, { createServiceError } from "./api";

function toParams(query) {
  const p = new URLSearchParams();
  Object.entries(query || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      p.set(k, String(v));
    }
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}

export async function listIntakesPaged(query) {
  try {
    const { data } = await api.get(`/intakes${toParams(query)}`);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to load intakes.");
  }
}

export async function listIntakesDropdown(query) {
  try {
    const { data } = await api.get(`/intakes/dropdown${toParams(query)}`);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to load intakes.");
  }
}

export async function getIntakeDetail(id) {
  try {
    const { data } = await api.get(`/intakes/${encodeURIComponent(id)}/detail`);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to load intake.");
  }
}

export async function createIntake(payload) {
  try {
    const { data } = await api.post("/intakes", payload);
    return data;
  } catch (e) {
    throw createServiceError(e, "Failed to create intake.");
  }
}

export async function updateIntake(id, payload) {
  try {
    const { data } = await api.put(`/intakes/${encodeURIComponent(id)}`, payload);
    return data;
  } catch (e) {
    throw createServiceError(e, "Failed to update intake.");
  }
}

export async function deleteIntake(id) {
  try {
    await api.delete(`/intakes/${encodeURIComponent(id)}`);
  } catch (e) {
    throw createServiceError(e, "Unable to delete intake.");
  }
}
