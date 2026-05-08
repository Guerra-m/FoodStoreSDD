import { create } from 'zustand';
import { Categoria, CategoriaTree } from '../api/categoryApi';

interface CategoryState {
  categorias: Categoria[];
  categoriaTree: CategoriaTree[];
  selectedCategoria: Categoria | null;
  isLoading: boolean;
  error: string | null;

  setCategorias: (categorias: Categoria[]) => void;
  setCategoriaTree: (tree: CategoriaTree[]) => void;
  setSelectedCategoria: (categoria: Categoria | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  addCategoria: (categoria: Categoria) => void;
  updateCategoria: (categoria: Categoria) => void;
  removeCategoria: (id: number) => void;
}

export const useCategoryStore = create<CategoryState>((set) => ({
  categorias: [],
  categoriaTree: [],
  selectedCategoria: null,
  isLoading: false,
  error: null,

  setCategorias: (categorias) => set({ categorias }),
  setCategoriaTree: (categoriaTree) => set({ categoriaTree }),
  setSelectedCategoria: (selectedCategoria) => set({ selectedCategoria }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  addCategoria: (categoria) =>
    set((state) => ({ categorias: [...state.categorias, categoria] })),

  updateCategoria: (updated) =>
    set((state) => ({
      categorias: state.categorias.map((c) =>
        c.id === updated.id ? updated : c
      ),
    })),

  removeCategoria: (id) =>
    set((state) => ({
      categorias: state.categorias.filter((c) => c.id !== id),
    })),
}));