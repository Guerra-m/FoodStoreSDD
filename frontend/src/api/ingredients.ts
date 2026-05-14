import api from './axios';

export interface Ingrediente {
  id: number;
  nombre: string;
  descripcion: string | null;
  unidad_medida: string;
  costo_unitario: number;
  creado_en: string;
  actualizado_en: string;
}

export interface IngredienteCreate {
  nombre: string;
  descripcion?: string;
  unidad_medida: string;
  costo_unitario?: number;
}

export interface IngredienteUpdate {
  nombre?: string;
  descripcion?: string;
  unidad_medida?: string;
  costo_unitario?: number;
}

export interface IngredienteListResponse {
  ingredientes: Ingrediente[];
  total: number;
}

export const ingredientApi = {
  getAll: async (): Promise<Ingrediente[]> => {
    const response = await api.get('/api/v1/ingredientes');
    return response.data.ingredientes;
  },

  getById: async (id: number): Promise<Ingrediente> => {
    const response = await api.get(`/api/v1/ingredientes/${id}`);
    return response.data;
  },

  create: async (data: IngredienteCreate): Promise<Ingrediente> => {
    const response = await api.post('/api/v1/ingredientes', data);
    return response.data;
  },

  update: async (id: number, data: IngredienteUpdate): Promise<Ingrediente> => {
    const response = await api.patch(`/api/v1/ingredientes/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/ingredientes/${id}`);
  },
};
