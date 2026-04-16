import api, { createServiceError } from "./api";

export async function resolveNotificationAudience(audience) {
  try {
    const { data } = await api.post("/notifications/audience", { audience });
    return data;
  } catch (e) {
    throw createServiceError(e, "Unable to resolve audience.");
  }
}

export async function sendNotificationEmails(payload) {
  try {
    await api.post("/notifications/email", payload);
  } catch (e) {
    throw createServiceError(e, "Unable to send notification emails.");
  }
}
