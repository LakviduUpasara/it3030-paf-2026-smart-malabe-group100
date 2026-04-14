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
    const response = await api.post("/auth/register", {
      ...payload,
      fullName: normalizedName,
      email: normalizedEmail,
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
