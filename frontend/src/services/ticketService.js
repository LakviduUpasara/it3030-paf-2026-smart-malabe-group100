import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080",
});

export const getTickets = () => API.get("/tickets");

export const getMyTickets = () => API.get("/tickets"); // ✅ ADD THIS

export const getManagedTickets = () => API.get("/tickets");

export const createTicket = (data) => API.post("/tickets", data);

export const updateStatus = (id, status) =>
  API.put(`/tickets/${id}/status?status=${status}`);

export const addUpdate = (id, data) =>
  API.post(`/tickets/${id}/updates`, data);

export const uploadFile = (id, file) => {
  const formData = new FormData();
  formData.append("file", file);

  return API.post(`/tickets/${id}/attachments`, formData);
};