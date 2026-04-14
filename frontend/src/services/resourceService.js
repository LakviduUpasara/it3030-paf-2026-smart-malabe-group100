import api, { createServiceError } from "./api";

const TEMP_ADMIN_AUTH = {
  username: "admin",
  password: "admin123",
};

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

export async function createResource(payload) {
  try {
    const response = await api.post("/resources", payload, {
      // TEMP: use backend basic auth for resource writes during development/testing.
      auth: TEMP_ADMIN_AUTH,
    });

    return response.data;
  } catch (error) {
    throw createServiceError(error, "Unable to create resource.");
  }
}

