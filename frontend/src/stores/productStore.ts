import { create } from 'zustand';
import { Producto } from '../api/products';

interface ProductState {
  productos: Producto[];
  selectedProducto: Producto | null;
  isLoading: boolean;
  error: string | null;

  setProductos: (productos: Producto[]) => void;
  setSelectedProducto: (producto: Producto | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  addProducto: (producto: Producto) => void;
  updateProducto: (producto: Producto) => void;
  removeProducto: (id: number) => void;
  updateStock: (id: number, stock: number) => void;
}

export const useProductStore = create<ProductState>((set) => ({
  productos: [],
  selectedProducto: null,
  isLoading: false,
  error: null,

  setProductos: (productos) => set({ productos }),
  setSelectedProducto: (selectedProducto) => set({ selectedProducto }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  addProducto: (producto) =>
    set((state) => ({ productos: [...state.productos, producto] })),

  updateProducto: (updated) =>
    set((state) => ({
      productos: state.productos.map((p) =>
        p.id === updated.id ? updated : p
      ),
    })),

  removeProducto: (id) =>
    set((state) => ({
      productos: state.productos.filter((p) => p.id !== id),
    })),

  updateStock: (id, stock) =>
    set((state) => ({
      productos: state.productos.map((p) =>
        p.id === id ? { ...p, stock } : p
      ),
    })),
}));
