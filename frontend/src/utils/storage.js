const AUTH_KEY = "smart-campus-auth";

export function getStoredAuth() {
  return window.localStorage.getItem(AUTH_KEY) === "true";
}

export function setStoredAuth(value) {
  window.localStorage.setItem(AUTH_KEY, String(value));
}

