import api, { createServiceError } from "./api";

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function validateEmail(email, fallbackMessage) {
  if (!email) {
    return;
  }

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!isValidEmail) {
    throw new Error(fallbackMessage);
  }
}

/** Backend may send enum as string or `{ name: "AUTHENTICATED" }` depending on serializers. */
export function normalizeAuthStatus(raw) {
  if (raw == null) {
    return undefined;
  }
  if (typeof raw === "string") {
    return raw.trim();
  }
  if (typeof raw === "object" && raw !== null && typeof raw.name === "string") {
    return raw.name.trim();
  }
  return String(raw);
}

export async function loginWithCredentials({ email, password }) {
  const normalizedEmail = normalizeEmail(email || "");

  if (!normalizedEmail || !password?.trim()) {
    throw new Error("Email and password are required.");
  }

  validateEmail(normalizedEmail, "Enter a valid email address.");

  try {
    const response = await api.post("/auth/login", {
      email: normalizedEmail,
      password,
    });
    return response.data;
  } catch (error) {
    throw createServiceError(error, "Email login failed.");
  }
}

export async function registerAccount(payload) {
  const normalizedName = payload.fullName?.trim();
  const normalizedEmail = normalizeEmail(payload.email || "");
  const authProvider = payload.authProvider || "LOCAL";
  const requiresPassword = authProvider === "LOCAL";

  if (!normalizedName || !normalizedEmail || (requiresPassword && !payload.password?.trim())) {
    throw new Error("Complete the required sign up details to continue.");
  }

  validateEmail(normalizedEmail, "Enter a valid email address.");

  try {
    const twoFa = payload.preferredTwoFactorMethod || "EMAIL_OTP";
    const response = await api.post("/auth/register", {
      ...payload,
      fullName: normalizedName,
      email: normalizedEmail,
      preferredTwoFactorMethod: twoFa === "AUTHENTICATOR_APP" ? "AUTHENTICATOR_APP" : "EMAIL_OTP",
    });
    return response.data;
  } catch (error) {
    throw createServiceError(error, "Registration failed.");
  }
}

async function loginWithProvider(provider, email) {
  const normalizedEmail = normalizeEmail(email || "");

  validateEmail(
    normalizedEmail,
    `Enter a valid email address before using ${provider}.`,
  );

  try {
    const response = await api.post(`/auth/${provider}`, { email: normalizedEmail });
    return response.data;
  } catch (error) {
    throw createServiceError(error, `${provider} sign-in failed.`);
  }
}

export async function prepareGoogleSignup(credential) {
  if (!credential?.trim()) {
    throw new Error("Google sign-in did not return a valid credential.");
  }

  try {
    const response = await api.post("/auth/google/signup-session", {
      credential: credential.trim(),
    });
    return response.data;
  } catch (error) {
    throw createServiceError(error, "Unable to start Google sign up.");
  }
}

export async function loginWithGoogle(credential) {
  if (!credential?.trim()) {
    throw new Error("Google sign-in did not return a valid credential.");
  }

  try {
    const response = await api.post("/auth/google", {
      credential: credential.trim(),
    });
    return response.data;
  } catch (error) {
    throw createServiceError(error, "Google sign-in failed.");
  }
}

export async function loginWithApple(email) {
  return loginWithProvider("apple", email);
}

export async function verifyTwoFactor({ challengeId, code }) {
  try {
    const response = await api.post("/auth/verify-2fa", {
      challengeId,
      code,
    });
    return response.data;
  } catch (error) {
    throw createServiceError(error, "2-step verification failed.");
  }
}

export async function resendEmailOtp({ challengeId }) {
  if (!challengeId?.trim()) {
    throw new Error("Verification session is missing.");
  }
  try {
    const response = await api.post("/auth/resend-email-otp", {
      challengeId: challengeId.trim(),
    });
    return response.data;
  } catch (error) {
    throw createServiceError(error, "Unable to resend the verification code.");
  }
}

export async function changeFirstLoginPassword({ currentPassword, newPassword }) {
  if (!currentPassword?.trim() || !newPassword?.trim()) {
    throw new Error("Enter your current password and a new password.");
  }
  try {
    const response = await api.post("/auth/first-login/change-password", {
      currentPassword: currentPassword.trim(),
      newPassword: newPassword.trim(),
    });
    return response.data;
  } catch (error) {
    throw createServiceError(error, "Unable to update your password.");
  }
}

export async function getAuthSecurityHints() {
  try {
    const response = await api.get("/auth/security-hints");
    return response.data;
  } catch (error) {
    throw createServiceError(error, "Unable to load security options.");
  }
}

export async function skipFirstLoginTwoFactorExplicit() {
  try {
    const response = await api.post("/auth/first-login/skip-2fa");
    return response.data;
  } catch (error) {
    throw createServiceError(error, "Unable to skip 2-step verification.");
  }
}

export async function selectFirstLoginTwoFactor({ method, skipTwoFactor }) {
  if (skipTwoFactor) {
    try {
      const response = await api.post("/auth/first-login/select-2fa-method", { skipTwoFactor: true });
      return response.data;
    } catch (error) {
      throw createServiceError(error, "Unable to skip 2-step verification.");
    }
  }
  if (!method) {
    throw new Error("Choose email or authenticator verification, or skip 2-step verification.");
  }
  try {
    const response = await api.post("/auth/first-login/select-2fa-method", { method });
    return response.data;
  } catch (error) {
    throw createServiceError(error, "Unable to save your verification method.");
  }
}

export async function getCurrentSession() {
  try {
    const response = await api.get("/auth/me");
    return response.data;
  } catch (error) {
    throw createServiceError(error, "Unable to load the current session.");
  }
}

export async function getSignupRequestStatus({ requestId, email }) {
  try {
    const response = await api.get(`/auth/signup-requests/${requestId}/status`, {
      params: { email: normalizeEmail(email || "") },
    });
    return response.data;
  } catch (error) {
    throw createServiceError(error, "Unable to load the sign up request status.");
  }
}

export async function activateApprovedSignup({ requestId, email }) {
  try {
    const response = await api.post(
      `/auth/signup-requests/${requestId}/activate`,
      null,
      {
        params: { email: normalizeEmail(email || "") },
      },
    );
    return response.data;
  } catch (error) {
    throw createServiceError(error, "Unable to open the approved workspace.");
  }
}

export async function getPendingSignupRequests() {
  try {
    const response = await api.get("/admin/signup-requests");
    return response.data;
  } catch (error) {
    throw createServiceError(error, "Unable to load pending sign up requests.");
  }
}

export async function approveSignupRequest(requestId, payload) {
  try {
    const response = await api.post(`/admin/signup-requests/${requestId}/approve`, payload);
    return response.data;
  } catch (error) {
    throw createServiceError(error, "Unable to approve the sign up request.");
  }
}

export async function rejectSignupRequest(requestId, payload) {
  try {
    const response = await api.post(`/admin/signup-requests/${requestId}/reject`, payload);
    return response.data;
  } catch (error) {
    throw createServiceError(error, "Unable to reject the sign up request.");
  }
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    if (error?.response && ![401, 403, 404].includes(error.response.status)) {
      throw createServiceError(error, "Logout failed.");
    }
  }
}

export async function fetchHealthStatus() {
  try {
    // Resolve to /api/health (not /api/v1/health) so older backends that only expose /api/health still work.
    const response = await api.get("../health");
    return response.data;
  } catch (error) {
    throw createServiceError(error, "Unable to reach the campus API.");
  }
}

export async function devLogin({ email }) {
  const normalizedEmail = normalizeEmail(email || "");
  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }
  validateEmail(normalizedEmail, "Enter a valid email address.");

  try {
    const response = await api.post("/auth/dev-login", { email: normalizedEmail });
    return response.data;
  } catch (error) {
    throw createServiceError(error, "Developer sign-in failed.");
  }
}
