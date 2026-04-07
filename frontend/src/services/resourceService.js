import api, { requestWithFallback } from "./api";
import { mockResources } from "../utils/mockData";

export async function getResources() {
  return requestWithFallback(
    () => api.get("/resources"),
    () => [...mockResources],
    "Unable to load resources.",
  );
}

