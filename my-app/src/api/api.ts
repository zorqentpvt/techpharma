// api.ts
import axios, { AxiosInstance } from 'axios';

// Create an Axios instance
const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8080', // replace with your API base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token to every request
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage, cookie, or any state management
    const token = localStorage.getItem('token');

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Example API call
export const getUser = async () => {
  const response = await api.get('/user');
  return response.data;
};

export default api;
