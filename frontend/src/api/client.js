import axios from 'axios';

// All operational data must come from the API. Static demo fallbacks previously
// returned fabricated users, emergencies, stock, routes, and successful writes.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('udr_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('udr_token');
      localStorage.removeItem('udr_user');
      if (typeof window !== 'undefined' && !window.location.hash.includes('/login')) {
        window.location.hash = '#/login';
      }
    }
    const message = error.response?.data?.detail
      || error.response?.data?.message
      || (error.code === 'ERR_NETWORK'
        ? 'The UDRRMS API is unavailable. Start the backend and check VITE_API_BASE_URL.'
        : error.message)
      || 'Operation failed';
    return Promise.reject(new Error(message));
  }
);

export default api;
