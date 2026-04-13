import { createContext, useState } from "react";
import * as authService from "../services/authService";
import { clearStorage, STORAGE_KEYS } from "../utils/storage";
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

  const clearError = () => {
    setError("");
  };

  const clearAuthState = () => {
    setUser(null);
    setSessionToken(null);
    setTwoFactorChallenge(null);
    clearStorage(STORAGE_KEYS.USER);
    clearStorage(STORAGE_KEYS.SESSION);
    clearStorage(STORAGE_KEYS.TWO_FACTOR_CHALLENGE);
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
        clearAuthState();
        setPendingApproval(response.pendingApproval);
        break;
      case "TWO_FACTOR_REQUIRED":
      case "AUTHENTICATOR_SETUP_REQUIRED":
        clearAuthState();
        setTwoFactorChallenge(response.twoFactorChallenge);
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

  const register = async (payload) =>
    performAuthAction(
      () => authService.registerAccount(payload),
      "Unable to submit your sign up request.",
    );

  const loginWithGoogle = async (email) =>
    performAuthAction(() => authService.loginWithGoogle(email), "Unable to sign in with Google.");

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
      clearAuthState();
      setIsLoading(false);
    }
  };

  const value = {
    user,
    sessionToken,
    pendingApproval,
    twoFactorChallenge,
    isAuthenticated: Boolean(user?.email && sessionToken),
    isLoading,
    error,
    clearError,
    clearPendingApproval,
    clearTwoFactor,
    login,
    register,
    loginWithGoogle,
    verifyTwoFactor,
    refreshPendingApproval,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
