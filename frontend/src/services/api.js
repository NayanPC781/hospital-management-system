import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data)
};

export const doctorService = {
  getAll: () => api.get('/doctors'),
  getAllWithSchedules: () => api.get('/doctors/with-schedules'),
  getById: (id) => api.get(`/doctors/${id}`),
  add: (data) => api.post('/doctors', data),
  update: (id, data) => api.put(`/doctors/${id}`, data),
  updateSchedule: (id, schedule) => api.put(`/doctors/${id}/schedule`, { schedule }),
  getSchedule: (id) => api.get(`/doctors/${id}/schedule`),
  delete: (id) => api.delete(`/doctors/${id}`)
};

export const appointmentService = {
  getAll: () => api.get('/appointments'),
  book: (data) => api.post('/appointments', data),
  updateStatus: (id, status) => api.put(`/appointments/${id}/status`, { status }),
  reschedule: (id, data) => api.patch(`/appointments/${id}/reschedule`, data),
  cancel: (id) => api.delete(`/appointments/${id}`)
};

export default api;
