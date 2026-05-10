import api from './axios';

export interface Direccion {
  id: number;
  usuario_id: number;
  calle: string;
  numero: string;
  ciudad: string;
  provincia: string;
  codigo_postal: string;
  latitud: number | null;
  longitud: number | null;
  es_principal: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface DireccionCreate {
  calle: string;
  numero: string;
  ciudad: string;
  provincia: string;
  codigo_postal: string;
  latitud?: number | null;
  longitud?: number | null;
}

export interface DireccionUpdate {
  calle?: string;
  numero?: string;
  ciudad?: string;
  provincia?: string;
  codigo_postal?: string;
  latitud?: number | null;
  longitud?: number | null;
}

export const addressApi = {
  list: async (): Promise<Direccion[]> => {
    const response = await api.get('/api/v1/clientes/direcciones');
    return response.data;
  },

  create: async (data: DireccionCreate): Promise<Direccion> => {
    const response = await api.post('/api/v1/clientes/direcciones', data);
    return response.data;
  },

  update: async (id: number, data: DireccionUpdate): Promise<Direccion> => {
    const response = await api.put(`/api/v1/clientes/direcciones/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/clientes/direcciones/${id}`);
  },

  setPrincipal: async (id: number): Promise<Direccion> => {
    const response = await api.patch(`/api/v1/clientes/direcciones/${id}/principal`);
    return response.data;
  },
};
