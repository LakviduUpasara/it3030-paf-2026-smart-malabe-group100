import api, { createServiceError } from "./api";

async function getOrThrow(request, fallbackMessage) {
  try {
    return await request();
  } catch (error) {
    throw createServiceError(error, fallbackMessage);
  }
}

export const getCategories = () =>
  getOrThrow(() => api.get("/categories"), "Unable to load categories.");

export const getSubCategories = (categoryId) =>
  getOrThrow(
    () => api.get(`/categories/${categoryId}/subcategories`),
    "Unable to load subcategories.",
  );

export const createCategory = (payload) =>
  getOrThrow(
    () => api.post("/categories", payload),
    "Unable to create category.",
  );

export const updateCategory = (id, payload) =>
  getOrThrow(
    () => api.put(`/categories/${id}`, payload),
    "Unable to update category.",
  );

export const deleteCategory = (id) =>
  getOrThrow(
    () => api.delete(`/categories/${id}`),
    "Unable to delete category.",
  );

export const createSubCategory = (payload) =>
  getOrThrow(
    () => api.post("/subcategories", payload),
    "Unable to create subcategory.",
  );
