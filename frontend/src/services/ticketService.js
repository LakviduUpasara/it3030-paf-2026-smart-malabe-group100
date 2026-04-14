import axios from "axios";
import api, { requestWithFallback, createServiceError } from "./api";
import { mockAssignedTickets, mockTickets } from "../utils/mockData";

const envTicket = import.meta.env.VITE_TICKET_API_BASE_URL;
const envApi = import.meta.env.VITE_API_BASE_URL || "";

const BASE_URL = (() => {
  if (envTicket) {
    return String(envTicket).replace(/\/$/, "");
  }
  if (envApi) {
    const trimmed = String(envApi).replace(/\/$/, "");
    return trimmed.replace(/\/api\/v1$/, "") || "http://localhost:8080";
  }
  return "http://localhost:8080";
})();

const ticketApi = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

export async function createTicket(payload) {
  try {
    const response = await ticketApi.post("/tickets", payload);
    return response.data;
  } catch (error) {
    throw createServiceError(error, "Unable to create ticket.");
  }
}

export async function getTickets() {
  try {
    const response = await ticketApi.get("/tickets");
    return response.data;
  } catch (error) {
    throw createServiceError(error, "Unable to load tickets.");
  }
}

export async function getTicketById(id) {
  try {
    const response = await ticketApi.get(`/tickets/${id}`);
    return response.data;
  } catch (error) {
    throw createServiceError(error, "Unable to load ticket.");
  }
}

export async function updateStatus(ticketId, status) {
  try {
    const response = await ticketApi.put(`/tickets/${ticketId}/status`, null, {
      params: { status },
    });
    return response.data;
  } catch (error) {
    throw createServiceError(error, "Unable to update status.");
  }
}

export async function addUpdate(ticketId, body) {
  try {
    const response = await ticketApi.post(`/tickets/${ticketId}/updates`, body);
    return response.data;
  } catch (error) {
    throw createServiceError(error, "Unable to add update.");
  }
}

export async function uploadFile(ticketId, file) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await ticketApi.post(`/tickets/${ticketId}/attachments`, formData);
    return response.data;
  } catch (error) {
    throw createServiceError(error, "Unable to upload file.");
  }
}

export default ticketApi;

/* Legacy helpers — used by existing pages until they switch to the API above */
export async function getMyTickets() {
  return requestWithFallback(
    () => api.get("/tickets/my"),
    () => [...mockTickets],
    "Unable to load tickets.",
  );
}

export async function getManagedTickets() {
  return requestWithFallback(
    () => api.get("/tickets"),
    () => [...mockTickets],
    "Unable to load managed tickets.",
  );
}

export async function getAssignedTickets() {
  return requestWithFallback(
    () => api.get("/tickets/assigned"),
    () => [...mockAssignedTickets],
    "Unable to load assigned tickets.",
  );
}

export async function resolveTicket(ticketId) {
  try {
    const response = await api.patch(`/tickets/${ticketId}/resolve`);
    return response.data;
  } catch (error) {
    if (!error?.response || error.response.status === 404) {
      return { success: true, ticketId, status: "Resolved" };
    }

    throw createServiceError(error, "Unable to update ticket.");
  }
}
