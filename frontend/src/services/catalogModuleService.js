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

export async function listCatalogModules(query) {
  try {
    const { data } = await api.get(`/catalog/modules${toParams(query)}`);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to load catalog modules.");
  }
}

export async function createCatalogModule(payload) {
  try {
    const { data } = await api.post("/catalog/modules", payload);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to create module.");
  }
}

export async function updateCatalogModule(code, payload) {
  try {
    const { data } = await api.put(`/catalog/modules/${encodeURIComponent(code)}`, payload);
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to update module.");
  }
}

export async function deleteCatalogModule(code) {
  try {
    await api.delete(`/catalog/modules/${encodeURIComponent(code)}`);
  } catch (e) {
    throw createServiceError(e, "Unable to delete module.");
  }
}
