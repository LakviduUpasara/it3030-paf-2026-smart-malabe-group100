import { createContext, useState } from "react";
import * as authService from "../services/authService";
import { clearStorage } from "../utils/storage";
import { useLocalStorage } from "../hooks/useLocalStorage";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useLocalStorage("smart-campus-user", null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const clearError = () => {
    setError("");
  };

  const authenticate = async (authAction, fallbackMessage) => {
    setIsLoading(true);
    setError("");

    try {
      const authenticatedUser = await authAction();
      setUser(authenticatedUser);
      return authenticatedUser;
    } catch (loginError) {
      setError(loginError.message || fallbackMessage);
      throw loginError;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) =>
    authenticate(
      () => authService.loginWithCredentials(credentials),
      "Unable to sign in.",
    );

  const loginWithGoogle = async (email) =>
    authenticate(() => authService.loginWithGoogle(email), "Unable to sign in with Google.");

  const loginWithApple = async (email) =>
    authenticate(() => authService.loginWithApple(email), "Unable to sign in with Apple.");

  const logout = async () => {
    setIsLoading(true);
    setError("");

    try {
      await authService.logout();
    } catch (logoutError) {
      setError(logoutError.message || "Unable to sign out cleanly.");
    } finally {
      setUser(null);
      clearStorage("smart-campus-user");
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated: Boolean(user?.email),
    isLoading,
    error,
    clearError,
    login,
    loginWithGoogle,
    loginWithApple,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
