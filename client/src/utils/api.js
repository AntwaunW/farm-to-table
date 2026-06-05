// Axios instance pre-configured for the backend API
// All requests automatically go to localhost:5000/api in development
// The request interceptor attaches the JWT token from localStorage to every request
// so protected routes receive the Authorization header without any extra work at the call site

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Attach the auth token to every outgoing request if the user is logged in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
