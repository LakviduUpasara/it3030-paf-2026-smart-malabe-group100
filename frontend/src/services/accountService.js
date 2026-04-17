import api, { createServiceError } from "./api";

export async function getSecuritySettings() {
  try {
    const response = await api.get("/account/security-settings");
    return response.data;
  } catch (error) {
    throw createServiceError(error, "Unable to load security settings.");
  }
}

export async function updateSecuritySettings(payload) {
  try {
    const response = await api.put("/account/security-settings", payload);
    return response.data;
  } catch (error) {
    throw createServiceError(error, "Unable to save security settings.");
  }
}

export async function startAuthenticatorEnrollment() {
  try {
    const response = await api.post("/account/security-settings/authenticator/start");
    return response.data;
  } catch (error) {
    throw createServiceError(error, "Unable to start authenticator setup.");
  }
}

export async function verifyAuthenticatorEnrollment(code) {
  try {
    const response = await api.post("/account/security-settings/authenticator/verify", { code: String(code).trim() });
    return response.data;
  } catch (error) {
    throw createServiceError(error, "Unable to verify authenticator code.");
  }
}

export async function resetAuthenticator() {
  try {
    const response = await api.post("/account/security-settings/authenticator/reset");
    return response.data;
  } catch (error) {
    throw createServiceError(error, "Unable to reset authenticator.");
  }
}

export async function dismissGoogleTwoFactorPrompt() {
  try {
    await api.post("/account/google-2fa-prompt/dismiss");
  } catch (error) {
    throw createServiceError(error, "Unable to dismiss the prompt.");
  }
}
