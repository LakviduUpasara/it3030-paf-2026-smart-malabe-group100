import api, { createServiceError } from "./api";
import {
  buildMockAuthFlowAuthenticated,
  buildMockPendingRegistrationFlow,
} from "../utils/mockData";

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

  try {
    const response = await api.post("/auth/login", { email: normalizedEmail, password });
    return response.data;
  } catch (error) {
    if (!error?.response || error.response.status === 404) {
      if (!normalizedEmail || !password?.trim()) {
        throw new Error("Email and password are required.");
      }

      validateEmail(normalizedEmail, "Enter a valid email address.");

      return buildMockAuthFlowAuthenticated({
        email: normalizedEmail,
        provider: "credentials",
      });
    }
    throw createServiceError(error, "Email login failed.");
  }
}

export async function registerAccount(payload) {
  const normalizedEmail = normalizeEmail(payload?.email || "");
  const normalizedName = (payload?.fullName || payload?.name || "").trim();
  const password = payload?.password;

  try {
    const response = await api.post("/auth/register", {
      name: normalizedName,
      email: normalizedEmail,
      password,
    });
    return response.data;
  } catch (error) {
    if (!error?.response || error.response.status === 404) {
      if (!normalizedName || !normalizedEmail || !password?.trim()) {
        throw new Error("Name, email, and password are required.");
      }

      validateEmail(normalizedEmail, "Enter a valid email address.");

      return buildMockPendingRegistrationFlow({
        fullName: normalizedName,
        email: normalizedEmail,
        provider: payload?.authProvider || "LOCAL",
      });
    }
    throw createServiceError(error, "Registration failed.");
  }
}

async function loginWithProvider(provider, email) {
  const normalizedEmail = normalizeEmail(email || "user@smartcampus.edu");

  try {
    const response = await api.post(`/auth/${provider}`, { email: normalizedEmail });
    return response.data;
  } catch (error) {
    if (!error?.response || error.response.status === 404) {
      validateEmail(
        normalizedEmail,
        `Enter a valid email address before using ${provider}.`,
      );

      return buildMockAuthFlowAuthenticated({
        email: normalizedEmail,
        provider,
      });
    }
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
    // Health lives at `/api/health`; auth base is `/api/v1`, so go up one segment.
    const response = await api.get("../health");
    const body = response.data;
    const data = body?.data != null ? body.data : body;
    return {
      ...data,
      developerMode: data?.developerMode ?? body?.developerMode,
    };
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
