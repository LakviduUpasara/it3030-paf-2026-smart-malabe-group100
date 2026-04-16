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

export async function listModuleOfferings(query) {
  try {
    const { data } = await api.get(`/module-offerings${toParams(query)}`);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to load module offerings.");
  }
}

export async function getModuleOffering(id) {
  try {
    const { data } = await api.get(`/module-offerings/${encodeURIComponent(id)}`);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to load module offering.");
  }
}

export async function createModuleOffering(payload) {
  try {
    const { data } = await api.post("/module-offerings", payload);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to create module offering.");
  }
}

export async function updateModuleOffering(id, payload) {
  try {
    const { data } = await api.put(`/module-offerings/${encodeURIComponent(id)}`, payload);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to update module offering.");
  }
}

export async function deleteModuleOffering(id) {
  try {
    await api.delete(`/module-offerings/${encodeURIComponent(id)}`);
  } catch (e) {
    throw createServiceError(e, "Unable to delete module offering.");
  }
}

/** GET /catalog/modules/applicable — facultyCode, degreeId, term required */
export async function listApplicableModules(query) {
  try {
    const { data } = await api.get(`/catalog/modules/applicable${toParams(query)}`);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to load applicable modules.");
  }
}

export async function eligibleLecturers(query) {
  try {
    const { data } = await api.get(`/module-offerings/eligible-lecturers${toParams(query)}`);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to load eligible lecturers.");
  }
}

export async function eligibleLabAssistants(query) {
  try {
    const { data } = await api.get(`/module-offerings/eligible-lab-assistants${toParams(query)}`);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to load eligible lab assistants.");
  }
}
