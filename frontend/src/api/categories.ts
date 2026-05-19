import api from './axios';

export interface Categoria {
  id: number;
  nombre: string;
  padre_id: number | null;
  posicion: number;
  product_count: number;
  creado_en: string;
  actualizado_en: string;
}

export interface CategoriaCreate {
  nombre: string;
  padre_id?: number | null;
  posicion?: number;
}

export interface CategoriaUpdate {
  nombre?: string;
  padre_id?: number | null;
  posicion?: number;
}

export interface CategoriaTree {
  id: number;
  nombre: string;
  padre_id: number | null;
  posicion: number;
  hijos: CategoriaTree[];
}

export const categoryApi = {
  getAll: async (padreId?: number): Promise<Categoria[]> => {
    const params = padreId ? { padre_id: padreId } : {};
    const response = await api.get('/categorias', { params });
    return response.data.categorias;
  },

  getTree: async (): Promise<CategoriaTree[]> => {
    const response = await api.get('/categorias/tree');
    return response.data;
  },

  getById: async (id: number): Promise<Categoria> => {
    const response = await api.get(`/categorias/${id}`);
    return response.data;
  },

  create: async (data: CategoriaCreate): Promise<Categoria> => {
    const response = await api.post('/categorias', data);
    return response.data;
  },

  update: async (id: number, data: CategoriaUpdate): Promise<Categoria> => {
    const response = await api.patch(`/categorias/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/categorias/${id}`);
  },
};