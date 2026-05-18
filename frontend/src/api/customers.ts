import api from './axios';
import type { User, AuthToken, LoginResponse } from '../types/auth';

export interface ClientePerfilUpdate {
  nombre?: string;
  telefono?: string | null;
  foto_url?: string | null;
  fecha_nacimiento?: string | null;
}

export const customerApi = {
  /** Inicia sesión y devuelve tokens + datos del usuario */
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  /** Registra un nuevo usuario y devuelve sus datos */
  register: async (nombre: string, email: string, password: string, telefono?: string): Promise<User> => {
    const response = await api.post('/auth/register', { nombre, email, password, telefono });
    return response.data;
  },

  /** Refresca el access token usando el refresh token */
  refresh: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },

  /** Cierra sesión revocando el refresh token */
  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/auth/logout', { refresh_token: refreshToken });
  },

  /** Obtiene el perfil completo del usuario autenticado */
  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /** Alias para getProfile — compatibilidad */
  getCurrentUser: async (): Promise<User> => {
    return customerApi.getProfile();
  },

  /** Actualiza el perfil del usuario autenticado */
  updateProfile: async (data: ClientePerfilUpdate): Promise<User> => {
    const response = await api.patch('/auth/me', data);
    return response.data;
  },
};
