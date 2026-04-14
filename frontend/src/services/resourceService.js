import api, { createServiceError } from "./api";

function buildQueryParams(filters = {}) {
  const params = {};

  if (filters.type) {
    params.type = filters.type;
  }

  if (filters.location?.trim()) {
    params.location = filters.location.trim();
  }

  if (
    filters.minCapacity !== undefined &&
    filters.minCapacity !== null &&
    filters.minCapacity !== ""
  ) {
    params.minCapacity = filters.minCapacity;
  }

  return params;
}

export async function getResources(filters = {}) {
  try {
    const response = await api.get("/resources", {
      params: buildQueryParams(filters),
    });

    return response.data;
  } catch (error) {
    throw createServiceError(error, "Unable to load resources.");
  }
}

