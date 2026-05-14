import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'react-toastify'; // Asumiendo que usas react-toastify

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 401:
          useAuthStore.getState().logout();
          // No usamos window.location.href porque causa recarga completa de página
          // y genera un ciclo infinito con la doble fuente de estado.
          // Disparamos un evento custom para que AuthContext reaccione.
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
          break;
        case 403:
          toast.error("Sin permisos");
          break;
        case 422:
          const msg = data.detail || "Error de validación";
          toast.error(msg);
          break;
        case 500:
          toast.error("Error interno del servidor");
          break;
        default:
          break;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
