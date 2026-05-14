import api from './axios';

export interface ProductoIngredienteData {
  ingrediente_id: number;
  cantidad: number;
}

export interface ProductoCreate {
  nombre: string;
  descripcion?: string;
  price_in_cents: number;
  images?: string[];
  stock?: number;
  is_active?: boolean;
  categoria_ids?: number[];
  ingredientes?: ProductoIngredienteData[];
}

export interface ProductoIngredienteUpdate {
  ingrediente_id: number;
  cantidad?: number;
}

export interface ProductoUpdate {
  nombre?: string;
  descripcion?: string;
  price_in_cents?: number;
  images?: string[];
  is_active?: boolean;
  categoria_ids?: number[];
  ingredientes?: ProductoIngredienteUpdate[];
}

export interface StockUpdate {
  action: 'set' | 'increment' | 'decrement';
  value: number;
}

export interface ProductoIngredienteResponse {
  ingrediente_id: number;
  nombre: string;
  cantidad: number;
  unidad_medida: string;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  price_in_cents: number;
  images: string[];
  stock: number;
  is_active: boolean;
  categoria_ids: number[];
  ingredientes: ProductoIngredienteResponse[];
  creado_en: string;
  actualizado_en: string;
}

export interface ProductoPublic {
  id: number;
  nombre: string;
  descripcion: string | null;
  price_in_cents: number;
  images: string[];
  categoria_ids: number[];
  ingredientes: ProductoIngredienteResponse[];
}

export interface ProductoListResponse {
  productos: Producto[];
  total: number;
}

export interface ProductoPublicListResponse {
  productos: ProductoPublic[];
  total: number;
  page: number;
  per_page: number;
}

export interface ProductoFilters {
  categoria_id?: number;
  search?: string;
  min_price?: number;
  max_price?: number;
  page?: number;
  per_page?: number;
}

export const productApi = {
  // Admin endpoints
  getAll: async (page = 1, perPage = 20): Promise<ProductoListResponse> => {
    const response = await api.get('/api/v1/products', {
      params: { page, per_page: perPage },
    });
    return response.data;
  },

  getById: async (id: number): Promise<Producto> => {
    const response = await api.get(`/api/v1/products/${id}`);
    return response.data;
  },

  create: async (data: ProductoCreate): Promise<Producto> => {
    const response = await api.post('/api/v1/products', data);
    return response.data;
  },

  update: async (id: number, data: ProductoUpdate): Promise<Producto> => {
    const response = await api.patch(`/api/v1/products/${id}`, data);
    return response.data;
  },

  updateStock: async (id: number, data: StockUpdate): Promise<Producto> => {
    const response = await api.patch(`/api/v1/products/${id}/stock`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/v1/products/${id}`);
  },

  // Public endpoints
  getPublic: async (filters?: ProductoFilters): Promise<ProductoPublicListResponse> => {
    const response = await api.get('/api/v1/products/public', { params: filters });
    return response.data;
  },

  getPublicById: async (id: number): Promise<ProductoPublic> => {
    const response = await api.get(`/api/v1/products/public/${id}`);
    return response.data;
  },
};
