import { create } from 'zustand';

/**
 * Store para gestionar el estado de la UI global.
 * Controla elementos visuales transversales como el estado del sidebar o el carrito.
 */
interface UIState {
  cartOpen: boolean;
  toggleCart: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  cartOpen: false,
  // Alterna el estado de apertura del carrito
  toggleCart: () => set((state) => ({ cartOpen: !state.cartOpen })),
}));
