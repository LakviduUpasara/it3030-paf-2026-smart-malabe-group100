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

export async function listDegreePrograms(query) {
  try {
    const { data } = await api.get(`/degree-programs${toParams(query)}`);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to load degree programs.");
  }
}

export async function createDegreeProgram(payload) {
  try {
    const { data } = await api.post("/degree-programs", payload);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to create degree program.");
  }
}

export async function updateDegreeProgram(code, payload) {
  try {
    const { data } = await api.put(`/degree-programs/${encodeURIComponent(code)}`, payload);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to update degree program.");
  }
}

export async function deleteDegreeProgram(code) {
  try {
    await api.delete(`/degree-programs/${encodeURIComponent(code)}`);
  } catch (e) {
    throw createServiceError(e, "Unable to delete degree program.");
  }
}
