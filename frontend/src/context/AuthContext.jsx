import { createContext, useState } from "react";
import * as authService from "../services/authService";
import { clearStorage } from "../utils/storage";
import { useLocalStorage } from "../hooks/useLocalStorage";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useLocalStorage("smart-campus-user", null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loginWithGoogle = async (role) => {
    setIsLoading(true);
    setError("");

    try {
      const authenticatedUser = await authService.loginWithGoogle(role);
      setUser(authenticatedUser);
      return authenticatedUser;
    } catch (loginError) {
      setError(loginError.message || "Unable to sign in.");
      throw loginError;
    } finally {
      setIsLoading(false);
    }
  };

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
    loginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
