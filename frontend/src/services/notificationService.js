import api, { requestWithFallback } from "./api";
import { mockNotifications } from "../utils/mockData";

export async function getNotifications() {
  return requestWithFallback(
    () => api.get("/notifications"),
    () => [...mockNotifications],
    "Unable to load notifications.",
  );
}

