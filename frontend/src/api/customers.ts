import api from './axios';

export interface ClientePerfil {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  foto_url: string | null;
  fecha_nacimiento: string | null;
  roles: string[];
  creado_en: string;
  actualizado_en: string;
}

export interface ClientePerfilUpdate {
  nombre?: string;
  telefono?: string | null;
  foto_url?: string | null;
  fecha_nacimiento?: string | null;
}

export const customerApi = {
  getProfile: async (): Promise<ClientePerfil> => {
    const response = await api.get('/api/v1/auth/me');
    return response.data;
  },

  updateProfile: async (data: ClientePerfilUpdate): Promise<ClientePerfil> => {
    const response = await api.patch('/api/v1/auth/me', data);
    return response.data;
  },
};
