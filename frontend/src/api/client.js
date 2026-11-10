import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Interceptor to attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('udr_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor to handle responses and real backend errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('udr_token');
      localStorage.removeItem('udr_user');
      if (!window.location.hash.includes('/login')) {
        window.location.hash = '#/login';
      }
    }
    const message = error.response?.data?.detail || error.response?.data?.message || error.message || 'Operation failed';
    return Promise.reject(new Error(message));
  }
);

export default api;
