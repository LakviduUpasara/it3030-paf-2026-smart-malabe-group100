import request from "./api";

export function fetchHealthStatus() {
  return request("/health");
}

export function fetchMessages() {
  return request("/messages");
}

