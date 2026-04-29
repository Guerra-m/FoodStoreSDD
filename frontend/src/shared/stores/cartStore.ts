import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  productoId: number;
  nombre: string;
  cantidad: number;
  precio: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productoId: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.productoId !== id) })),
      clearCart: () => set({ items: [] }),
    }),
    { name: 'food-store-cart' }
  )
);
