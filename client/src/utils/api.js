// Axios instance pre-configured for the backend API
// Base URL comes from REACT_APP_API_URL (set per environment) and falls back to
// localhost:5000/api for local development if it's not set
// The request interceptor attaches the JWT token from localStorage to every request
// so protected routes receive the Authorization header without any extra work at the call site

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
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
