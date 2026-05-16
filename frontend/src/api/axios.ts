import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { customerApi } from './customers';
import { getTokens, saveTokens } from '../lib/auth';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  // Lee de sessionStorage (vía getTokens) como fuente primaria,
  // fallback a zustand store para compatibilidad.
  const { accessToken } = getTokens();
  const token = accessToken || useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    const originalRequest = error.config;

    // 401 especial: intentar refresh antes de hacer logout
    if (status === 401 && !originalRequest._retry) {
      const { refreshToken } = getTokens();

      if (!refreshToken) {
        // No hay refresh token, logout directo
        useAuthStore.getState().logout();
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        return Promise.reject(error);
      }

      // Si ya hay un refresh en curso, encolar esta request
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // El nuevo /auth/refresh devuelve user + tokens en una sola llamada
        const loginResponse = await customerApi.refresh(refreshToken);

        // Guardar nuevos tokens en sessionStorage
        saveTokens(loginResponse.access_token, loginResponse.refresh_token);

        // Actualizar auth store con usuario y token
        useAuthStore.getState().setAuth(loginResponse.access_token, loginResponse.user);

        // Procesar cola de requests pendientes
        processQueue(null, loginResponse.access_token);

        // Reintentar request original con nuevo token
        originalRequest.headers.Authorization = `Bearer ${loginResponse.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh falló → logout y limpiar cola
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Errores no-401: mostrar toasts según código
    switch (status) {
      case 403:
        toast.error("Sin permisos");
        break;
      case 422:
        toast.error(data?.detail || "Error de validación");
        break;
      case 500:
        toast.error("Error interno del servidor");
        break;
    }

    return Promise.reject(error);
  }
);

export default api;
