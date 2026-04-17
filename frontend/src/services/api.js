import axios from 'axios';

const API_BASE_URL = 'http://localhost:8082/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const bookingAPI = {
  createBooking: (data) => api.post('/bookings', data),
  getAllBookings: (params) => api.get('/bookings', { params }),
  getBookingsByUser: (userId) => api.get(`/bookings/user/${userId}`),
  approveBooking: (bookingId) => api.put(`/bookings/${bookingId}/approve`),
  rejectBooking: (bookingId) => api.put(`/bookings/${bookingId}/reject`),
  cancelBooking: (bookingId) => api.put(`/bookings/${bookingId}/cancel`),
  checkAvailability: (resourceId, start, end) => 
    api.get('/bookings/check', { params: { resourceId, start, end } }),
};

export const messageAPI = {
  getAllMessages: () => api.get('/v1/messages'),
  createMessage: (data) => api.post('/v1/messages', data),
};

export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
