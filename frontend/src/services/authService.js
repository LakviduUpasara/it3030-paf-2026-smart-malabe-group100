import api, { createServiceError } from "./api";
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

/**
 * Flattens backend AuthFlowResponse into the shape stored in AuthContext (email/role at top level + token).
 */
export function mapAuthFlowToAuthUser(data) {
  if (!data || typeof data !== "object") {
    return data;
  }

  if (!data.authStatus) {
    return data;
  }

  if (data.authStatus === "AUTHENTICATED" && data.user && data.token) {
    const u = data.user;
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      provider: u.provider,
      status: u.status,
      token: data.token,
    };
  }

  const message = data.message || "Sign-in could not be completed.";
  throw new Error(message);
}

export async function loginWithCredentials({ email, password }) {
  const normalizedEmail = normalizeEmail(email || "");

  try {
    const response = await api.post("/auth/login", { email: normalizedEmail, password });
    return mapAuthFlowToAuthUser(response.data);
  } catch (error) {
    if (!error?.response || error.response.status === 404) {
      if (!normalizedEmail || !password?.trim()) {
        throw new Error("Email and password are required.");
      }

      validateEmail(normalizedEmail, "Enter a valid email address.");

      return buildMockAuthenticatedUser({
        email: normalizedEmail,
        provider: "credentials",
      });
    }
    throw createServiceError(error, "Email login failed.");
  }
}

export async function registerAccount({ name, email, password }) {
  const normalizedEmail = normalizeEmail(email || "");
  const normalizedName = name?.trim();

  try {
    const response = await api.post("/auth/register", {
      name: normalizedName,
      email: normalizedEmail,
      password,
    });
    return mapAuthFlowToAuthUser(response.data);
  } catch (error) {
    if (!error?.response || error.response.status === 404) {
      if (!normalizedName || !normalizedEmail || !password?.trim()) {
        throw new Error("Name, email, and password are required.");
      }

      validateEmail(normalizedEmail, "Enter a valid email address.");

      return buildMockAuthenticatedUser({
        name: normalizedName,
        email: normalizedEmail,
        provider: "credentials",
      });
    }
    throw createServiceError(error, "Registration failed.");
  }
}

async function loginWithProvider(provider, email) {
  const normalizedEmail = normalizeEmail(email || "user@smartcampus.edu");

  try {
    const response = await api.post(`/auth/${provider}`, { email: normalizedEmail });
    return mapAuthFlowToAuthUser(response.data);
  } catch (error) {
    if (!error?.response || error.response.status === 404) {
      validateEmail(
        normalizedEmail,
        `Enter a valid email address before using ${provider}.`,
      );

      return buildMockAuthenticatedUser({
        email: normalizedEmail,
        provider,
      });
    }
    throw createServiceError(error, `${provider} sign-in failed.`);
  }
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
