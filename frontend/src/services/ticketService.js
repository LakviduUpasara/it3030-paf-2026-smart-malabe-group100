import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080",
});

// CREATE
export const createTicket = (data) => API.post("/tickets", data);

// GET ALL
export const getTickets = () => API.get("/tickets");

// UPDATE STATUS
export const updateStatus = (id, status) =>
  API.put(`/tickets/${id}/status?status=${status}`);

// ADD UPDATE
export const addUpdate = (id, data) =>
  API.post(`/tickets/${id}/updates`, data);

// UPLOAD FILE
export const uploadFile = (id, file) => {
  const formData = new FormData();
  formData.append("file", file);

  return API.post(`/tickets/${id}/attachments`, formData);
};