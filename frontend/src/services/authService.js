import api, { createServiceError, requestWithFallback } from "./api";
import { buildMockGoogleUser } from "../utils/mockData";

export async function loginWithGoogle(role) {
  return requestWithFallback(
    () => api.post("/auth/google", { role }),
    () => buildMockGoogleUser(role),
    "Google sign-in failed.",
  );
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    if (error?.response && error.response.status !== 404) {
      throw createServiceError(error, "Logout failed.");
    }
  }
}

