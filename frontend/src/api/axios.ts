import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { customerApi } from './customers';
import { getTokens, saveTokens } from '../lib/auth';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15_000, // 15s timeout — evita que peticiones cuelguen para siempre
});

api.interceptors.request.use((config) => {
  // Lee de localStorage (vía getTokens) como fuente primaria,
  // fallback a zustand store para compatibilidad.
  const { accessToken } = getTokens();
  const token = accessToken || useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshTimeoutId: NodeJS.Timeout | null = null;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

// TIMEOUT SAFEGUARD: If refresh takes > 10s, auto-reject queue
const setRefreshTimeout = () => {
  refreshTimeoutId = setTimeout(() => {
    if (isRefreshing) {
      // Force timeout — prevent indefinite hanging
      processQueue(new Error('Refresh timeout (10s)'), null);
      isRefreshing = false;
    }
  }, 10000);
};

const clearRefreshTimeout = () => {
  if (refreshTimeoutId) {
    clearTimeout(refreshTimeoutId);
    refreshTimeoutId = null;
  }
};

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

      // Si ya hay un refresh en curso, encolar esta request (debounce)
      if (isRefreshing) {
        // DEADLOCK PREVENTION: Si la request que falló ES el refresh mismo → no encolar
        if (originalRequest.url?.includes('/auth/refresh')) {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
          return Promise.reject(error);
        }
        
        // Encolar esta request para retry después del refresh
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      // Marcar que ya intentamos y comenzar refresh
      originalRequest._retry = true;
      isRefreshing = true;
      setRefreshTimeout();

      try {
        // El nuevo /auth/refresh devuelve user + tokens en una sola llamada
        const loginResponse = await customerApi.refresh(refreshToken);

        // Guardar nuevos tokens en localStorage
        saveTokens(loginResponse.access_token, loginResponse.refresh_token);

        // Actualizar auth store con usuario y token
        useAuthStore.getState().setAuth(loginResponse.access_token, loginResponse.user);

        // Procesar cola de requests pendientes con nuevo token
        processQueue(null, loginResponse.access_token);

        // Reintentar request original con nuevo token
        originalRequest.headers.Authorization = `Bearer ${loginResponse.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh falló (401, 500, network error, etc.)
        // → logout y limpiar cola (no reintentar indefinidamente)
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        return Promise.reject(refreshError);
      } finally {
        clearRefreshTimeout();
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
