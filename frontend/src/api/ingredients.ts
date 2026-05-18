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
    const response = await api.get('/ingredientes');
    return response.data.ingredientes;
  },

  getById: async (id: number): Promise<Ingrediente> => {
    const response = await api.get(`/ingredientes/${id}`);
    return response.data;
  },

  create: async (data: IngredienteCreate): Promise<Ingrediente> => {
    const response = await api.post('/ingredientes', data);
    return response.data;
  },

  update: async (id: number, data: IngredienteUpdate): Promise<Ingrediente> => {
    const response = await api.patch(`/ingredientes/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/ingredientes/${id}`);
  },
};
