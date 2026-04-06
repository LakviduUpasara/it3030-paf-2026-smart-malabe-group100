import { createContext, useState } from "react";
import { getStoredAuth, setStoredAuth } from "../utils/storage";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(getStoredAuth());

  const login = () => {
    setIsAuthenticated(true);
    setStoredAuth(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setStoredAuth(false);
  };

  const value = {
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
