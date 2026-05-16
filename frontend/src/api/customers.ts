import api from './axios';
import type { User } from '../types/auth';

export interface ClientePerfilUpdate {
  nombre?: string;
  telefono?: string | null;
  foto_url?: string | null;
  fecha_nacimiento?: string | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export const customerApi = {
  /** Inicia sesión y devuelve tokens (sin datos de usuario) */
  login: async (email: string, password: string): Promise<AuthTokens> => {
    const response = await api.post('/api/v1/auth/login', { email, password });
    return response.data;
  },

  /** Registra un nuevo usuario y devuelve sus datos */
  register: async (nombre: string, email: string, password: string, telefono?: string): Promise<User> => {
    const response = await api.post('/api/v1/auth/register', { nombre, email, password, telefono });
    return response.data;
  },

  /** Refresca el access token usando el refresh token */
  refresh: async (refreshToken: string): Promise<AuthTokens> => {
    const response = await api.post('/api/v1/auth/refresh', { refresh_token: refreshToken });
    return response.data;
  },

  /** Cierra sesión revocando el refresh token */
  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/api/v1/auth/logout', { refresh_token: refreshToken });
  },

  /** Obtiene el perfil completo del usuario autenticado */
  getProfile: async (): Promise<User> => {
    const response = await api.get('/api/v1/auth/me');
    return response.data;
  },

  /** Alias para getProfile — compatibilidad */
  getCurrentUser: async (): Promise<User> => {
    return customerApi.getProfile();
  },

  /** Actualiza el perfil del usuario autenticado */
  updateProfile: async (data: ClientePerfilUpdate): Promise<User> => {
    const response = await api.patch('/api/v1/auth/me', data);
    return response.data;
  },
};
