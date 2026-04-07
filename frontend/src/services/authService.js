import api, { createServiceError, requestWithFallback } from "./api";
import { buildMockAuthenticatedUser } from "../utils/mockData";

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

  return requestWithFallback(
    () => api.post("/auth/login", { email: normalizedEmail, password }),
    () => {
      if (!normalizedEmail || !password?.trim()) {
        throw new Error("Email and password are required.");
      }

      validateEmail(normalizedEmail, "Enter a valid email address.");

      return buildMockAuthenticatedUser({
        email: normalizedEmail,
        provider: "credentials",
      });
    },
    "Email login failed.",
  );
}

async function loginWithProvider(provider, email) {
  const normalizedEmail = normalizeEmail(email || "user@smartcampus.edu");

  return requestWithFallback(
    () => api.post(`/auth/${provider}`, { email: normalizedEmail }),
    () => {
      validateEmail(
        normalizedEmail,
        `Enter a valid email address before using ${provider}.`,
      );

      return buildMockAuthenticatedUser({
        email: normalizedEmail,
        provider,
      });
    },
    `${provider} sign-in failed.`,
  );
}

export async function loginWithGoogle(email) {
  return loginWithProvider("google", email);
}

export async function loginWithApple(email) {
  return loginWithProvider("apple", email);
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
