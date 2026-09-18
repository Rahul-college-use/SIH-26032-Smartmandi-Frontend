import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http:// 10.186.40.204:5000/api" || 'http://localhost:5000/api';
// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 1. Request Interceptor: Attach bearer token dynamically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Handle token expiry (401) smoothly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expire ya invalid ho gaya
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Agar user login/register page par na ho toh login par redirect karein
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;