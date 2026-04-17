import { createContext, useEffect, useState } from "react";
import * as authService from "../services/authService";
import { clearStorage, STORAGE_KEYS } from "../utils/storage";

/** Fallback when /health cannot be reached (offline UI). Server APP_DEVELOPER_MODE is authoritative when health loads. */
const envDeveloperMode =
  String(import.meta.env.VITE_DEVELOPER_MODE ?? "")
    .trim()
    .toLowerCase() === "true";
import { useLocalStorage } from "../hooks/useLocalStorage";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useLocalStorage(STORAGE_KEYS.USER, null);
  const [sessionToken, setSessionToken] = useLocalStorage(STORAGE_KEYS.SESSION, null);
  const [pendingApproval, setPendingApproval] = useLocalStorage(
    STORAGE_KEYS.PENDING_APPROVAL,
    null,
  );
  const [twoFactorChallenge, setTwoFactorChallenge] = useLocalStorage(
    STORAGE_KEYS.TWO_FACTOR_CHALLENGE,
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [developerMode, setDeveloperMode] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const health = await authService.fetchHealthStatus();
        if (!cancelled) {
          // Must match backend: VITE_DEVELOPER_MODE alone must not show quick sign-in when API has dev mode off.
          setDeveloperMode(Boolean(health?.developerMode));
        }
      } catch {
        if (!cancelled) {
          setDeveloperMode(envDeveloperMode);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const clearError = () => {
    setError("");
  };

  const clearSessionState = () => {
    setUser(null);
    setSessionToken(null);
    setTwoFactorChallenge(null);
    clearStorage(STORAGE_KEYS.USER);
    clearStorage(STORAGE_KEYS.SESSION);
    clearStorage(STORAGE_KEYS.TWO_FACTOR_CHALLENGE);
  };

  const clearClientState = () => {
    clearSessionState();
    setPendingApproval(null);
    clearStorage(STORAGE_KEYS.PENDING_APPROVAL);
  };

  const applyAuthFlowResponse = (response) => {
    if (!response) {
      return response;
    }

    switch (response.authStatus) {
      case "AUTHENTICATED":
        setUser(response.user);
        setSessionToken(response.token);
        setPendingApproval(null);
        setTwoFactorChallenge(null);
        break;
      case "PENDING_APPROVAL":
        clearClientState();
        setPendingApproval(response.pendingApproval);
        break;
      case "TWO_FACTOR_REQUIRED":
      case "AUTHENTICATOR_SETUP_REQUIRED":
        setUser(null);
        setSessionToken(null);
        clearStorage(STORAGE_KEYS.USER);
        clearStorage(STORAGE_KEYS.SESSION);
        setPendingApproval(null);
        clearStorage(STORAGE_KEYS.PENDING_APPROVAL);
        if (response.twoFactorChallenge) {
          setTwoFactorChallenge(response.twoFactorChallenge);
        }
        break;
      default:
        break;
    }

    return response;
  };

  const performAuthAction = async (authAction, fallbackMessage) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await authAction();
      return applyAuthFlowResponse(response);
    } catch (requestError) {
      setError(requestError.message || fallbackMessage);
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) =>
    performAuthAction(
      () => authService.loginWithCredentials(credentials),
      "Unable to sign in.",
    );

  const devLogin = async (email) =>
    performAuthAction(() => authService.devLogin({ email }), "Unable to use developer sign-in.");

  const register = async (payload) =>
    performAuthAction(
      () => authService.registerAccount(payload),
      "Unable to submit your sign up request.",
    );

  const prepareGoogleSignup = async (credential) => {
    setIsLoading(true);
    setError("");

    try {
      return await authService.prepareGoogleSignup(credential);
    } catch (requestError) {
      setError(requestError.message || "Unable to start Google sign up.");
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (credential) =>
    performAuthAction(
      () => authService.loginWithGoogle(credential),
      "Unable to sign in with Google.",
    );

  const loginWithApple = async (email) =>
    performAuthAction(() => authService.loginWithApple(email), "Unable to sign in with Apple.");

  const verifyTwoFactor = async (payload) =>
    performAuthAction(
      () => authService.verifyTwoFactor(payload),
      "Unable to verify the second-factor code.",
    );

  const refreshPendingApproval = async (lookup) => {
    setIsLoading(true);
    setError("");

    try {
      const nextStatus = await authService.getSignupRequestStatus(lookup);
      setPendingApproval(nextStatus);
      return nextStatus;
    } catch (requestError) {
      setError(requestError.message || "Unable to refresh the approval status.");
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  };

  const activateApprovedSignup = async (lookup) =>
    performAuthAction(
      () => authService.activateApprovedSignup(lookup),
      "Unable to open the approved workspace.",
    );

  const clearPendingApproval = () => {
    setPendingApproval(null);
    clearStorage(STORAGE_KEYS.PENDING_APPROVAL);
  };

  const clearTwoFactor = () => {
    setTwoFactorChallenge(null);
    clearStorage(STORAGE_KEYS.TWO_FACTOR_CHALLENGE);
  };

  const logout = async () => {
    setIsLoading(true);
    setError("");

    try {
      await authService.logout();
    } catch (logoutError) {
      setError(logoutError.message || "Unable to sign out cleanly.");
    } finally {
      clearClientState();
      setIsLoading(false);
    }
  };

  const value = {
    user,
    sessionToken,
    pendingApproval,
    twoFactorChallenge,
    developerMode,
    isAuthenticated: Boolean(user?.email && sessionToken),
    isLoading,
    error,
    clearError,
    clearPendingApproval,
    clearTwoFactor,
    login,
    devLogin,
    register,
    prepareGoogleSignup,
    loginWithGoogle,
    loginWithApple,
    verifyTwoFactor,
    refreshPendingApproval,
    activateApprovedSignup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
