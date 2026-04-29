import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  // Aquí se inyectará el token desde authStore.getState().accessToken
  return config;
});

export default api;
